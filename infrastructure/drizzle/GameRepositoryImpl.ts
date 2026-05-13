/**
 * Реализация GameRepository с использованием Drizzle ORM
 */

import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/drizzle/schema';
import type { GameRepository } from '@/core/game/GameRepository';
import type { GameSession, Player, FoundWord } from '@/core/game/types';
import { AppError } from '@/core/game/GameErrors';

export class GameRepositoryImpl implements GameRepository {
  async createSession(session: Omit<GameSession, 'id' | 'createdAt'>): Promise<GameSession> {
    const [result] = await db
      .insert(schema.gameSessions)
      .values({
        wordList: session.wordList,
        grid: session.grid,
        gameMode: session.gameMode,
        onTimeLimit: session.onTimeLimit,
        status: session.status,
        maxPlayers: session.maxPlayers,
        duration: session.duration,
        hostUserId: session.hostUserId,
      })
      .returning();

    if (!result) {
      throw new AppError('VALIDATION_ERROR', 'Не удалось создать сессию');
    }

    return {
      ...result,
      createdAt: result.createdAt!,
      endsAt: result.endsAt,
      rematchSessionId: result.rematchSessionId,
    } as GameSession;
  }

  async getSession(sessionId: string): Promise<GameSession | null> {
    const result = await db.query.gameSessions.findFirst({
      where: eq(schema.gameSessions.id, sessionId),
    });

    if (!result) return null;

    return {
      ...result,
      createdAt: result.createdAt!,
      endsAt: result.endsAt,
      rematchSessionId: result.rematchSessionId,
    } as GameSession;
  }

  async updateSession(
    sessionId: string,
    updates: Partial<GameSession>
  ): Promise<GameSession | null> {
    const [result] = await db
      .update(schema.gameSessions)
      .set(updates)
      .where(eq(schema.gameSessions.id, sessionId))
      .returning();

    if (!result) return null;

    return {
      ...result,
      createdAt: result.createdAt!,
      endsAt: result.endsAt,
      rematchSessionId: result.rematchSessionId,
    } as GameSession;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const [result] = await db
      .delete(schema.gameSessions)
      .where(eq(schema.gameSessions.id, sessionId))
      .returning();

    return !!result;
  }

  async addPlayer(sessionId: string, player: Omit<Player, 'id'>): Promise<Player> {
    const [result] = await db
      .insert(schema.gamePlayers)
      .values({
        sessionId,
        userId: player.userId ?? null,
        name: player.name,
        isBot: player.isBot,
        color: player.color,
        turnOrder: player.turnOrder,
        status: player.status,
        firstWordTime: player.firstWordTime,
        team: player.team,
        difficulty: player.difficulty,
        wordsFound: player.wordsFound,
      })
      .returning();

    if (!result) {
      throw new AppError('VALIDATION_ERROR', 'Не удалось добавить игрока');
    }

    return {
      ...result,
      createdAt: result.createdAt!,
    } as Player;
  }

  async getPlayer(playerId: string): Promise<Player | null> {
    const result = await db.query.gamePlayers.findFirst({
      where: eq(schema.gamePlayers.id, playerId),
    });

    if (!result) return null;

    return {
      ...result,
      createdAt: result.createdAt!,
    } as Player;
  }

  async getPlayersBySession(sessionId: string): Promise<Player[]> {
    const results = await db.query.gamePlayers.findMany({
      where: eq(schema.gamePlayers.sessionId, sessionId),
      orderBy: desc(schema.gamePlayers.wordsFound),
    });

    return results.map(p => ({
      ...p,
      createdAt: p.createdAt!,
    })) as Player[];
  }

  async updatePlayer(playerId: string, updates: Partial<Player>): Promise<Player | null> {
    const [result] = await db
      .update(schema.gamePlayers)
      .set(updates)
      .where(eq(schema.gamePlayers.id, playerId))
      .returning();

    if (!result) return null;

    return {
      ...result,
      createdAt: result.createdAt!,
    } as Player;
  }

  async addFoundWord(word: Omit<FoundWord, 'id' | 'foundAt'>): Promise<FoundWord> {
    const [result] = await db
      .insert(schema.foundWords)
      .values({
        sessionId: word.sessionId,
        playerId: word.playerId,
        word: word.word,
        startRow: word.startRow,
        startCol: word.startCol,
        endRow: word.endRow,
        endCol: word.endCol,
        direction: word.direction,
        path: word.path,
      })
      .returning();

    if (!result) {
      throw new AppError('VALIDATION_ERROR', 'Не удалось добавить слово');
    }

    return {
      ...result,
      foundAt: result.foundAt!,
    } as FoundWord;
  }

  async getFoundWordsBySession(sessionId: string): Promise<FoundWord[]> {
    const results = await db.query.foundWords.findMany({
      where: eq(schema.foundWords.sessionId, sessionId),
    });

    return results.map(w => ({
      ...w,
      foundAt: w.foundAt!,
    })) as FoundWord[];
  }

  async wordExists(sessionId: string, word: string): Promise<boolean> {
    const result = await db.query.foundWords.findFirst({
      where: and(
        eq(schema.foundWords.sessionId, sessionId),
        eq(schema.foundWords.word, word)
      ),
    });

    return !!result;
  }

  async recordMatchHistory(data: {
    sessionId: string;
    userId: string | null;
    playerName: string;
    wordsFound: number;
    firstWordTime: number | null;
    rank: number;
  }): Promise<void> {
    await db.insert(schema.matchHistory).values({
      sessionId: data.sessionId,
      userId: data.userId,
      playerName: data.playerName,
      wordsFound: data.wordsFound,
      firstWordTime: data.firstWordTime,
      rank: data.rank,
    });
  }
}
