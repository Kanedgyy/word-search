/**
 * Серверная часть аутентификации (Better-auth)
 * 
 * Настраивает Better-auth с:
 * - Email/пароль аутентификация
 * - GitHub OAuth
 * - Google OAuth
 * - Адаптер для Drizzle ORM
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuthSchema } from "@/drizzle/schema";
import { db } from "@/lib/db";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Экземпляр Better-auth для сервера
 */
export const auth = betterAuth({
  /**
   * База данных через Drizzle adapter
   */
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: betterAuthSchema,
  }),
  
  /**
   * Email/пароль аутентификация
   */
  emailAndPassword: {
    enabled: true,
    requireVerification: false, // Отключаем для локальной разработки
    autoSignIn: true,
  },
  
  /**
   * OAuth провайдеры
   */
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      enabled: !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  
  /**
   * Секрет для шифрования сессий
   */
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret-32-chars-minimum-length",
  
  /**
   * Базовый URL приложения
   */
  baseURL: appUrl,
  
  /**
   * Allowed origins для CORS
   */
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    appUrl,
  ],
  
  /**
   * Перенаправления после аутентификации
   */
  advanced: {
    cookiePrefix: "better-auth",
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  
  /**
   * Email верификация
   */
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async () => {
      // Отключаем отправку для локальной разработки
    },
  },
  
  /**
   * Настройки сессий
   */
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 дней
    updateAge: 60 * 60 * 24, // Обновлять каждый день
    generateSessionToken: () => {
      return crypto.randomUUID();
    },
  },
  
  /**
   * Отключаем rate limiting для разработки
   */
  rateLimit: {
    enabled: process.env.NODE_ENV === 'production',
    window: 10,
    max: 100,
  },
});

/**
 * Получение сессии из запроса
 */
export async function getSession() {
  return await auth.api.getSession({
    headers: new Headers(),
  });
}

/**
 * Проверка роли пользователя
 */
export async function checkUserRole(userId: string, requiredRole: 'user' | 'admin'): Promise<boolean> {
  // TODO: Реализовать проверку роли через БД
  // Пока что все пользователи имеют роль 'user'
  return requiredRole === 'user';
}
