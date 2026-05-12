'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '../../../lib/trpc-client';
import { GameBoard } from '../../../components/GameBoard';
import { FoundWordsList } from '../../../components/FoundWordsList';
import { PlayerList } from '../../../components/PlayerList';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { WSMessage } from '../../../server/websocket';

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
  players: Player[];
  foundWords: string[];
  foundCellsMap?: Record<string, string>;
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
  onTimeLimit?: boolean;
  totalWordCount: number;
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
      refetchInterval: 2000, // Polling раз в 2 секунды только для таймера
      enabled: !!sessionId,
      staleTime: 0,
      retry: false,
    }
  );

  // WebSocket для real-time обновлений
  const { isConnected: wsConnected } = useWebSocket({
    sessionId,
    playerId,
    onMessage: (message: WSMessage) => {
      console.log('[WS] Получено сообщение:', message.type, message.data);
      
      switch (message.type) {
        case 'word_found':
          // Слово найдено - обновляем состояние
          void refetch();
          const finder = message.data?.playerName || 'Игрок';
          const word = message.data?.word || '';
          setMessage(`✓ Найдено слово "${word}" игроком ${finder}!`);
          setTimeout(() => setMessage(''), 2000);
          break;
          
        case 'game_started':
          setMessage('🚀 Игра началась!');
          setTimeout(() => setMessage(''), 2000);
          void refetch();
          break;
          
        case 'game_ended':
          setMessage('🏆 Игра завершена!');
          setTimeout(() => setMessage(''), 2000);
          void refetch();
          break;
          
        case 'player_joined':
          void refetch();
          break;
      }
    },
  });

  // Debug logging для gameState
  useEffect(() => {
    if (gameState) {
      console.log('[GamePage] gameState received:', {
        status: gameState.status,
        onTimeLimit: gameState.onTimeLimit,
        endTime: gameState.endTime,
        duration: gameState.duration,
      });
    }
  }, [gameState]);

  // Состояния
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pendingBotDifficulty, setPendingBotDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [onTimeLimit, setOnTimeLimit] = useState(false);
  const [copied, setCopied] = useState(false);
  const lastFoundWordsRef = useRef<Set<string>>(new Set());
  
  // Автопереход на реванш для хоста, для остальных — показываем баннер
  const [showRematchBanner, setShowRematchBanner] = useState(false);
  
  useEffect(() => {
    if (gameState?.rematchSessionId && !showRematchBanner) {
      setShowRematchBanner(true);
    }
  }, [gameState?.rematchSessionId]);

  const handleCopySessionId = async () => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  // Загружаем onTimeLimit из gameState (придет с сервера)
  useEffect(() => {
    if (gameState?.onTimeLimit !== undefined) {
      console.log('[GamePage] Setting onTimeLimit from gameState:', gameState.onTimeLimit);
      setOnTimeLimit(gameState.onTimeLimit);
    }
  }, [gameState?.onTimeLimit]);

  // Проверка: исключён ли игрок
  useEffect(() => {
    if (gameState?.player === null && playerId) {
      // Игрок не найден в сессии — был исключён
      setError('Вы были исключены из игры хостом');
    }
  }, [gameState, playerId]);

  // Таймер для режима onTimeLimit - работает у ВСЕХ игроков
  useEffect(() => {
    if (onTimeLimit && gameState?.status === 'in_progress') {
      console.log('[Timer] onTimeLimit=true, status=in_progress, starting timer...');
      // Используем endTime если есть, иначе рассчитываем по duration
      let endTime: Date;
      if (gameState.endTime) {
        console.log('[Timer] Using endTime from server:', gameState.endTime);
        endTime = new Date(gameState.endTime);
      } else if (gameState.startTime && gameState.duration) {
        console.log('[Timer] Using fallback: startTime + duration');
        // Fallback: если endTime нет, рассчитываем по startTime + duration
        endTime = new Date(gameState.startTime);
        endTime.setSeconds(endTime.getSeconds() + gameState.duration);
      } else {
        console.log('[Timer] No startTime or endTime, cannot start timer');
        // Если вообще нет данных, не запускаем таймер
        setTimeRemaining(0);
        return;
      }
      
      const timer = setInterval(() => {
        const now = new Date();
        const remaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          console.log('[Timer] Время вышло! Принудительно обновляем игру...');
          clearInterval(timer);
          // Принудительно обновляем игру чтобы увидеть завершённый статус
          void refetch();
        }
      }, 1000);
      
      return () => clearInterval(timer);
    } else {
      console.log('[Timer] onTimeLimit=false or status!=in_progress, stopping timer');
      setTimeRemaining(0);
    }
  }, [onTimeLimit, gameState?.status, gameState?.endTime, gameState?.startTime, gameState?.duration, refetch]);

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

  const handleJoinRematch = async () => {
    if (!gameState?.rematchSessionId) return;
    console.log('[handleJoinRematch] onTimeLimit:', onTimeLimit);
    try {
      const joinData = await joinSessionMutation.mutateAsync({
        sessionId: gameState.rematchSessionId,
        playerName: playerName || 'Игрок',
      });
      router.push(`/game/${gameState.rematchSessionId}?playerId=${joinData.playerId}&name=${encodeURIComponent(playerName)}&color=${encodeURIComponent(joinData.color)}&onTimeLimit=${onTimeLimit}`);
    } catch (err: any) {
      setMessage('Ошибка присоединения к реваншу: ' + err.message);
    }
  };

  // Удаление игрока
  const handleRemovePlayer = (targetPlayerId: string) => {
    removePlayerMutation.mutate({ sessionId, playerId, targetPlayerId });
  };

  // Проверка новых найденных слов для уведомления
  // (теперь это делается через WebSocket, оставляем как fallback)
  useEffect(() => {
    if (!gameState) return;
    
    const currentFoundWords = new Set(gameState.foundWords);
    const newWords = [...currentFoundWords].filter(
      word => !lastFoundWordsRef.current.has(word)
    );
    
    if (newWords.length > 0) {
      setMessage(`✓ Найдено слово: ${newWords.join(', ')}`);
      setTimeout(() => setMessage(''), 2000);
    }
    
    lastFoundWordsRef.current = currentFoundWords;
  }, [gameState?.foundWords]);

  // Отправка найденного слова
  const handleWordSelect = async (
    word: string, 
    startRow: number, 
    startCol: number, 
    endRow: number, 
    endCol: number,
    direction: 'horizontal' | 'vertical' | 'diagonal_down' | 'diagonal_up'
  ) => {
    if (!playerId) return;

    try {
      const result = await submitWordMutation.mutateAsync({
        sessionId,
        playerId,
        word,
        startRow,
        startCol,
        endRow,
        endCol,
        direction,
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
      console.log('[handleStartGame] Запускаю игру...');
      await startGameMutation.mutateAsync({ sessionId });
      console.log('[handleStartGame] Игра запущена, статус: in_progress');
      
      // Запускаем ботов через API route
      console.log('[handleStartGame] Вызываю /api/run-bots...');
      const res = await fetch('/api/run-bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      console.log('[handleStartGame] Ответ получен, статус:', res.status);
      const data = await res.json();
      console.log('[handleStartGame] run-bots ответ:', data);
      
      if (data.success) {
        if (data.botsCount > 0) {
          setMessage(`Игра началась! Ботов запущено: ${data.botsCount}`);
        } else {
          setMessage('Игра началась!');
        }
      } else {
        setMessage('Игра началась, но боты не запущены: ' + (data.error || 'ошибка'));
      }
      
      // Принудительно обновляем состояние
      await refetch();
    } catch (err: any) {
      console.error('[handleStartGame] Ошибка запуска игры:', err);
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
  const gameStatus = gameState.status;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 relative overflow-hidden">
      {/* Анимированный фон */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.75s' }}></div>
      </div>

      {/* Фиксированные уведомления (не сдвигают контент) */}
      {message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className={`p-4 rounded-xl text-center font-medium animate-fade-in backdrop-blur-sm border shadow-xl ${
            message.startsWith('✓') 
              ? 'bg-green-500/90 border-green-400 text-white' 
              : 'bg-red-500/90 border-red-400 text-white'
          }`}>
            {message}
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto mt-4 md:mt-6">
        {/* Заголовок + ID сессии */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/')}
              className="text-4xl font-black text-white bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent hover:scale-105 transition-transform cursor-pointer"
            >
              🎮 Филворд
            </button>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {playerName.charAt(0).toUpperCase()}
              </div>
              <span className="text-white text-sm font-medium">{playerName}</span>
              {wsConnected && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="WebSocket подключён"></div>
              )}
            </div>
          </div>
          
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
            <span className="text-white/70 text-sm">🔗 ID сессии:</span>
            <code className="text-cyan-300 font-mono text-base font-bold tracking-wide">
              {sessionId}
            </code>
            <button
              onClick={handleCopySessionId}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                copied
                  ? 'bg-green-500/80 text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title="Скопировать ID"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
        </header>

        {/* Статус игры */}
        <div className="mb-8 flex flex-wrap gap-4">
          {gameState.status === 'waiting' && (
            <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/50 text-amber-200 px-6 py-3 rounded-xl backdrop-blur-sm">
              ⏳ Ожидаем начала игры...
            </div>
          )}
          
          {gameState.status === 'in_progress' && (
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/50 text-emerald-200 px-6 py-3 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <span>🎯 Игра идёт!</span>
                {onTimeLimit && (
                  <div className={`px-4 py-2 rounded-xl font-bold text-xl backdrop-blur-sm border ${
                    timeRemaining <= 30 
                      ? 'bg-red-500/80 border-red-400 text-white animate-pulse shadow-lg shadow-red-500/50' 
                      : 'bg-white/20 border-white/30 text-white'
                  }`}>
                    ⏱️ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>
            </div>
          )}

          {gameState.status === 'finished' && (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-200 px-6 py-3 rounded-xl backdrop-blur-sm">
              🏆 Игра завершена!
            </div>
          )}
        </div>

        {/* Режим игры */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20">
            {gameState.gameMode === 'individual' && <span>👤 Каждый сам за себя</span>}
            {gameState.gameMode === 'team' && <span>👥 Командный режим</span>}
            {onTimeLimit && <span className="ml-2 px-2 py-1 bg-amber-500/50 rounded-full text-xs">⏱️ На время</span>}
          </div>
        </div>

        {/* Баннер реванша */}
        {showRematchBanner && gameState?.rematchSessionId && (
          <div className="mb-8 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400/50 text-emerald-200 px-8 py-5 rounded-2xl text-center animate-fade-in backdrop-blur-sm">
            <div className="text-xl font-bold mb-3">🔄 Создан реванш!</div>
            <div className="text-sm mb-3">
              Хост создал новую игру. ID: <code className="bg-white/10 px-3 py-1 rounded font-mono">{gameState.rematchSessionId}</code>
            </div>
            <button
              onClick={handleJoinRematch}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/30"
            >
              🚀 Присоединиться
            </button>
          </div>
        )}

        {/* Выбор команды (в командном режиме) */}
        {gameState.status === 'waiting' && gameState.gameMode === 'team' && (
          <div className="mb-8 bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="font-bold text-white text-lg mb-4">👥 Выберите команду:</h3>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'red', name: 'Красная', color: 'bg-gradient-to-br from-red-500 to-rose-600', border: 'border-red-400' },
                { id: 'blue', name: 'Синяя', color: 'bg-gradient-to-br from-blue-500 to-indigo-600', border: 'border-blue-400' },
                { id: 'green', name: 'Зелёная', color: 'bg-gradient-to-br from-green-500 to-emerald-600', border: 'border-green-400' },
                { id: 'yellow', name: 'Жёлтая', color: 'bg-gradient-to-br from-yellow-400 to-amber-600', border: 'border-yellow-400' },
              ].map(team => {
                const currentPlayer = gameState.players.find(p => p.id === playerId);
                const isSelected = currentPlayer?.team === team.id;
                const teamPlayers = gameState.players.filter(p => p.team === team.id);
                return (
                  <button
                    key={team.id}
                    onClick={() => setTeamMutation.mutate({ sessionId, playerId, team: team.id as any })}
                    className={`px-6 py-4 rounded-xl font-bold transition-all border-2 relative overflow-hidden ${
                      isSelected
                        ? `${team.color} text-white shadow-xl scale-105 ${team.border}`
                        : 'bg-white/10 text-white/80 hover:bg-white/20 border-white/30'
                    }`}
                  >
                    <div className="text-lg">{team.name}</div>
                    {teamPlayers.length > 0 && (
                      <div className="text-xs opacity-75 mt-1">
                        {teamPlayers.length} игрок{teamPlayers.length === 1 ? '' : 'а'}
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Таблица команд (только после завершения игры) */}
        {gameState.gameMode === 'team' && gameState.teams && gameState.teams.length > 0 && gameState.status === 'finished' && (
          <div className="mb-8 bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="font-bold text-white text-lg mb-4">🏆 Итоги команд:</h3>
            <div className="space-y-3">
              {gameState.teams.map((team, index) => (
                <div
                  key={team.id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    index === 0 
                      ? 'bg-gradient-to-r from-yellow-500/30 to-amber-500/30 border-yellow-400 shadow-lg shadow-yellow-500/20 scale-105' 
                      : 'bg-white/5 border-white/20'
                  }`}
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      {index === 0 && <span className="text-2xl">🥇</span>}
                      {team.name}
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {team.players.join(', ')}
                    </div>
                  </div>
                  <div className="text-3xl font-black text-yellow-300">
                    {team.totalWords}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Контролы хоста */}
        {isHost && gameState.status === 'waiting' && (
          <div className="mb-8 flex flex-wrap gap-4 items-center">
            <button
              onClick={handleStartGame}
              className="px-8 py-4 rounded-xl font-bold transition-all bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white hover:shadow-2xl hover:shadow-emerald-500/40 transform hover:scale-105 relative overflow-hidden group"
            >
              <span className="relative z-10">🚀 Начать игру ({gameState.players.length})</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </button>
            
            {gameState.players.length < 6 && !pendingBotDifficulty && (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20">
                <span className="text-white/80 text-sm">🤖 Бот:</span>
                <button
                  onClick={() => handleAddBot('easy')}
                  className="px-4 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-green-500/80 to-emerald-500/80 text-white hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg"
                  title="Лёгкий: медленный, много ошибок"
                >
                  🌱 Лёгкий
                </button>
                <button
                  onClick={() => handleAddBot('medium')}
                  className="px-4 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-amber-500/80 to-orange-500/80 text-white hover:from-amber-500 hover:to-orange-500 transition-all shadow-lg"
                  title="Средний: обычная скорость"
                >
                  ⚡ Средний
                </button>
                <button
                  onClick={() => handleAddBot('hard')}
                  className="px-4 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-red-500/80 to-rose-500/80 text-white hover:from-red-500 hover:to-rose-500 transition-all shadow-lg"
                  title="Сложный: быстрый, мало ошибок"
                >
                  🔥 Сложный
                </button>
              </div>
            )}

            {/* Выбор команды для бота */}
            {pendingBotDifficulty && (
              <div className="flex items-center gap-3 animate-fade-in bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20">
                <span className="text-white/80 text-sm">Команда бота:</span>
                {[
                  { id: 'red', name: 'Красная', bg: 'bg-gradient-to-r from-red-500 to-rose-600' },
                  { id: 'blue', name: 'Синяя', bg: 'bg-gradient-to-r from-blue-500 to-indigo-600' },
                  { id: 'green', name: 'Зелёная', bg: 'bg-gradient-to-r from-green-500 to-emerald-600' },
                  { id: 'yellow', name: 'Жёлтая', bg: 'bg-gradient-to-r from-yellow-400 to-amber-600' },
                ].map(team => (
                  <button
                    key={team.id}
                    onClick={() => addBotWithTeam(pendingBotDifficulty, team.id)}
                    className={`px-5 py-2 rounded-lg font-bold text-sm ${team.bg} text-white hover:opacity-90 transition-all shadow-lg`}
                  >
                    {team.name}
                  </button>
                ))}
                <button
                  onClick={() => setPendingBotDifficulty(null)}
                  className="px-4 py-2 rounded-lg font-semibold text-sm bg-white/20 text-white hover:bg-white/30 transition-all"
                >
                  ✕
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
                playerColor={gameState.player?.color || '#FF006E'}
                onWordSelect={handleWordSelect}
                foundCellsMap={gameState.foundCellsMap}
              />
            ) : (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-8 text-center border border-white/20">
                <p className="text-white/70">
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
              status={gameState.status}
            />

            {/* FoundWordsList - показывает только найденные слова */}
            {isGameStarted && (
              <FoundWordsList
                foundWords={gameState.foundWords}
                totalCount={gameState.totalWordCount}
              />
            )}
          </div>
        </div>

        {/* Результаты игры */}
        {isGameFinished && (
          <div className="mt-12 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 animate-fade-in border border-white/20">
            <h2 className="text-3xl font-black mb-8 text-center bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text">
              🏆 {onTimeLimit ? 'Итоги игры на время' : 'Итоги игры'} 🏆
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {gameState.players
                .sort((a, b) => {
                  if (b.wordsFound !== a.wordsFound) {
                    return b.wordsFound - a.wordsFound;
                  }
                  const aTime = a.firstWordTime ?? Infinity;
                  const bTime = b.firstWordTime ?? Infinity;
                  return aTime - bTime;
                })
                .map((player, index) => (
                  <div
                    key={player.id}
                    className={`p-6 rounded-2xl border-2 transition-all transform ${
                      index === 0 
                        ? 'bg-gradient-to-br from-yellow-500/30 via-amber-500/20 to-orange-500/30 border-yellow-400 shadow-2xl shadow-yellow-500/40 scale-105' 
                        : 'bg-white/5 border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {index === 0 && (
                            <div className="absolute -top-2 -left-2 text-4xl animate-bounce">👑</div>
                          )}
                          <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg border-4 border-white/30"
                            style={{ backgroundColor: player.color }}
                          >
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg flex items-center gap-2">
                            {player.name}
                            {player.isBot && <span className="text-xs bg-white/20 px-2 py-0.5 rounded">🤖</span>}
                            {index === 0 && <span className="text-xs bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2 py-0.5 rounded font-bold">1⃣</span>}
                          </div>
                          <div className="text-sm text-white/70 mt-1">
                            {onTimeLimit ? (
                              <>⚡ {player.wordsFound > 0 ? (player.firstWordTime !== null && player.firstWordTime !== undefined ? player.firstWordTime + ' сек' : '—') : '-'}</>
                            ) : (
                              <>📝 слов: {player.wordsFound}</>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-4xl font-black" style={{ color: player.color }}>
                        {player.wordsFound}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-8 text-center flex flex-wrap gap-4 justify-center">
              {!gameState.rematchSessionId && (
                <button
                  onClick={() => rematchMutation.mutate({ sessionId, playerId })}
                  disabled={rematchMutation.isPending}
                  className="px-10 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-emerald-500/40 transition-all disabled:opacity-50 transform hover:scale-105"
                >
                  {rematchMutation.isPending ? '⏳' : '🔄'} Реванш!
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="px-10 py-4 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-purple-500/40 transition-all transform hover:scale-105"
              >
                🏠 Главная
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
