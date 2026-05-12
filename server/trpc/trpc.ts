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
import { auth } from '../../lib/auth/server';
import { headers } from 'next/headers';

// Создаём контекст для tRPC
// Контекст — это данные, доступные всем router'ам (например, пользователь, БД)
export interface CreateContextOptions {
  userId?: string;
  user?: any;
  db: typeof db;
}

export const createInnerTRPCContext = async (opts: CreateContextOptions) => {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  
  return {
    userId: session?.user?.id,
    user: session?.user,
    db: opts.db,
  };
};

export const createContext = async () => {
  return createInnerTRPCContext({ db });
};

// Создаём экземпляр tRPC
const t = initTRPC.context<Awaited<ReturnType<typeof createContext>>>().create({
  // Superjson позволяет сериализовать сложные типы данных
  transformer: superjson,
});

// Экспортируем базовые роутеры и процедуры
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new Error('Требуется авторизация');
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);
