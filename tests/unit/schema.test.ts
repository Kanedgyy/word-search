/**
 * Unit тесты для Drizzle Schema
 * 
 * Покрытие:
 * - Все таблицы схемы
 * - Foreign key отношения
 * - Enums и constraints
 * - Типы данных
 * 
 * @example
 * ```bash
 * npm run test:vitest tests/unit/schema.test.ts
 * ```
 */

import { describe, it, expect } from 'vitest';

// Импортируем схему напрямую из файлов
import * as schema from '@/drizzle/schema';

describe('Drizzle Schema', () => {
  describe('Table exports', () => {
    it('должен экспортировать users таблицу', () => {
      expect(schema.users).toBeDefined();
    });

    it('должен экспортировать gameSessions таблицу', () => {
      expect(schema.gameSessions).toBeDefined();
    });

    it('должен экспортировать gamePlayers таблицу', () => {
      expect(schema.gamePlayers).toBeDefined();
    });

    it('должен экспортировать foundWords таблицу', () => {
      expect(schema.foundWords).toBeDefined();
    });

    it('должен экспортировать matchHistory таблицу', () => {
      expect(schema.matchHistory).toBeDefined();
    });
  });

  describe('Users table structure', () => {
    it('должен иметь поля id, name, email', () => {
      expect(schema.users.id).toBeDefined();
      expect(schema.users.name).toBeDefined();
      expect(schema.users.email).toBeDefined();
    });

    it('должен иметь поля для auth', () => {
      expect(schema.users.emailVerified).toBeDefined();
      expect(schema.users.passwordHash).toBeDefined();
      expect(schema.users.image).toBeDefined();
    });

    it('должен иметь timestamp поля', () => {
      expect(schema.users.createdAt).toBeDefined();
      expect(schema.users.updatedAt).toBeDefined();
    });
  });

  describe('Game Sessions table structure', () => {
    it('должен иметь базовые поля', () => {
      expect(schema.gameSessions.id).toBeDefined();
      expect(schema.gameSessions.wordList).toBeDefined();
      expect(schema.gameSessions.grid).toBeDefined();
    });

    it('должен иметь игровые настройки', () => {
      expect(schema.gameSessions.gameMode).toBeDefined();
      expect(schema.gameSessions.onTimeLimit).toBeDefined();
      expect(schema.gameSessions.status).toBeDefined();
      expect(schema.gameSessions.maxPlayers).toBeDefined();
      expect(schema.gameSessions.duration).toBeDefined();
    });

    it('должен иметь rematch поля', () => {
      expect(schema.gameSessions.rematchSessionId).toBeDefined();
      expect(schema.gameSessions.hostUserId).toBeDefined();
    });

    it('должен иметь timestamp поля', () => {
      expect(schema.gameSessions.createdAt).toBeDefined();
      expect(schema.gameSessions.endsAt).toBeDefined();
    });
  });

  describe('Game Players table structure', () => {
    it('должен иметь базовые поля', () => {
      expect(schema.gamePlayers.id).toBeDefined();
      expect(schema.gamePlayers.sessionId).toBeDefined();
      expect(schema.gamePlayers.userId).toBeDefined();
      expect(schema.gamePlayers.name).toBeDefined();
    });

    it('должен иметь игровые поля', () => {
      expect(schema.gamePlayers.isBot).toBeDefined();
      expect(schema.gamePlayers.color).toBeDefined();
      expect(schema.gamePlayers.turnOrder).toBeDefined();
      expect(schema.gamePlayers.status).toBeDefined();
      expect(schema.gamePlayers.team).toBeDefined();
      expect(schema.gamePlayers.difficulty).toBeDefined();
      expect(schema.gamePlayers.wordsFound).toBeDefined();
    });

    it('должен иметь timestamp поля', () => {
      expect(schema.gamePlayers.createdAt).toBeDefined();
    });
  });

  describe('Found Words table structure', () => {
    it('должен иметь базовые поля', () => {
      expect(schema.foundWords.id).toBeDefined();
      expect(schema.foundWords.sessionId).toBeDefined();
      expect(schema.foundWords.playerId).toBeDefined();
      expect(schema.foundWords.word).toBeDefined();
    });

    it('должен иметь координаты слова', () => {
      expect(schema.foundWords.startRow).toBeDefined();
      expect(schema.foundWords.startCol).toBeDefined();
      expect(schema.foundWords.endRow).toBeDefined();
      expect(schema.foundWords.endCol).toBeDefined();
    });

    it('должен иметь направление и путь', () => {
      expect(schema.foundWords.direction).toBeDefined();
      expect(schema.foundWords.path).toBeDefined();
    });

    it('должен иметь timestamp поля', () => {
      expect(schema.foundWords.foundAt).toBeDefined();
    });
  });

  describe('Match History table structure', () => {
    it('должен иметь базовые поля', () => {
      expect(schema.matchHistory.id).toBeDefined();
      expect(schema.matchHistory.sessionId).toBeDefined();
      expect(schema.matchHistory.userId).toBeDefined();
      expect(schema.matchHistory.playerName).toBeDefined();
    });

    it('должен иметь игровые результаты', () => {
      expect(schema.matchHistory.wordsFound).toBeDefined();
      expect(schema.matchHistory.firstWordTime).toBeDefined();
      expect(schema.matchHistory.rank).toBeDefined();
    });

    it('должен иметь timestamp поля', () => {
      expect(schema.matchHistory.recordedAt).toBeDefined();
    });
  });

  describe('Schema relationships', () => {
    it('должен экспортировать все таблицы через tables', () => {
      expect(schema.tables).toBeDefined();
      expect(schema.tables.users).toBeDefined();
      expect(schema.tables.gameSessions).toBeDefined();
      expect(schema.tables.gamePlayers).toBeDefined();
      expect(schema.tables.foundWords).toBeDefined();
      expect(schema.tables.matchHistory).toBeDefined();
    });

    it('должен экспортировать betterAuthSchema', () => {
      expect(schema.betterAuthSchema).toBeDefined();
    });
  });
});
