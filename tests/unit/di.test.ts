/**
 * Unit тесты для WordSearchService и DI Container
 * 
 * Покрытие:
 * - Dependency Injection
 * - WordSearchService интерфейса
 * - GameService реализации
 * - Создание и внедрение зависимостей
 * 
 * @example
 * ```bash
 * npm run test:vitest tests/unit/di.test.ts
 * ```
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from '@/core/di/Container';
import type { WordSearchService } from '@/core/game/GameService';
import type { GameRepository } from '@/core/game/GameRepository';

describe('DI Container', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    vi.clearAllMocks();
  });

  describe('Container initialization', () => {
    it('должен создавать пустой контейнер при инициализации', () => {
      const newContainer = new Container();
      expect(newContainer).toBeDefined();
    });

    it('должен регистрировать сервисы через конструктор', () => {
      const mockRepo: GameRepository = {
        createSession: vi.fn(),
        getSession: vi.fn(),
        updateSession: vi.fn(),
        deleteSession: vi.fn(),
        saveGamePlayer: vi.fn(),
        getGamePlayers: vi.fn(),
        updateGamePlayer: vi.fn(),
        deleteGamePlayer: vi.fn(),
        saveFoundWord: vi.fn(),
        getFoundWords: vi.fn(),
        saveMatchHistory: vi.fn(),
      };

      const mockWordService: WordSearchService = {
        generate: vi.fn(),
        validateWord: vi.fn(),
      };

      const newContainer = new Container({
        gameRepository: mockRepo,
        wordSearchService: mockWordService,
      });

      const repo = newContainer.get<GameRepository>('GameRepository');
      const wordService = newContainer.get<WordSearchService>('WordSearchService');

      expect(repo).toBe(mockRepo);
      expect(wordService).toBe(mockWordService);
    });

    it('должен регистрировать GameService через конструктор', () => {
      const mockRepo: GameRepository = {
        createSession: vi.fn(),
        getSession: vi.fn(),
        updateSession: vi.fn(),
        deleteSession: vi.fn(),
        saveGamePlayer: vi.fn(),
        getGamePlayers: vi.fn(),
        updateGamePlayer: vi.fn(),
        deleteGamePlayer: vi.fn(),
        saveFoundWord: vi.fn(),
        getFoundWords: vi.fn(),
        saveMatchHistory: vi.fn(),
      };

      const mockWordService: WordSearchService = {
        generate: vi.fn(),
        validateWord: vi.fn(),
      };

      const newContainer = new Container({
        gameRepository: mockRepo,
        wordSearchService: mockWordService,
      });

      const gameService = newContainer.getGameService();
      expect(gameService).toBeDefined();
    });

    it('должен регистрировать сервисы через register', () => {
      const mockService = { name: 'TestService' };
      container.register('service', mockService);
      expect(container.get('service')).toBe(mockService);
    });
  });

  describe('Service retrieval', () => {
    it('должен возвращать незарегистрированный сервис как undefined', () => {
      const result = container.get('nonexistent');
      expect(result).toBeUndefined();
    });

    it('должен возвращать зарегистрированный сервис', () => {
      const service = { name: 'Test' };
      container.register('service', service);
      expect(container.get('service')).toBe(service);
    });
  });

  describe('GameService Integration', () => {
    it('должен интегрировать GameService через DI', () => {
      const mockRepo: GameRepository = {
        createSession: vi.fn().mockResolvedValue({ id: '1' }),
        getSession: vi.fn(),
        updateSession: vi.fn(),
        deleteSession: vi.fn(),
        saveGamePlayer: vi.fn(),
        getGamePlayers: vi.fn(),
        updateGamePlayer: vi.fn(),
        deleteGamePlayer: vi.fn(),
        saveFoundWord: vi.fn(),
        getFoundWords: vi.fn(),
        saveMatchHistory: vi.fn(),
      };

      const mockWordService: WordSearchService = {
        generate: vi.fn(),
        validateWord: vi.fn(),
      };

      const newContainer = new Container({
        gameRepository: mockRepo,
        wordSearchService: mockWordService,
      });

      const gameService = newContainer.getGameService();
      expect(gameService).toBeDefined();
    });
  });
});
