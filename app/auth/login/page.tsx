'use client';

/**
 * Страница входа в систему
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка входа');
        return;
      }

      // Сохраняем данные пользователя
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('playerName', data.user.name);
      localStorage.setItem('userEmail', data.user.email);

      // Перенаправляем на главную
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <h1 className="text-3xl font-bold text-center text-white mb-2">
          Филворд
        </h1>
        <p className="text-center text-purple-200 mb-6">
          Войдите, чтобы играть
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 text-white rounded-lg" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              placeholder="example@email.com"
              aria-label="Email адрес"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              placeholder="Введите пароль"
              aria-label="Пароль"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            aria-label="Войти"
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="text-center text-purple-200 mt-6 text-sm">
          Нет аккаунта?{' '}
          <Link href="/auth/register" className="text-purple-300 hover:text-purple-100 font-medium transition">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
