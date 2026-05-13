/**
 * Создает caller для тестирования tRPC роутеров
 */

import type { AppRouter } from './index';
import { appRouter } from './index';
import { db } from '@/lib/db';

export interface TestContext {
  db: typeof db;
}

export function createCaller(context: TestContext) {
  return {
    game: {
      createSession: async (input: any) => {
        return appRouter.game.createSession({
          ctx: context,
          input,
          path: 'game.createSession',
          type: 'mutation',
        } as any);
      },
      joinSession: async (input: any) => {
        return appRouter.game.joinSession({
          ctx: context,
          input,
          path: 'game.joinSession',
          type: 'mutation',
        } as any);
      },
      startGame: async (input: any) => {
        return appRouter.game.startGame({
          ctx: context,
          input,
          path: 'game.startGame',
          type: 'mutation',
        } as any);
      },
      submitWord: async (input: any) => {
        return appRouter.game.submitWord({
          ctx: context,
          input,
          path: 'game.submitWord',
          type: 'mutation',
        } as any);
      },
      getSessionState: async (input: any) => {
        return appRouter.game.getSessionState({
          ctx: context,
          input,
          path: 'game.getSessionState',
          type: 'query',
        } as any);
      },
    },
  };
}
