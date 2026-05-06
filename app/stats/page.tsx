/**
 * Страница истории матчей
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '../../lib/trpc-client';

export default function StatsPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [searched, setSearched] = useState(false);

  const { data, isLoading } = trpc.game.getMatchHistory.useQuery(
    { playerName, limit: 50 },
    { enabled: searched && playerName.length > 0 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim().length > 0) {
      setSearched(true);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRankEmoji = (rank: number | null) => {
    if (rank === null) return '';
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 relative overflow-hidden">
      {/* Анимированный фон */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Заголовок */}
        <header className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-3xl font-black text-white bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent hover:scale-105 transition-transform cursor-pointer"
          >
            📊 Статистика игр
          </button>
        </header>

        {/* Поиск игрока */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
            <label className="block text-white font-bold mb-3">
              🔍 Введите имя игрока:
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Имя игрока..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                maxLength={20}
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all"
              >
                Поиск
              </button>
            </div>
          </div>
        </form>

        {/* Статистика игрока */}
        {data && data.stats && (
          <div className="mb-8 bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
            <h2 className="text-2xl font-black text-white mb-4">📈 Статистика: {playerName}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-cyan-300">{data.stats.totalMatches}</div>
                <div className="text-sm text-white/70 mt-1">Всего игр</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-emerald-300">{data.stats.totalWords}</div>
                <div className="text-sm text-white/70 mt-1">Всего слов</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-yellow-300">{data.stats.wins}</div>
                <div className="text-sm text-white/70 mt-1">Побед</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-purple-300">{data.stats.avgWords}</div>
                <div className="text-sm text-white/70 mt-1">Сред. слов</div>
              </div>
            </div>
          </div>
        )}

        {/* История матчей */}
        {data && data.history && data.history.length > 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="text-xl font-black text-white mb-4">📜 История матчей</h3>
            <div className="space-y-3">
              {data.history.map((match: any) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">
                      {getRankEmoji(match.rank)}
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg">
                        {match.playerName}
                      </div>
                      <div className="text-sm text-white/60">
                        {formatDate(match.recordedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-cyan-300">
                      {match.wordsFound} слов
                    </div>
                    {match.firstWordTime !== null && match.firstWordTime !== undefined && (
                      <div className="text-sm text-white/60">
                        ⚡ {match.firstWordTime} сек до первого слова
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : searched && playerName.length > 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20 text-center">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-xl font-bold text-white mb-2">История не найдена</h3>
            <p className="text-white/70">
              Игрок {playerName} ещё не играл в игры
            </p>
          </div>
        ) : null}

        {/* Кнопка назад */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-purple-500/40 transition-all transform hover:scale-105"
          >
            🏠 На главную
          </button>
        </div>
      </div>
    </div>
  );
}
