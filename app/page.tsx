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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
        {/* Кнопка выхода */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:underline"
          >
            Выйти из аккаунта
          </button>
          <div className="text-sm text-gray-600">
            👤 {playerName}
          </div>
        </div>

        <>
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
            🎮 Филворд
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Многопользовательская игра
          </p>

          {/* Выбор режима игры */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Режим игры
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGameMode('individual')}
                className={`py-3 px-4 rounded-lg font-medium transition-all border-2 ${
                  gameMode === 'individual'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="text-lg mb-1">👤</div>
                <div className="text-sm">Каждый сам за себя</div>
              </button>
              <button
                type="button"
                onClick={() => setGameMode('team')}
                className={`py-3 px-4 rounded-lg font-medium transition-all border-2 ${
                  gameMode === 'team'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="text-lg mb-1">👥</div>
                <div className="text-sm">Командный</div>
              </button>
            </div>
          </div>

          {/* Переключатель "Игра на время" */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setOnTimeLimit(!onTimeLimit)}
                className={`w-14 h-8 rounded-full transition-all relative ${
                  onTimeLimit ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                    onTimeLimit ? 'left-7' : 'left-1'
                  }`}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⏱️</span>
                <span className="text-sm font-medium text-gray-700">
                  Игра на время (5 мин)
                </span>
              </div>
            </label>
          </div>

          {/* Ошибка */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Кнопка создания игры */}
          <button
            onClick={handleCreateGame}
            className="w-full mb-4 py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Создать новую игру
          </button>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">или</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Форма присоединения */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID сессии
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Введите ID сессии"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
          </div>

          <button
            onClick={handleJoinGame}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
          >
            Присоединиться к игре
          </button>

          {/* Инструкция */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
            <p className="font-semibold mb-1">Как играть:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Найдите все слова в сетке 10×10</li>
              <li>Выделяйте слова мышью</li>
              <li>Слова могут быть горизонтально, вертикально и по диагонали</li>
              <li>Побеждает тот, кто найдёт больше слов быстрее</li>
            </ul>
          </div>
        </>
      </div>
    </div>
  );
}
