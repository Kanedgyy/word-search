/**
 * Настройка tRPC клиента
 * 
 * Клиент используется для вызова процедур сервера из React компонентов
 * с полной типизацией.
 * 
 * @example
 * ```typescript
 * import { trpc } from '@/lib/trpc-client';
 * 
 * function MyComponent() {
 *   const createSession = trpc.game.createSession.useMutation();
 *   
 *   const handleCreate = async () => {
 *     const result = await createSession.mutateAsync({
 *       maxPlayers: 4,
 *       duration: 300,
 *       gameMode: 'individual',
 *       onTimeLimit: false,
 *     });
 *   };
 * }
 * ```
 */

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/trpc';

/**
 * Типизированный React hook для вызова tRPC процедур
 * 
 * Предоставляет:
 * - useQuery() для GET запросов
 * - useMutation() для POST запросов
 * - useSubscription() для real-time обновлений (если включено)
 */
export const trpc = createTRPCReact<AppRouter>();
