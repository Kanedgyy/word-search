/**
 * Настройка tRPC сервера
 * 
 * tRPC (TypeScript Remote Procedure Call) — это библиотека для создания
 * типизированных API между клиентом и сервером.
 * 
 * Преимущества:
 * - Полная типизация (ошибки будут обнаружены на этапе компиляции)
 * - Автодополнение в IDE
 * - Не нужно писать Swagger/OpenAPI спецификации
 */

import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { db } from '../../lib/db';

// Создаём контекст для tRPC
// Контекст — это данные, доступные всем router'ам (например, пользователь, БД)
export interface CreateContextOptions {
  userId?: string;
  db: typeof db;
}

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    userId: opts.userId,
    db: opts.db,
  };
};

// Создаём экземпляр tRPC
const t = initTRPC.context<typeof createInnerTRPCContext>().create({
  // Superjson позволяет сериализовать сложные типы данных
  transformer: superjson,
});

// Экспортируем базовые роутеры и процедуры
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.userId) {
      throw new Error('Требуется авторизация');
    }
    return next({
      ctx: {
        ...ctx,
        userId: ctx.userId,
      },
    });
  })
);
