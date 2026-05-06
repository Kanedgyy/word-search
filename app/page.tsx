'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '../lib/trpc-client';

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [gameMode, setGameMode] = useState<'individual' | 'team'>('individual');
  const [onTimeLimit, setOnTimeLimit] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Проверка авторизации при монтировании
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('playerName');
    if (!userId || !userName) {
      router.push('/auth/login');
    } else {
      setPlayerName(userName);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('playerName');
    localStorage.removeItem('playerColor');
    localStorage.removeItem('playerId');
    router.push('/auth/login');
  };

  const createSessionMutation = trpc.game.createSession.useMutation();
  const joinSessionMutation = trpc.game.joinSession.useMutation();

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError('Введите ваше имя');
      return;
    }

    try {
      const createData = await createSessionMutation.mutateAsync({ 
        maxPlayers: 6, 
        duration: 300,
        gameMode,
        onTimeLimit,
      });
      
      const newSessionId = createData.sessionId;

      if (newSessionId) {
        const joinData = await joinSessionMutation.mutateAsync({ 
          sessionId: newSessionId, 
          playerName 
        });
        
        // Сохраняем данные игрока
        localStorage.setItem('playerId', joinData.playerId);
        localStorage.setItem('playerColor', joinData.color);
        
        // Сразу переходим в игру с onTimeLimit в URL
        const url = `/game/${newSessionId}?playerId=${joinData.playerId}&name=${encodeURIComponent(playerName)}&color=${encodeURIComponent(joinData.color)}&onTimeLimit=${onTimeLimit}`;
        router.push(url);
      }
    } catch (err: any) {
      setError('Ошибка создания игры: ' + (err.message || 'Неизвестная ошибка'));
      console.error(err);
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      setError('Введите ваше имя');
      return;
    }
    if (!sessionId.trim()) {
      setError('Введите ID сессии');
      return;
    }

    try {
      const joinData = await joinSessionMutation.mutateAsync({ 
        sessionId, 
        playerName 
      });
      
      const playerId = joinData.playerId;

      router.push(`/game/${sessionId}?playerId=${playerId}&name=${encodeURIComponent(playerName)}&color=${encodeURIComponent(joinData.color)}`);
    } catch (err: any) {
      setError('Ошибка присоединения: ' + (err.message || 'Неизвестная ошибка'));
      console.error(err);
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 relative overflow-hidden">
      {/* Анимированный фон с плавающими элементами */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20 animate-fade-in">
          {/* Кнопка выхода */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => router.push('/stats')}
              className="text-sm text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all"
            >
              📊 Статистика
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all"
            >
              Выйти →
            </button>
          </div>

        <>
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black text-white mb-2 bg-gradient-to-r from-yellow-200 via-pink-200 to-cyan-200 bg-clip-text">
              🎮 Филворд
            </h1>
            <p className="text-white/70 text-sm">Многопользовательская игра слов</p>
            
            <div className="mt-4 flex items-center justify-center gap-2 bg-white/10 px-4 py-2 rounded-full inline-flex">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {playerName.charAt(0).toUpperCase()}
              </div>
              <span className="text-white text-sm font-medium">{playerName}</span>
            </div>
          </div>

          {/* Выбор режима игры */}
          <div className="mb-6">
            <label className="block text-white/90 text-sm font-semibold mb-3">
              🎯 Режим игры
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGameMode('individual')}
                className={`py-4 px-4 rounded-xl font-medium transition-all border-2 relative overflow-hidden ${
                  gameMode === 'individual'
                    ? 'border-pink-400 bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-white shadow-lg shadow-pink-500/25'
                    : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:border-white/30'
                }`}
              >
                <div className="text-2xl mb-1">👤</div>
                <div className="text-xs font-semibold">Каждый за себя</div>
                {gameMode === 'individual' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                )}
              </button>
              <button
                type="button"
                onClick={() => setGameMode('team')}
                className={`py-4 px-4 rounded-xl font-medium transition-all border-2 relative overflow-hidden ${
                  gameMode === 'team'
                    ? 'border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-white shadow-lg shadow-cyan-500/25'
                    : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:border-white/30'
                }`}
              >
                <div className="text-2xl mb-1">👥</div>
                <div className="text-xs font-semibold">Командный</div>
                {gameMode === 'team' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                )}
              </button>
            </div>
          </div>

          {/* Переключатель "Игра на время" */}
          <div className="mb-6">
            <button
              onClick={() => setOnTimeLimit(!onTimeLimit)}
              className={`w-full py-4 px-5 rounded-xl font-semibold transition-all flex items-center justify-between border-2 ${
                onTimeLimit
                  ? 'border-amber-400 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-white shadow-lg shadow-amber-500/25'
                  : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏱️</span>
                <div className="text-left">
                  <div className="font-bold">Игра на время</div>
                  <div className="text-xs opacity-75">5 минут на поиск слов</div>
                </div>
              </div>
              <div className={`w-14 h-8 rounded-full transition-all relative ${
                onTimeLimit ? 'bg-amber-500' : 'bg-white/30'
              }`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${
                  onTimeLimit ? 'left-7' : 'left-1'
                }`}></div>
              </div>
            </button>
          </div>

          {/* Ошибка */}
          {error && (
            <div className="mb-4 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/50 text-red-200 rounded-xl text-sm backdrop-blur-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Кнопка создания игры */}
          <button
            onClick={handleCreateGame}
            className="w-full mb-4 py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transform hover:scale-105 relative overflow-hidden group"
          >
            <span className="relative z-10">✨ Создать новую игру</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </button>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <span className="px-4 text-white/50 text-sm font-medium">или</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          </div>

          {/* Форма присоединения */}
          <div className="mb-4">
            <label className="block text-white/90 text-sm font-semibold mb-2">
              🔗 ID сессии
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Введите ID сессии"
              className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all backdrop-blur-sm"
            />
          </div>

          <button
            onClick={handleJoinGame}
            className="w-full py-4 px-6 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-violet-600 hover:via-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transform hover:scale-105 relative overflow-hidden group"
          >
            <span className="relative z-10">🚀 Присоединиться к игре</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </button>

          {/* Инструкция */}
          <div className="mt-6 p-5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <p className="text-white/90 font-bold mb-3 flex items-center gap-2">
              <span>📖</span> Как играть:
            </p>
            <ul className="space-y-2 text-xs text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-cyan-300">•</span>
                Найдите все слова в сетке 10×10
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-300">•</span>
                Выделяйте слова мышью по буквам
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-300">•</span>
                Слова могут быть во всех направлениях
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-300">•</span>
                Побеждает тот, кто найдёт больше слов быстрее!
              </li>
            </ul>
          </div>
        </>
      </div>
    </div>
  );
}
