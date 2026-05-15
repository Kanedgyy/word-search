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

import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { Container } from '@/core/di/Container';
import type { IWordSearchService } from '@/core/game/WordSearchService';

// Mock зависимостей
const mockGameService = {
  createSession: vi.fn(),
  joinSession: vi.fn(),
  startGame: vi.fn(),
  submitWord: vi.fn(),
  endGame: vi.fn(),
  getGameState: vi.fn(),
};

const mockAuthService = {
  authenticate: vi.fn(),
  getUserId: vi.fn(),
  validateUser: vi.fn(),
};

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

    it('должен регистрировать сервисы', () => {
      container.register('game', mockGameService);
      expect(container.get('game')).toBe(mockGameService);
    });

    it('должен регистрировать сервисы с factory', () => {
      const factory = vi.fn().mockReturnValue({ created: true });
      container.registerFactory('service', factory);
      
      const result = container.get('service');
      expect(result).toEqual({ created: true });
      expect(factory).toHaveBeenCalled();
    });

    it('должен проверять существование сервиса', () => {
      container.register('test', { value: 1 });
      expect(container.has('test')).toBe(true);
      expect(container.has('nonexistent')).toBe(false);
    });
  });

  describe('Service retrieval', () => {
    it('должен возвращать зарегистрированный сервис', () => {
      const service = { name: 'TestService' };
      container.register('service', service);
      
      const retrieved = container.get('service');
      expect(retrieved).toBe(service);
    });

    it('должен бросать ошибку для незарегистрированного сервиса', () => {
      expect(() => container.get('nonexistent')).toThrow('Service not found: nonexistent');
    });

    it('должен возвращать undefined через tryGet для незарегистрированного сервиса', () => {
      const result = container.tryGet('nonexistent');
      expect(result).toBeUndefined();
    });

    it('должен возвращать сервис через tryGet для зарегистрированного', () => {
      const service = { name: 'Test' };
      container.register('service', service);
      
      const result = container.tryGet('service');
      expect(result).toBe(service);
    });
  });

  describe('Service lifecycle', () => {
    it('должен создавать одиночный экземпляр для factory', () => {
      let counter = 0;
      const factory = vi.fn().mockImplementation(() => ({ id: ++counter }));
      container.registerFactory('singleton', factory);
      
      const instance1 = container.get('singleton');
      const instance2 = container.get('singleton');
      
      expect(factory).toHaveBeenCalledTimes(1);
      expect(instance1).toBe(instance2);
    });

    it('должен очищать контейнер', () => {
      container.register('service1', { id: 1 });
      container.register('service2', { id: 2 });
      
      container.clear();
      
      expect(container.has('service1')).toBe(false);
      expect(container.has('service2')).toBe(false);
    });
  });

  describe('WordSearchService interface', () => {
    it('должен реализовать все методы интерфейса', () => {
      const service: IWordSearchService = {
        createSession: vi.fn().mockResolvedValue({ sessionId: '1' }),
        joinSession: vi.fn().mockResolvedValue({ playerId: '1', color: '#FFF' }),
        startGame: vi.fn().mockResolvedValue({ success: true }),
        submitWord: vi.fn().mockResolvedValue({ success: true, score: 10 }),
        endGame: vi.fn().mockResolvedValue({ success: true }),
        getGameState: vi.fn().mockResolvedValue({ status: 'waiting' }),
      };

      container.register('wordSearch', service);
      
      const retrieved = container.get('wordSearch') as IWordSearchService;
      expect(retrieved.createSession).toBeDefined();
      expect(retrieved.joinSession).toBeDefined();
      expect(retrieved.startGame).toBeDefined();
      expect(retrieved.submitWord).toBeDefined();
      expect(retrieved.endGame).toBeDefined();
      expect(retrieved.getGameState).toBeDefined();
    });

    it('должен обрабатывать ошибки сервисов', async () => {
      const errorService: IWordSearchService = {
        createSession: vi.fn().mockRejectedValue(new Error('Failed')),
        joinSession: vi.fn(),
        startGame: vi.fn(),
        submitWord: vi.fn(),
        endGame: vi.fn(),
        getGameState: vi.fn(),
      };

      container.register('wordSearch', errorService);
      const service = container.get('wordSearch') as IWordSearchService;

      await expect(service.createSession()).rejects.toThrow('Failed');
    });
  });

  describe('Dependency injection patterns', () => {
    it('должен поддерживать цепочку зависимостей', () => {
      const database = { query: vi.fn() };
      const repository = { db: database, find: vi.fn() };
      const service = { repository, process: vi.fn() };

      container.register('database', database);
      container.register('repository', repository);
      container.register('service', service);

      expect(container.get('database')).toBe(database);
      expect(container.get('repository')).toBe(repository);
      expect(container.get('service')).toBe(service);
    });

    it('должен поддерживать альтернативные реализации', () => {
      interface ILogger {
        log(message: string): void;
      }

      const consoleLogger: ILogger = {
        log: vi.fn(),
      };

      const fileLogger: ILogger = {
        log: vi.fn(),
      };

      container.registerFactory<ILogger>('logger', () => consoleLogger);
      container.registerFactory<ILogger>('fileLogger', () => fileLogger);

      expect(container.get<ILogger>('logger').log).toBe(consoleLogger.log);
      expect(container.get<ILogger>('fileLogger').log).toBe(fileLogger.log);
    });
  });
});

describe('GameService Integration', () => {
  let container: Container;
  let gameService: typeof mockGameService;

  beforeEach(() => {
    container = new Container();
    gameService = { ...mockGameService };
    
    container.register('game', gameService);
  });

  it('должен интегрировать GameService через DI', async () => {
    gameService.createSession.mockResolvedValue({ sessionId: 'test-123' });

    const service = container.get('game');
    const result = await service.createSession();

    expect(result.sessionId).toBe('test-123');
    expect(gameService.createSession).toHaveBeenCalled();
  });

  it('должен обрабатывать последовательные вызовы', async () => {
    gameService.createSession.mockResolvedValue({ sessionId: '1' });
    gameService.joinSession.mockResolvedValue({ playerId: '2', color: '#FFF' });
    gameService.startGame.mockResolvedValue({ success: true });

    const service = container.get('game');

    await service.createSession();
    await service.joinSession({ sessionId: '1', playerName: 'Test' });
    await service.startGame({ sessionId: '1' });

    expect(gameService.createSession).toHaveBeenCalledTimes(1);
    expect(gameService.joinSession).toHaveBeenCalledTimes(1);
    expect(gameService.startGame).toHaveBeenCalledTimes(1);
  });
});
