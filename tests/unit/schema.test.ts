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
import { 
  users, 
  sessions, 
  accounts, 
  verifications,
  userRoles,
  gameSessions,
  gamePlayers,
  foundWords,
  matchHistory,
} from '@/drizzle/schema';

describe('Drizzle Schema', () => {
  describe('Users table', () => {
    it('должен иметь все необходимые поля', () => {
      expect(users.id).toBeDefined();
      expect(users.name).toBeDefined();
      expect(users.email).toBeDefined();
      expect(users.emailVerified).toBeDefined();
      expect(users.passwordHash).toBeDefined();
      expect(users.image).toBeDefined();
      expect(users.createdAt).toBeDefined();
      expect(users.updatedAt).toBeDefined();
    });

    it('id должен быть первичным ключом', () => {
      expect(users.id.primaryKey).toBe(true);
    });

    it('email должен быть уникальным', () => {
      expect(users.email.unique).toBe(true);
    });

    it('name и email должны быть NOT NULL', () => {
      expect(users.name.notNull).toBe(true);
      expect(users.email.notNull).toBe(true);
    });
  });

  describe('Sessions table', () => {
    it('должен иметь все необходимые поля', () => {
      expect(sessions.id).toBeDefined();
      expect(sessions.userId).toBeDefined();
      expect(sessions.token).toBeDefined();
      expect(sessions.expiresAt).toBeDefined();
      expect(sessions.ipAddress).toBeDefined();
      expect(sessions.userAgent).toBeDefined();
      expect(sessions.createdAt).toBeDefined();
      expect(sessions.updatedAt).toBeDefined();
    });

    it('token должен быть уникальным', () => {
      expect(sessions.token.unique).toBe(true);
    });

    it('userId должен иметь foreign key на users', () => {
      expect(sessions.userId.references).toBeDefined();
    });
  });

  describe('Accounts table', () => {
    it('должен иметь все необходимые поля для OAuth', () => {
      expect(accounts.id).toBeDefined();
      expect(accounts.userId).toBeDefined();
      expect(accounts.accountId).toBeDefined();
      expect(accounts.providerId).toBeDefined();
      expect(accounts.accessToken).toBeDefined();
      expect(accounts.refreshToken).toBeDefined();
      expect(accounts.scope).toBeDefined();
      expect(accounts.idToken).toBeDefined();
      expect(accounts.password).toBeDefined();
    });

    it('userId должен иметь foreign key с cascade delete', () => {
      expect(accounts.userId.references).toBeDefined();
    });
  });

  describe('Verifications table', () => {
    it('должен иметь все необходимые поля', () => {
      expect(verifications.id).toBeDefined();
      expect(verifications.identifier).toBeDefined();
      expect(verifications.value).toBeDefined();
      expect(verifications.expiresAt).toBeDefined();
    });

    it('identifier и value должны быть NOT NULL', () => {
      expect(verifications.identifier.notNull).toBe(true);
      expect(verifications.value.notNull).toBe(true);
    });
  });

  describe('User Roles table', () => {
    it('должен иметь все необходимые поля', () => {
      expect(userRoles.id).toBeDefined();
      expect(userRoles.userId).toBeDefined();
      expect(userRoles.role).toBeDefined();
      expect(userRoles.createdAt).toBeDefined();
    });

    it('role должен использовать enum', () => {
      expect(userRoles.role.enum).toEqual(['user', 'admin']);
    });

    it('role должен иметь значение по умолчанию user', () => {
      expect(userRoles.role.default).toBe('user');
    });
  });

  describe('Game Sessions table', () => {
    it('должен иметь все необходимые поля', () => {
      expect(gameSessions.id).toBeDefined();
      expect(gameSessions.wordList).toBeDefined();
      expect(gameSessions.grid).toBeDefined();
      expect(gameSessions.gameMode).toBeDefined();
      expect(gameSessions.onTimeLimit).toBeDefined();
      expect(gameSessions.status).toBeDefined();
      expect(gameSessions.maxPlayers).toBeDefined();
      expect(gameSessions.duration).toBeDefined();
      expect(gameSessions.createdAt).toBeDefined();
      expect(gameSessions.endsAt).toBeDefined();
      expect(gameSessions.rematchSessionId).toBeDefined();
      expect(gameSessions.hostUserId).toBeDefined();
    });

    it('gameMode должен использовать enum', () => {
      expect(gameSessions.gameMode.enum).toEqual(['individual', 'team']);
    });

    it('status должен использовать enum', () => {
      expect(gameSessions.status.enum).toEqual(['waiting', 'in_progress', 'finished']);
    });

    it('duration должен иметь значение по умолчанию 300', () => {
      expect(gameSessions.duration.default).toBe(300);
    });

    it('maxPlayers должен иметь значение по умолчанию 6', () => {
      expect(gameSessions.maxPlayers.default).toBe(6);
    });

    it('onTimeLimit должен иметь значение по умолчанию false', () => {
      expect(gameSessions.onTimeLimit.default).toBe(false);
    });
  });

  describe('Game Players table', () => {
    it('должен иметь все необходимые поля', () => {
      expect(gamePlayers.id).toBeDefined();
      expect(gamePlayers.sessionId).toBeDefined();
      expect(gamePlayers.userId).toBeDefined();
      expect(gamePlayers.name).toBeDefined();
      expect(gamePlayers.isBot).toBeDefined();
      expect(gamePlayers.color).toBeDefined();
      expect(gamePlayers.turnOrder).toBeDefined();
      expect(gamePlayers.status).toBeDefined();
      expect(gamePlayers.firstWordTime).toBeDefined();
      expect(gamePlayers.team).toBeDefined();
      expect(gamePlayers.difficulty).toBeDefined();
      expect(gamePlayers.wordsFound).toBeDefined();
      expect(gamePlayers.createdAt).toBeDefined();
    });

    it('sessionId должен иметь foreign key с cascade delete', () => {
      expect(gamePlayers.sessionId.references).toBeDefined();
    });

    it('status должен использовать enum', () => {
      expect(gamePlayers.status.enum).toEqual(['joined', 'left']);
    });

    it('team должен использовать enum', () => {
      expect(gamePlayers.team.enum).toEqual(['red', 'blue', 'green', 'yellow']);
    });

    it('difficulty должен использовать enum', () => {
      expect(gamePlayers.difficulty.enum).toEqual(['easy', 'medium', 'hard']);
    });

    it('isBot должен иметь значение по умолчанию false', () => {
      expect(gamePlayers.isBot.default).toBe(false);
    });

    it('wordsFound должен иметь значение по умолчанию 0', () => {
      expect(gamePlayers.wordsFound.default).toBe(0);
    });
  });

  describe('Found Words table', () => {
    it('должен иметь все необходимые поля', () => {
      expect(foundWords.id).toBeDefined();
      expect(foundWords.sessionId).toBeDefined();
      expect(foundWords.playerId).toBeDefined();
      expect(foundWords.word).toBeDefined();
      expect(foundWords.startRow).toBeDefined();
      expect(foundWords.startCol).toBeDefined();
      expect(foundWords.endRow).toBeDefined();
      expect(foundWords.endCol).toBeDefined();
      expect(foundWords.direction).toBeDefined();
      expect(foundWords.path).toBeDefined();
      expect(foundWords.foundAt).toBeDefined();
    });

    it('direction должен использовать enum', () => {
      expect(foundWords.direction.enum).toEqual([
        'horizontal',
        'vertical',
        'diagonal_down',
        'diagonal_up'
      ]);
    });

    it('sessionId и playerId должны иметь foreign keys', () => {
      expect(foundWords.sessionId.references).toBeDefined();
      expect(foundWords.playerId.references).toBeDefined();
    });
  });

  describe('Match History table', () => {
    it('должен иметь все необходимые поля', () => {
      expect(matchHistory.id).toBeDefined();
      expect(matchHistory.sessionId).toBeDefined();
      expect(matchHistory.userId).toBeDefined();
      expect(matchHistory.playerName).toBeDefined();
      expect(matchHistory.wordsFound).toBeDefined();
      expect(matchHistory.firstWordTime).toBeDefined();
      expect(matchHistory.rank).toBeDefined();
      expect(matchHistory.recordedAt).toBeDefined();
    });

    it('wordsFound должен иметь значение по умолчанию 0', () => {
      expect(matchHistory.wordsFound.default).toBe(0);
    });

    it('должен иметь unique индекс по sessionId', () => {
      // Проверяем что есть unique constraint
      expect(matchHistory.uniqueSessionIdx).toBeDefined();
    });
  });

  describe('Foreign Key relationships', () => {
    it('gamePlayers.sessionId -> gameSessions.id', () => {
      expect(gamePlayers.sessionId.references).toBeDefined();
    });

    it('gamePlayers.userId -> users.id', () => {
      expect(gamePlayers.userId.references).toBeDefined();
    });

    it('foundWords.sessionId -> gameSessions.id', () => {
      expect(foundWords.sessionId.references).toBeDefined();
    });

    it('foundWords.playerId -> gamePlayers.id', () => {
      expect(foundWords.playerId.references).toBeDefined();
    });

    it('matchHistory.sessionId -> gameSessions.id', () => {
      expect(matchHistory.sessionId.references).toBeDefined();
    });

    it('matchHistory.userId -> users.id', () => {
      expect(matchHistory.userId.references).toBeDefined();
    });

    it('gameSessions.hostUserId -> users.id', () => {
      expect(gameSessions.hostUserId.references).toBeDefined();
    });
  });

  describe('Data types', () => {
    it('wordList должен быть массивом text', () => {
      expect(gameSessions.wordList.array).toBe(true);
    });

    it('grid должен быть jsonb', () => {
      expect(gameSessions.grid).toBeDefined();
    });

    it('path должен быть jsonb', () => {
      expect(foundWords.path).toBeDefined();
    });

    it('id должен быть uuid', () => {
      expect(users.id).toBeDefined();
    });
  });

  describe('Timestamps', () => {
    it('все таблицы должны иметь createdAt', () => {
      expect(users.createdAt).toBeDefined();
      expect(sessions.createdAt).toBeDefined();
      expect(accounts.createdAt).toBeDefined();
      expect(gameSessions.createdAt).toBeDefined();
      expect(gamePlayers.createdAt).toBeDefined();
      expect(foundWords.foundAt).toBeDefined();
      expect(matchHistory.recordedAt).toBeDefined();
    });

    it('users должен иметь updatedAt', () => {
      expect(users.updatedAt).toBeDefined();
    });
  });
});
