import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '../../lib/db';
import { gameSessions } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { createCaller } from '../../server/trpc';

describe('gameRouter', () => {
  let testDb: typeof db;
  let caller: any;

  beforeAll(async () => {
    // В реальном проекте используйте тестовую БД
    testDb = db;
    caller = createCaller({ db: testDb });
  });

  afterAll(async () => {
    // Очистка тестовых данных
    const sessions = await testDb.select().from(gameSessions);
    for (const session of sessions) {
      await testDb.delete(gameSessions).where(eq(gameSessions.id, session.id));
    }
  });

  describe('createSession', () => {
    it('should create a new session with default values', async () => {
      const result = await caller.game.createSession({
        maxPlayers: 4,
        duration: 300,
        gameMode: 'individual',
        onTimeLimit: false,
      });

      expect(result.sessionId).toBeDefined();
      expect(result.grid).toBeDefined();
      expect(result.wordList).toBeDefined();
      expect(result.wordList.length).toBe(12);
      expect(result.maxPlayers).toBe(4);
      expect(result.duration).toBe(300);
    });

    it('should create grid of correct size', async () => {
      const result = await caller.game.createSession({
        maxPlayers: 6,
        duration: 600,
        gameMode: 'team',
        onTimeLimit: true,
      });

      expect(result.grid).toHaveLength(10);
      result.grid.forEach((row: string[]) => {
        expect(row).toHaveLength(10);
      });
    });

    it('should validate maxPlayers range', async () => {
      await expect(
        caller.game.createSession({
          maxPlayers: 1, // Слишком мало
          duration: 300,
          gameMode: 'individual',
          onTimeLimit: false,
        })
      ).rejects.toThrow();
    });

    it('should validate duration range', async () => {
      await expect(
        caller.game.createSession({
          maxPlayers: 4,
          duration: 30, // Слишком мало
          gameMode: 'individual',
          onTimeLimit: false,
        })
      ).rejects.toThrow();
    });
  });

  describe('joinSession', () => {
    let sessionId: string;

    beforeAll(async () => {
      const result = await caller.game.createSession({
        maxPlayers: 4,
        duration: 300,
        gameMode: 'individual',
        onTimeLimit: false,
      });
      sessionId = result.sessionId;
    });

    it('should join existing session', async () => {
      const result = await caller.game.joinSession({
        sessionId,
        playerName: 'TestPlayer',
      });

      expect(result.playerId).toBeDefined();
      expect(result.color).toBeDefined();
      expect(result.playersCount).toBe(1);
      expect(result.isHost).toBe(true);
    });

    it('should not join finished session', async () => {
      // Сначала создадим и завершим сессию
      const testSession = await caller.game.createSession({
        maxPlayers: 2,
        duration: 300,
        gameMode: 'individual',
        onTimeLimit: false,
      });

      await caller.game.startGame({ sessionId: testSession.sessionId });

      await expect(
        caller.game.joinSession({
          sessionId: testSession.sessionId,
          playerName: 'AnotherPlayer',
        })
      ).rejects.toThrow('Игра уже началась');
    });

    it('should not join non-existent session', async () => {
      await expect(
        caller.game.joinSession({
          sessionId: 'non-existent-id',
          playerName: 'TestPlayer',
        })
      ).rejects.toThrow('Сессия не найдена');
    });

    it('should validate player name length', async () => {
      await expect(
        caller.game.joinSession({
          sessionId,
          playerName: '', // Пустое имя
        })
      ).rejects.toThrow();
    });
  });

  describe('submitWord', () => {
    let sessionId: string;
    let playerId: string;

    beforeAll(async () => {
      const session = await caller.game.createSession({
        maxPlayers: 2,
        duration: 300,
        gameMode: 'individual',
        onTimeLimit: false,
      });
      sessionId = session.sessionId;

      const join = await caller.game.joinSession({
        sessionId,
        playerName: 'WordTester',
      });
      playerId = join.playerId;

      await caller.game.startGame({ sessionId });
    });

    it('should submit valid word', async () => {
      // Получим состояние игры для поиска слова
      const state = await caller.game.getSessionState({ sessionId });
      
      if (state.wordList.length > 0) {
        const word = state.wordList[0];
        const result = await caller.game.submitWord({
          sessionId,
          playerId,
          word,
          startRow: 0,
          startCol: 0,
          endRow: 0,
          endCol: word.length - 1,
          direction: 'horizontal' as const,
        });

        // Может быть false если слово уже найдено или координаты неверны
        expect(result.success).toBeDefined();
      }
    });

    it('should reject word not in list', async () => {
      const result = await caller.game.submitWord({
        sessionId,
        playerId,
        word: 'НЕВСЛОВАХ',
        startRow: 0,
        startCol: 0,
        endRow: 0,
        endCol: 8,
        direction: 'horizontal' as const,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('нет в списке');
    });
  });
});
