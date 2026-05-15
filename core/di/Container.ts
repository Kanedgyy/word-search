/**
 * Dependency Injection Container
 * 
 * Централизованная регистрация и получение сервисов.
 * Позволяет легко заменять реализации для тестирования.
 * 
 * @example
 * ```typescript
 * // production
 * const container = new Container({
 *   gameService: new GameService({
 *     repository: new DrizzleGameRepository(db),
 *     wordSearchService: new WordSearchServiceImpl()
 *   })
 * });
 * 
 * // test
 * const testContainer = new Container({
 *   gameService: new GameService({
 *     repository: mockRepository,
 *     wordSearchService: mockWordSearchService
 *   })
 * });
 * ```
 */

import { GameService, type WordSearchService } from '../game/GameService';
import type { GameRepository } from '../game/GameRepository';

export interface ContainerOptions {
  gameService?: GameService;
  gameRepository?: GameRepository;
  wordSearchService?: WordSearchService;
}

/**
 * DI Container для управления зависимостями
 */
export class Container {
  private services: Map<string, unknown> = new Map();

  constructor(options: ContainerOptions = {}) {
    // Если передан готовый GameService, используем его
    if (options.gameService) {
      this.services.set('GameService', options.gameService);
    } else if (options.gameRepository && options.wordSearchService) {
      // Иначе создаём с зависимостями
      this.services.set('GameService', new GameService({
        repository: options.gameRepository,
        wordSearchService: options.wordSearchService,
      }));
    }
    
    if (options.gameRepository) {
      this.services.set('GameRepository', options.gameRepository);
    }
    
    if (options.wordSearchService) {
      this.services.set('WordSearchService', options.wordSearchService);
    }
  }

  /**
   * Получение сервиса по имени
   */
  get<T>(name: string): T | undefined {
    return this.services.get(name) as T | undefined;
  }

  /**
   * Получение GameService
   */
  getGameService(): GameService {
    const service = this.get<GameService>('GameService');
    if (!service) {
      throw new Error('GameService not registered in container');
    }
    return service;
  }

  /**
   * Регистрация сервиса (для продлённого использования)
   */
  register<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }
}

/**
 * Singleton контейнер для приложения
 */
const appContainer = new Container();

export const container = appContainer;
