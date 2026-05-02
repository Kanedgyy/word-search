/**
 * Настройка tRPC клиента
 * 
 * Клиент используется для вызова процедур сервера из React компонентов
 */

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/trpc';

// Создаём типизированный React hook для вызова tRPC процедур
export const trpc = createTRPCReact<AppRouter>();
