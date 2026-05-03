'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '../../../lib/trpc-client';
import { GameBoard } from '../../../components/GameBoard';
import { WordList } from '../../../components/WordList';
import { PlayerList } from '../../../components/PlayerList';

// Типы
type Grid = string[][];

interface Player {
  id: string;
  name: string;
  color: string;
  wordsFound: number;
  isBot: boolean;
  rank?: number;
  firstWordTime?: number;
  team?: string | null;
}

interface GameState {
  id: string;
  status: 'waiting' | 'in_progress' | 'finished';
  grid: Grid;
  wordList: string[];
  players: Player[];
  foundWords: string[];
  maxPlayers: number;
  duration: number;
  gameMode: 'individual' | 'team';
  startTime?: number;
  endTime?: number;
  player: {
    id: string;
    color: string;
    wordsFound: number;
  } | null;
  teams?: Array<{
    id: string;
    name: string;
    totalWords: number;
    players: string[];
  }>;
  rematchSessionId?: string | null;
}

export default function GamePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const sessionId = resolvedParams.sessionId;
  const playerId = searchParams.get('playerId') || localStorage.getItem('playerId') || '';
  const playerName = searchParams.get('name') || localStorage.getItem('playerName') || 'Игрок';
  const playerColor = searchParams.get('color') || localStorage.getItem('playerColor') || '#4ECDC4';

  // Сохраняем данные в localStorage при монтировании и при смене сессии
  useEffect(() => {
    const pid = searchParams.get('playerId');
    if (pid) {
      localStorage.setItem('playerId', pid);
      localStorage.setItem('playerName', searchParams.get('name') || 'Игрок');
      localStorage.setItem('playerColor', searchParams.get('color') || '#4ECDC4');
    }
  }, [sessionId]);

  // Используем tRPC для запросов
  const { 
    data: gameState, 
    isLoading,
    refetch 
  } = trpc.game.getSessionState.useQuery(
    { sessionId, playerId },
    { 
      refetchInterval: 2000, // Polling каждые 2 секунды
      enabled: !!sessionId,  // Запускаем даже без playerId — сервер вернёт данные
      staleTime: 0,          // Всегда свежие данные
      retry: false,
    }
  );

  // Проверка: исключён ли игрок
  useEffect(() => {
    if (gameState?.player === null && playerId) {
      // Игрок не найден в сессии — был исключён
      setError('Вы были исключены из игры хостом');
    }
  }, [gameState, playerId]);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pendingBotDifficulty, setPendingBotDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const lastFoundWordsRef = useRef<Set<string>>(new Set());

  // Копирование ID сессии в буфер обмена
  const [copied, setCopied] = useState(false);
  const handleCopySessionId = async () => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback для старых браузеров
      const ta = document.createElement('textarea');
      ta.value = sessionId;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const submitWordMutation = trpc.game.submitWord.useMutation();
  const startGameMutation = trpc.game.startGame.useMutation();
  const addBotMutation = trpc.game.addBot.useMutation();
  const setTeamMutation = trpc.game.setTeam.useMutation();
  const joinSessionMutation = trpc.game.joinSession.useMutation();
  const removePlayerMutation = trpc.game.removePlayer.useMutation({
    onSuccess: () => {
      setMessage('Игрок удалён');
      void refetch();
    },
  });
  const rematchMutation = trpc.game.rematch.useMutation({
    onSuccess: async (data) => {
      // Хост должен сам присоединиться к новой сессии
      try {
        const joinData = await joinSessionMutation.mutateAsync({
          sessionId: data.sessionId,
          playerName: localStorage.getItem('playerName') || 'Игрок',
        });
        const name = localStorage.getItem('playerName') || 'Игрок';
        const color = localStorage.getItem('playerColor') || '#4ECDC4';
        router.push(`/game/${data.sessionId}?playerId=${joinData.playerId}&name=${encodeURIComponent(name)}&color=${encodeURIComponent(color)}`);
      } catch (err: any) {
        setMessage('Ошибка перехода в реванш: ' + err.message);
      }
    },
  });

  // Автопереход на реванш для хоста, для остальных — показываем баннер
  const [showRematchBanner, setShowRematchBanner] = useState(false);
  
  useEffect(() => {
    if (gameState?.rematchSessionId && !showRematchBanner) {
      setShowRematchBanner(true);
    }
  }, [gameState?.rematchSessionId]);

  const handleJoinRematch = async () => {
    if (!gameState?.rematchSessionId) return;
    try {
      const joinData = await joinSessionMutation.mutateAsync({
        sessionId: gameState.rematchSessionId,
        playerName: playerName || 'Игрок',
      });
      router.push(`/game/${gameState.rematchSessionId}?playerId=${joinData.playerId}&name=${encodeURIComponent(playerName)}&color=${encodeURIComponent(joinData.color)}`);
    } catch (err: any) {
      setMessage('Ошибка присоединения к реваншу: ' + err.message);
    }
  };

  // Удаление игрока
  const handleRemovePlayer = (targetPlayerId: string) => {
    removePlayerMutation.mutate({ sessionId, playerId, targetPlayerId });
  };

  // Проверка новых найденных слов для уведомления
  useEffect(() => {
    if (!gameState) return;
    
    const currentFoundWords = new Set(gameState.foundWords);
    const newWords = [...currentFoundWords].filter(
      word => !lastFoundWordsRef.current.has(word)
    );
    
    if (newWords.length > 0) {
      const finder = gameState.players.find(p => 
        newWords.some(word => word === word) // Упрощённая логика
      );
      if (finder && !finder.isBot) {
        setMessage(`✓ Найдено слово: ${newWords.join(', ')}`);
        setTimeout(() => setMessage(''), 2000);
      }
    }
    
    lastFoundWordsRef.current = currentFoundWords;
  }, [gameState?.foundWords]);

  // Отправка найденного слова
  const handleWordSelect = async (word: string, path: Array<{ row: number; col: number }>) => {
    if (!playerId || path.length < 3) return;

    try {
      const result = await submitWordMutation.mutateAsync({
        sessionId,
        playerId,
        word,
        path,
      });
      
      if (result.success) {
        setMessage(`✓ Вы нашли слово "${result.word}"! Счёт: ${result.playerScore}`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`✗ ${result.error || 'Ошибка'}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err: any) {
      console.error('Ошибка отправки слова:', err);
      setMessage('Ошибка отправки слова: ' + err.message);
    }
  };

  // Запуск игры (только для хоста)
  const handleStartGame = async () => {
    // Проверка: в командном режиме все должны выбрать команду
    if (gameState?.gameMode === 'team') {
      const playersWithoutTeam = gameState.players.filter(p => !p.team);
      if (playersWithoutTeam.length > 0) {
        setMessage('⚠️ Не все игроки выбрали команду!');
        return;
      }
    }
    
    try {
      await startGameMutation.mutateAsync({ sessionId });
      // Запускаем ботов через Edge API route (фоновые задачи)
      const res = await fetch('/api/run-bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      console.log('[run-bots]', data);
      setMessage('Игра началась!');
    } catch (err: any) {
      console.error('Ошибка запуска игры:', err);
      setMessage('Ошибка запуска игры: ' + err.message);
    }
  };

  // Добавление бота — шаг 1: выбор сложности
  const handleAddBot = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (gameState?.gameMode === 'team') {
      // В командном режиме сначала выбираем команду
      setPendingBotDifficulty(difficulty);
    } else {
      // В одиночном режиме сразу добавляем
      addBotWithTeam(difficulty, null);
    }
  };

  // Добавление бота — шаг 2: выбор команды (или сразу без команды)
  const addBotWithTeam = async (difficulty: 'easy' | 'medium' | 'hard', team: string | null) => {
    const botNames = ['Бот-Алекс', 'Бот-Мария', 'Бот-Дмитрий', 'Бот-Елена', 'Бот-Иван', 'Бот-Анна'];
    const randomName = botNames[Math.floor(Math.random() * botNames.length)];

    try {
      await addBotMutation.mutateAsync({ sessionId, botName: randomName, difficulty, team: team as any });
      const labels = { easy: 'лёгкий', medium: 'средний', hard: 'сложный' };
      const teamLabel = team ? ` (${team})` : '';
      setMessage(`Добавлен ${labels[difficulty]} бот${teamLabel}: ${randomName}`);
      setPendingBotDifficulty(null);
    } catch (err: any) {
      console.error('Ошибка добавления бота:', err);
      setMessage('Ошибка добавления бота: ' + err.message);
      setPendingBotDifficulty(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Загрузка...</div>
      </div>
    );
  }

  // Игрок исключён
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Вы исключены</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Сессия не найдена</h2>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  const isHost = gameState.players[0]?.id === playerId;
  const isGameStarted = gameState.status === 'in_progress';
  const isGameFinished = gameState.status === 'finished';

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок + ID сессии */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-3">
            🎮 Филворд
          </h1>
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
            <span className="text-white/70 text-sm">ID сессии:</span>
            <code className="text-white font-mono text-base font-semibold tracking-wide">
              {sessionId}
            </code>
            <button
              onClick={handleCopySessionId}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title="Скопировать ID"
            >
              {copied ? '✓ Скопировано' : '📋 Копировать'}
            </button>
          </div>
          <p className="text-white/60 text-sm mt-2">
            Поделитесь ID с друзьями, чтобы они присоединились
          </p>
        </header>

        {/* Сообщение */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-center font-medium animate-fade-in ${
            message.startsWith('✓') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Статус игры */}
        <div className="mb-6 flex flex-wrap gap-4">
          {gameState.status === 'waiting' && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg">
              ⏳ Игра ожидает начала. Ожидаем игроков...
            </div>
          )}
          
          {gameState.status === 'in_progress' && (
            <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded-lg">
              🎯 Игра идёт! Найдите как можно больше слов!
            </div>
          )}
          
          {gameState.status === 'finished' && (
            <div className="bg-purple-100 border border-purple-400 text-purple-800 px-4 py-2 rounded-lg">
              🏆 Игра завершена! См. результаты ниже.
            </div>
          )}
        </div>

        {/* Баннер реванша */}
        {showRematchBanner && gameState?.rematchSessionId && (
          <div className="mb-6 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 text-green-800 px-6 py-4 rounded-lg text-center animate-fade-in">
            <div className="text-lg font-bold mb-2">🔄 Создан реванш!</div>
            <div className="text-sm mb-3">
              Хост создал новую игру. ID сессии: <code className="bg-white px-2 py-0.5 rounded font-mono">{gameState.rematchSessionId}</code>
            </div>
            <div className="text-xs mb-3">
              Скопируйте ID и отправьте друзьям, чтобы они присоединились
            </div>
            <button
              onClick={handleJoinRematch}
              className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-all"
            >
              Присоединиться к реваншу
            </button>
          </div>
        )}

        {/* Выбор команды (в командном режиме) */}
        {gameState.status === 'waiting' && gameState.gameMode === 'team' && (
          <div className="mb-6 bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3">Выберите команду:</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'red', name: 'Красная', color: 'bg-red-500' },
                { id: 'blue', name: 'Синяя', color: 'bg-blue-500' },
                { id: 'green', name: 'Зелёная', color: 'bg-green-500' },
                { id: 'yellow', name: 'Жёлтая', color: 'bg-yellow-500' },
              ].map(team => {
                const currentPlayer = gameState.players.find(p => p.id === playerId);
                const isSelected = currentPlayer?.team === team.id;
                const teamPlayers = gameState.players.filter(p => p.team === team.id);
                return (
                  <button
                    key={team.id}
                    onClick={() => setTeamMutation.mutate({ sessionId, playerId, team: team.id as any })}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      isSelected
                        ? `${team.color} text-white shadow-lg`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {team.name}
                    {teamPlayers.length > 0 && (
                      <span className="ml-2 text-xs opacity-75">
                        ({teamPlayers.length})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Таблица команд */}
        {gameState.gameMode === 'team' && gameState.teams && gameState.teams.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3">🏆 Счёт команд:</h3>
            <div className="space-y-2">
              {gameState.teams.map((team, index) => (
                <div
                  key={team.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                  }`}
                >
                  <div>
                    <span className="font-bold">{team.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {team.players.join(', ')}
                    </span>
                  </div>
                  <div className="text-xl font-bold text-gray-800">
                    {team.totalWords}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Контролы хоста */}
        {isHost && gameState.status === 'waiting' && (
          <div className="mb-6 flex flex-wrap gap-3 items-center">
            <button
              onClick={handleStartGame}
              className="px-6 py-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-green-500 to-teal-600 text-white hover:shadow-lg"
            >
              🚀 Начать игру ({gameState.players.length} {gameState.players.length === 1 ? 'игрок' : 'игроков'})
            </button>
            
            {gameState.players.length < 6 && !pendingBotDifficulty && (
              <div className="flex items-center gap-2">
                <span className="text-white/80 text-sm mr-1">🤖 Добавить бота:</span>
                <button
                  onClick={() => handleAddBot('easy')}
                  className="px-4 py-2 rounded-lg font-medium text-sm bg-green-500/80 text-white hover:bg-green-500 transition-all"
                  title="Лёгкий: медленный (0.4–1.5с), много ошибок (45%), редко зависает"
                >
                  🌱 Лёгкий
                </button>
                <button
                  onClick={() => handleAddBot('medium')}
                  className="px-4 py-2 rounded-lg font-medium text-sm bg-yellow-500/80 text-white hover:bg-yellow-500 transition-all"
                  title="Средний: обычная скорость (0.25–0.9с), половина ошибок (25%)"
                >
                  ⚡ Средний
                </button>
                <button
                  onClick={() => handleAddBot('hard')}
                  className="px-4 py-2 rounded-lg font-medium text-sm bg-red-500/80 text-white hover:bg-red-500 transition-all"
                  title="Сложный: быстрый (0.1–0.5с), редко ошибается (8%), знает все слова"
                >
                  🔥 Сложный
                </button>
              </div>
            )}

            {/* Выбор команды для бота (в командном режиме) */}
            {pendingBotDifficulty && (
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="text-white/80 text-sm mr-1">Выберите команду бота:</span>
                {[
                  { id: 'red', name: 'Красная', bg: 'bg-red-500' },
                  { id: 'blue', name: 'Синяя', bg: 'bg-blue-500' },
                  { id: 'green', name: 'Зелёная', bg: 'bg-green-500' },
                  { id: 'yellow', name: 'Жёлтая', bg: 'bg-yellow-500' },
                ].map(team => (
                  <button
                    key={team.id}
                    onClick={() => addBotWithTeam(pendingBotDifficulty, team.id)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${team.bg} text-white hover:opacity-90 transition-all`}
                  >
                    {team.name}
                  </button>
                ))}
                <button
                  onClick={() => setPendingBotDifficulty(null)}
                  className="px-3 py-2 rounded-lg font-medium text-sm bg-white/20 text-white hover:bg-white/30 transition-all"
                >
                  ✕ Отмена
                </button>
              </div>
            )}
          </div>
        )}

        {/* Основной контент */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Игровое поле */}
          <div className="lg:col-span-2">
            {isGameStarted && gameState.grid ? (
              <GameBoard
                grid={gameState.grid}
                foundWords={new Set(gameState.foundWords)}
                playerColor={gameState.player?.color || '#4ECDC4'}
                onWordSelect={handleWordSelect}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <p className="text-gray-600">
                  {gameState.status === 'waiting' 
                    ? 'Ожидание начала игры...' 
                    : 'Игра ещё не началась'}
                </p>
              </div>
            )}
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* Список игроков */}
            <PlayerList 
              players={gameState.players}
              currentPlayerId={playerId}
              showTeams={gameState.gameMode === 'team'}
              isHost={isHost}
              onSetTeam={(botId, team) => setTeamMutation.mutate({ sessionId, playerId: botId, team: team as any })}
              onRemovePlayer={handleRemovePlayer}
            />

            {/* Список слов (скрываем в реальной игре, но показываем для теста) */}
            {isGameStarted && (
              <WordList
                words={gameState.wordList}
                foundWords={new Set(gameState.foundWords)}
              />
            )}
          </div>
        </div>

        {/* Результаты игры */}
        {isGameFinished && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
              🏆 Итоги игры 🏆
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gameState.players
                .sort((a, b) => {
                  if (b.wordsFound !== a.wordsFound) {
                    return b.wordsFound - a.wordsFound;
                  }
                  // При равенстве — кто раньше нашёл первое слово
                  const aTime = a.firstWordTime ?? Infinity;
                  const bTime = b.firstWordTime ?? Infinity;
                  return aTime - bTime;
                })
                .map((player, index) => (
                  <div
                    key={player.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-400 shadow-lg' :
                      'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {index === 0 && (
                          <div className="text-3xl">🏆</div>
                        )}
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 flex items-center gap-2">
                            {player.name}
                            {player.isBot && <span className="text-xs text-gray-500">(бот)</span>}
                            {index === 0 && <span className="text-xs bg-yellow-400 text-white px-2 py-0.5 rounded">Победитель</span>}
                          </div>
                          <div className="text-sm text-gray-600">
                            Время первого слова: {player.wordsFound > 0 ? (player.firstWordTime !== null && player.firstWordTime !== undefined ? player.firstWordTime + ' сек' : '—') : '-'}
                          </div>
                        </div>
                      </div>
                      <div className="text-3xl font-bold" style={{ color: player.color }}>
                        {player.wordsFound}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-6 text-center flex flex-wrap gap-4 justify-center">
              {!gameState.rematchSessionId && (
                <button
                  onClick={() => rematchMutation.mutate({ sessionId, playerId })}
                  disabled={rematchMutation.isPending}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {rematchMutation.isPending ? '⏳ Создание...' : '🔄 Реванш!'}
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                🏠 Вернуться на главную
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
