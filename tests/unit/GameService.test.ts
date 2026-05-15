/**
 * Unit тесты для GameService
 * 
 * Покрытие тестами:
 * - createSession: валидация параметров, создание сессии
 * - joinSession: присоединение, проверка сессии, максимум игроков
 * - startGame: запуск игры, проверка хоста, минимум игроков
 * - submitWord: отправка слова, валидация, подсчёт очков
 * - finishGame: завершение игры, сохранение статистики
 * 
 * @example
 * ```bash
 * npm run test:vitest tests/unit/GameService.test.ts
 * ```
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppError } from '@/core/game/GameErrors';
import { GameService } from '@/core/game/GameService';
import type { GameRepository } from '@/core/game/GameRepository';
import type { GameSession, Player } from '@/core/game/types';

// Mock репозитория
const createMockRepository = (): GameRepository => ({
  createSession: vi.fn(),
  getSession: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
  addPlayer: vi.fn(),
  getPlayer: vi.fn(),
  getPlayersBySession: vi.fn(),
  updatePlayer: vi.fn(),
  addFoundWord: vi.fn(),
  getFoundWordsBySession: vi.fn(),
  wordExists: vi.fn(),
  recordMatchHistory: vi.fn(),
});

describe('GameService', () => {
  let mockRepository: GameRepository;
  let gameService: GameService;

  beforeEach(() => {
    mockRepository = createMockRepository();
    gameService = new GameService({ repository: mockRepository });
  });

  describe('createSession', () => {
    it('должен создать сессию с корректными параметрами', async () => {
      const mockSession: GameSession = {
        id: 'session-123',
        grid: [['A', 'B'], ['C', 'D']],
        wordList: ['ABC', 'BCD'],
        status: 'waiting',
        gameMode: 'individual',
        onTimeLimit: false,
        maxPlayers: 6,
        duration: 300,
        createdAt: new Date(),
        endsAt: null,
        rematchSessionId: null,
        hostUserId: null,
      };

      vi.mocked(mockRepository.createSession).mockResolvedValue(mockSession);

      const result = await gameService.createSession({
        maxPlayers: 4,
        duration: 300,
        gameMode: 'individual',
        onTimeLimit: false,
      });

      expect(result.id).toBe('session-123');
      expect(result.status).toBe('waiting');
      expect(mockRepository.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          maxPlayers: 4,
          duration: 300,
        })
      );
    });

    it('должен выбросить ошибку если maxPlayers < 2', async () => {
      await expect(
        gameService.createSession({
          maxPlayers: 1,
          duration: 300,
          gameMode: 'individual',
          onTimeLimit: false,
        })
      ).rejects.toThrow(AppError);
    });

    it('должен выбросить ошибку если duration < 60', async () => {
      await expect(
        gameService.createSession({
          maxPlayers: 4,
          duration: 30,
          gameMode: 'individual',
          onTimeLimit: false,
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('joinSession', () => {
    it('должен присоединить игрока к сессии', async () => {
      const mockSession: GameSession = {
        id: 'session-123',
        grid: [],
        wordList: [],
        status: 'waiting',
        gameMode: 'individual',
        onTimeLimit: false,
        maxPlayers: 6,
        duration: 300,
        createdAt: new Date(),
        endsAt: null,
        rematchSessionId: null,
        hostUserId: null,
      };

      const mockPlayer: Player = {
        id: 'player-123',
        name: 'Игрок1',
        isBot: false,
        color: '#FF006E',
        wordsFound: 0,
        firstWordTime: null,
        team: null,
        turnOrder: 0,
        status: 'joined',
        userId: null,
      };

      vi.mocked(mockRepository.getSession).mockResolvedValue(mockSession);
      vi.mocked(mockRepository.getPlayersBySession).mockResolvedValue([]);
      vi.mocked(mockRepository.addPlayer).mockResolvedValue(mockPlayer);

      const result = await gameService.joinSession({
        sessionId: 'session-123',
        playerName: 'Игрок1',
      });

      expect(result.player.id).toBe('player-123');
      expect(result.isHost).toBe(true);
      expect(result.playersCount).toBe(1);
    });

    it('должен выбросить ошибку если сессия не найдена', async () => {
      vi.mocked(mockRepository.getSession).mockResolvedValue(null);

      await expect(
        gameService.joinSession({
          sessionId: 'not-found',
          playerName: 'Игрок1',
        })
      ).rejects.toThrow('Сессия не найдена');
    });

    it('должен выбросить ошибку если игра уже началась', async () => {
      const mockSession: GameSession = {
        id: 'session-123',
        grid: [],
        wordList: [],
        status: 'in_progress',
        gameMode: 'individual',
        onTimeLimit: false,
        maxPlayers: 6,
        duration: 300,
        createdAt: new Date(),
        endsAt: new Date(),
        rematchSessionId: null,
        hostUserId: null,
      };

      vi.mocked(mockRepository.getSession).mockResolvedValue(mockSession);

      await expect(
        gameService.joinSession({
          sessionId: 'session-123',
          playerName: 'Игрок1',
        })
      ).rejects.toThrow('Игра уже началась');
    });

    it('должен выбросить ошибку если максимум игроков достигнут', async () => {
      const mockSession: GameSession = {
        id: 'session-123',
        grid: [],
        wordList: [],
        status: 'waiting',
        gameMode: 'individual',
        onTimeLimit: false,
        maxPlayers: 2,
        duration: 300,
        createdAt: new Date(),
        endsAt: null,
        rematchSessionId: null,
        hostUserId: null,
      };

      const existingPlayers: Player[] = [
        {
          id: 'player-1',
          name: 'Игрок1',
          isBot: false,
          color: '#FF006E',
          wordsFound: 0,
          firstWordTime: null,
          team: null,
          turnOrder: 0,
          status: 'joined',
          userId: null,
        },
        {
          id: 'player-2',
          name: 'Игрок2',
          isBot: false,
          color: '#3A86FF',
          wordsFound: 0,
          firstWordTime: null,
          team: null,
          turnOrder: 1,
          status: 'joined',
          userId: null,
        },
      ];

      vi.mocked(mockRepository.getSession).mockResolvedValue(mockSession);
      vi.mocked(mockRepository.getPlayersBySession).mockResolvedValue(existingPlayers);

      await expect(
        gameService.joinSession({
          sessionId: 'session-123',
          playerName: 'Игрок3',
        })
      ).rejects.toThrow('Максимум игроков достигнут');
    });
  });

  describe('startGame', () => {
    it('должен запустить игру', async () => {
      const mockSession: GameSession = {
        id: 'session-123',
        grid: [],
        wordList: [],
        status: 'waiting',
        gameMode: 'individual',
        onTimeLimit: false,
        maxPlayers: 6,
        duration: 300,
        createdAt: new Date(),
        endsAt: null,
        rematchSessionId: null,
        hostUserId: 'user-123',
      };

      const mockUpdatedSession: GameSession = {
        ...mockSession,
        status: 'in_progress',
        endsAt: new Date(),
      };

      const mockPlayers: Player[] = [
        {
          id: 'player-1',
          name: 'Игрок1',
          isBot: false,
          color: '#FF006E',
          wordsFound: 0,
          firstWordTime: null,
          team: null,
          turnOrder: 0,
          status: 'joined',
          userId: 'user-123',
        },
        {
          id: 'player-2',
          name: 'Игрок2',
          isBot: false,
          color: '#3A86FF',
          wordsFound: 0,
          firstWordTime: null,
          team: null,
          turnOrder: 1,
          status: 'joined',
          userId: 'user-456',
        },
      ];

      vi.mocked(mockRepository.getSession).mockResolvedValue(mockSession);
      vi.mocked(mockRepository.getPlayersBySession).mockResolvedValue(mockPlayers);
      vi.mocked(mockRepository.updateSession).mockResolvedValue(mockUpdatedSession);

      const result = await gameService.startGame('session-123', 'user-123');

      expect(result.status).toBe('in_progress');
      expect(mockRepository.updateSession).toHaveBeenCalled();
    });

    it('должен выбросить ошибку если не хост', async () => {
      const mockSession: GameSession = {
        id: 'session-123',
        grid: [],
        wordList: [],
        status: 'waiting',
        gameMode: 'individual',
        onTimeLimit: false,
        maxPlayers: 6,
        duration: 300,
        createdAt: new Date(),
        endsAt: null,
        rematchSessionId: null,
        hostUserId: 'user-123',
      };

      vi.mocked(mockRepository.getSession).mockResolvedValue(mockSession);

      await expect(
        gameService.startGame('session-123', 'user-456')
      ).rejects.toThrow('Только хост может запустить игру');
    });

    it('должен выбросить ошибку если меньше 2 игроков', async () => {
      const mockSession: GameSession = {
        id: 'session-123',
        grid: [],
        wordList: [],
        status: 'waiting',
        gameMode: 'individual',
        onTimeLimit: false,
        maxPlayers: 6,
        duration: 300,
        createdAt: new Date(),
        endsAt: null,
        rematchSessionId: null,
        hostUserId: 'user-123',
      };

      const mockPlayers: Player[] = [
        {
          id: 'player-1',
          name: 'Игрок1',
          isBot: false,
          color: '#FF006E',
          wordsFound: 0,
          firstWordTime: null,
          team: null,
          turnOrder: 0,
          status: 'joined',
          userId: 'user-123',
        },
      ];

      vi.mocked(mockRepository.getSession).mockResolvedValue(mockSession);
      vi.mocked(mockRepository.getPlayersBySession).mockResolvedValue(mockPlayers);

      await expect(
        gameService.startGame('session-123', 'user-123')
      ).rejects.toThrow('Нужно минимум 2 игрока');
    });
  });

  describe('submitWord', () => {
    it('должен засчитать найденное слово', async () => {
      const mockSession: GameSession = {
        id: 'session-123',
        grid: [],
        wordList: ['ТЕСТ', 'ИГРА'],
        status: 'in_progress',
        gameMode: 'individual',
        onTimeLimit: false,
        maxPlayers: 6,
        duration: 300,
        createdAt: new Date(),
        endsAt: new Date(),
        rematchSessionId: null,
        hostUserId: null,
      };

      const mockPlayer: Player = {
        id: 'player-1',
        name: 'Игрок1',
        isBot: false,
        color: '#FF006E',
        wordsFound: 1,
        firstWordTime: 10,
        team: null,
        turnOrder: 0,
        status: 'joined',
        userId: 'user-123',
      };

      vi.mocked(mockRepository.getSession).mockResolvedValue(mockSession);
      vi.mocked(mockRepository.wordExists).mockResolvedValue(false);
      vi.mocked(mockRepository.updatePlayer).mockResolvedValue(mockPlayer);
      vi.mocked(mockRepository.getPlayersBySession).mockResolvedValue([mockPlayer]);

      const result = await gameService.submitWord({
        sessionId: 'session-123',
        playerId: 'player-1',
        word: 'тест',
        startRow: 0,
        startCol: 0,
        endRow: 0,
        endCol: 3,
        direction: 'horizontal',
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('должен вернуть ошибку если слово не в списке', async () => {
      const mockSession: GameSession = {
        id: 'session-123',
        grid: [],
        wordList: ['ТЕСТ'],
        status: 'in_progress',
        gameMode: 'individual',
        onTimeLimit: false,
        maxPlayers: 6,
        duration: 300,
        createdAt: new Date(),
        endsAt: new Date(),
        rematchSessionId: null,
        hostUserId: null,
      };

      vi.mocked(mockRepository.getSession).mockResolvedValue(mockSession);

      const result = await gameService.submitWord({
        sessionId: 'session-123',
        playerId: 'player-1',
        word: 'НЕВСЕЛЕННАЯ',
        startRow: 0,
        startCol: 0,
        endRow: 0,
        endCol: 10,
        direction: 'horizontal',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Такого слова нет в списке');
    });

    it('должен вернуть ошибку если слово уже найдено', async () => {
      const mockSession: GameSession = {
        id: 'session-123',
        grid: [],
        wordList: ['ТЕСТ'],
        status: 'in_progress',
        gameMode: 'individual',
        onTimeLimit: false,
        maxPlayers: 6,
        duration: 300,
        createdAt: new Date(),
        endsAt: new Date(),
        rematchSessionId: null,
        hostUserId: null,
      };

      vi.mocked(mockRepository.getSession).mockResolvedValue(mockSession);
      vi.mocked(mockRepository.wordExists).mockResolvedValue(true);

      const result = await gameService.submitWord({
        sessionId: 'session-123',
        playerId: 'player-1',
        word: 'тест',
        startRow: 0,
        startCol: 0,
        endRow: 0,
        endCol: 3,
        direction: 'horizontal',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Это слово уже найдено');
    });

    it('должен корректно считать очки игрока', async () => {
      const mockSession: GameSession = {
        id: 'session-123',
        grid: [],
        wordList: ['ТЕСТ', 'ИГРА'],
        status: 'in_progress',
        gameMode: 'individual',
        onTimeLimit: false,
        maxPlayers: 6,
        duration: 300,
        createdAt: new Date(),
        endsAt: new Date(),
        rematchSessionId: null,
        hostUserId: null,
      };

      const mockPlayer: Player = {
        id: 'player-1',
        name: 'Игрок1',
        isBot: false,
        color: '#FF006E',
        wordsFound: 1,
        firstWordTime: 10,
        team: null,
        turnOrder: 0,
        status: 'joined',
        userId: 'user-123',
      };

      const mockFoundWords = [
        { id: 'word-1', sessionId: 'session-123', playerId: 'player-1', word: 'ТЕСТ', startRow: 0, startCol: 0, endRow: 0, endCol: 3, direction: 'horizontal' as const, path: [], foundAt: new Date() },
        { id: 'word-2', sessionId: 'session-123', playerId: 'player-2', word: 'ИГРА', startRow: 1, startCol: 1, endRow: 1, endCol: 4, direction: 'horizontal' as const, path: [], foundAt: new Date() },
      ];

      vi.mocked(mockRepository.getSession).mockResolvedValue(mockSession);
      vi.mocked(mockRepository.wordExists).mockResolvedValue(false);
      vi.mocked(mockRepository.updatePlayer).mockResolvedValue(mockPlayer);
      vi.mocked(mockRepository.getPlayersBySession).mockResolvedValue([mockPlayer]);
      vi.mocked(mockRepository.getFoundWordsBySession).mockResolvedValue(mockFoundWords);

      const result = await gameService.submitWord({
        sessionId: 'session-123',
        playerId: 'player-1',
        word: 'тест',
        startRow: 0,
        startCol: 0,
        endRow: 0,
        endCol: 3,
        direction: 'horizontal',
      });

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(result.results?.[0].wordsFound).toBe(1);
    });
  });

  describe('finishGame', () => {
    it('должен завершить игру и сохранить статистику', async () => {
      const mockSession: GameSession = {
        id: 'session-123',
        grid: [],
        wordList: ['ТЕСТ', 'ИГРА'],
        status: 'in_progress',
        gameMode: 'individual',
        onTimeLimit: false,
        maxPlayers: 6,
        duration: 300,
        createdAt: new Date(),
        endsAt: new Date(),
        rematchSessionId: null,
        hostUserId: null,
      };

      const mockPlayers: Player[] = [
        {
          id: 'player-1',
          name: 'Игрок1',
          isBot: false,
          color: '#FF006E',
          wordsFound: 2,
          firstWordTime: 10,
          team: null,
          turnOrder: 0,
          status: 'joined',
          userId: 'user-123',
        },
      ];

      const mockFoundWords = [
        { id: 'word-1', sessionId: 'session-123', playerId: 'player-1', word: 'ТЕСТ', startRow: 0, startCol: 0, endRow: 0, endCol: 3, direction: 'horizontal' as const, path: [], foundAt: new Date() },
        { id: 'word-2', sessionId: 'session-123', playerId: 'player-1', word: 'ИГРА', startRow: 1, startCol: 1, endRow: 1, endCol: 4, direction: 'horizontal' as const, path: [], foundAt: new Date() },
      ];

      vi.mocked(mockRepository.getSession).mockResolvedValue(mockSession);
      vi.mocked(mockRepository.updateSession).mockResolvedValue({ ...mockSession, status: 'finished' });
      vi.mocked(mockRepository.getPlayersBySession).mockResolvedValue(mockPlayers);
      vi.mocked(mockRepository.getFoundWordsBySession).mockResolvedValue(mockFoundWords);

      await gameService.finishGame('session-123');

      expect(mockRepository.updateSession).toHaveBeenCalledWith('session-123', { status: 'finished' });
      expect(mockRepository.recordMatchHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-123',
          playerName: 'Игрок1',
          wordsFound: 2,
          rank: 1,
        })
      );
    });

    it('не должен сохранять статистику если игра уже завершена', async () => {
      const mockSession: GameSession = {
        id: 'session-123',
        grid: [],
        wordList: [],
        status: 'finished',
        gameMode: 'individual',
        onTimeLimit: false,
        maxPlayers: 6,
        duration: 300,
        createdAt: new Date(),
        endsAt: new Date(),
        rematchSessionId: null,
        hostUserId: null,
      };

      vi.mocked(mockRepository.getSession).mockResolvedValue(mockSession);

      await gameService.finishGame('session-123');

      expect(mockRepository.updateSession).not.toHaveBeenCalled();
      expect(mockRepository.recordMatchHistory).not.toHaveBeenCalled();
    });
  });
});
