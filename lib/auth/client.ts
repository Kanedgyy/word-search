/**
 * Клиентская часть аутентификации
 */

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // Указываем правильный baseURL для Better Auth API
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  // Отключаем автоматический fetch для разработки
  fetchOptions: {
    credentials: 'include',
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;

/**
 * Хук для получения текущего пользователя
 */
export function useCurrentUser() {
  const { data: session, error, isPending } = useSession();
  
  return {
    user: session?.user ?? null,
    session: session ?? null,
    isAuthenticated: !!session,
    isLoading: isPending,
    error,
  };
}
