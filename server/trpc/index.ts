/**
 * Главный tRPC router
 * Объединяет все роутеры приложения
 */

import { createTRPCRouter } from './trpc';
import { gameRouter } from './gameRouter';

// Объединяем все роутеры в один
export const appRouter = createTRPCRouter({
  game: gameRouter,
});

// Экспорт типа для использования на клиенте
export type AppRouter = typeof appRouter;
