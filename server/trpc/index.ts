/**
 * Главный tRPC router
 * Объединяет все роутеры приложения
 */

import { createTRPCRouter } from './trpc';
import { gameRouter } from './gameRouter';
import { authRouter } from './authRouter';

// Объединяем все роутеры в один
export const appRouter = createTRPCRouter({
  game: gameRouter,
  auth: authRouter,
});

// Экспорт типа для использования на клиенте
export type AppRouter = typeof appRouter;
