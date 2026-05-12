/**
 * API endpoint для tRPC
 * 
 * Этот файл обрабатывает все запросы к tRPC серверу
 * Next.js автоматически создаст маршрут /api/trpc/[...]
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../../../server/trpc';
import { createContext } from '../../../../server/trpc/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
