/**
 * Middleware для защиты роутов с аутентификацией
 * Используется в Next.js Middleware (edge runtime)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './server';

/**
 * Публичные роуты, не требующие аутентификации
 */
const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/register', '/api/trpc', '/api/ws'];

/**
 * Проверка аутентификации в middleware
 */
export async function authMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Пропускаем статические файлы и ассеты
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Проверяем сессию через Better-auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  
  // Если роут публичный и нет сессии — пропускаем
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Если роут защищённый и нет сессии — редирект на логин
  if (!session) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Добавляем userId в headers для последующих запросов
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', session.user.id);
  requestHeaders.set('x-user-role', 'user'); // TODO: Реализовать роли
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Конфигурация middleware
 */
export const middlewareConfig = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (in public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
