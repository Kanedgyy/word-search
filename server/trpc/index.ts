/**
 * Главный tRPC router
 * Объединяет все роутеры приложения
 * 
 * @example
 * ```typescript
 * import { appRouter } from '@/server/trpc';
 * type Router = typeof appRouter;
 * ```
 */

import { createTRPCRouter } from './trpc';
import { gameRouter } from './gameRouter';
import { authRouter } from './authRouter';

// Объединяем все роутеры в один с type-safe
export const appRouter = createTRPCRouter({
  game: gameRouter,
  auth: authRouter,
}) satisfies ReturnType<typeof createTRPCRouter>;

// Экспорт типа для использования на клиенте
export type AppRouter = typeof appRouter;
