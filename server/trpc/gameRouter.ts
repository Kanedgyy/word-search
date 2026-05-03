/**
 * Router для игровых процедур tRPC
 * 
 * Здесь определяются все API endpoints для игры:
 * - Создание сессии
 * - Присоединение к сессии
 * - Отправка найденного слова
 * - Получение состояния игры
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from './trpc';
import { generateWordSearch, getRandomWordSubset, validateWordByPath } from '../../lib/word-search';
import { gameSessions, gamePlayers, foundWords, matchHistory, users } from '../../drizzle/schema';
import { eq, asc, and } from 'drizzle-orm';
import { GameBot } from '../../server/bot';

// Типы для игроков и сессий
interface Player {
  id: string;
  name: string;
  isBot: boolean;
  color: string;
  wordsFound: number;
  firstWordTime?: number;
}

interface GameSession {
  id: string;
  grid: string[][];
  wordList: string[];
  players: Player[];
  foundWords: Set<string>;
  status: 'waiting' | 'in_progress' | 'finished';
  maxPlayers: number;
  duration: number;
  startTime?: number;
  endTime?: number;
}

// Цвета для игроков
const PLAYER_COLORS = [
  '#FF6B6B', // Красный
  '#4ECDC4', // Бирюзовый
  '#45B7D1', // Синий
  '#96CEB4', // Зелёный
  '#FFEAA7', // Жёлтый
  '#DDA0DD', // Фиолетовый
];

/**
 * Создаёт новую игровую сессию
 */
const createSession = publicProcedure
  .input(z.object({
    maxPlayers: z.number().min(2).max(6).default(6),
    duration: z.number().min(60).max(600).default(300),
    gameMode: z.enum(['individual', 'team']).default('individual'),
  }))
  .mutation(async ({ ctx, input }) => {
    const wordList = getRandomWordSubset(12);
    const { grid, placedWords } = generateWordSearch(wordList);

    const [session] = await ctx.db.insert(gameSessions).values({
      wordList: placedWords,
      grid: grid,
      status: 'waiting',
      maxPlayers: input.maxPlayers,
      duration: input.duration,
      gameMode: input.gameMode,
    }).returning();
    
    return {
      sessionId: session.id,
      grid,
      wordList: placedWords,
      maxPlayers: input.maxPlayers,
      duration: input.duration,
      gameMode: input.gameMode,
    };
  });

/**
 * Присоединение к сессии
 */
const joinSession = publicProcedure
  .input(z.object({
    sessionId: z.string(),
    playerName: z.string().min(1).max(20),
  }))
  .mutation(async ({ ctx, input }) => {
    const session = await ctx.db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, input.sessionId),
    });
    
    if (!session) {
      throw new Error('Сессия не найдена');
    }
    
    if (session.status !== 'waiting') {
      throw new Error('Игра уже началась');
    }
    
    const currentPlayers = await ctx.db.select().from(gamePlayers).where(
      eq(gamePlayers.sessionId, input.sessionId)
    );
    
    // Проверяем, есть ли уже игрок с таким именем (для реванша)
    const existingPlayer = currentPlayers.find(p => p.name === input.playerName && !p.isBot);
    if (existingPlayer) {
      return {
        playerId: existingPlayer.id,
        color: existingPlayer.color,
        playersCount: currentPlayers.length,
        isHost: currentPlayers[0]?.id === existingPlayer.id,
      };
    }
    
    if (currentPlayers.length >= session.maxPlayers) {
      throw new Error('Сессия заполнена');
    }
    
    const color = PLAYER_COLORS[currentPlayers.length % PLAYER_COLORS.length];
    
    const [player] = await ctx.db.insert(gamePlayers).values({
      sessionId: input.sessionId,
      name: input.playerName,
      isBot: false,
      color,
      turnOrder: currentPlayers.length + 1,
      status: 'joined',
    }).returning();
    
    return {
      playerId: player.id,
      color: player.color,
      playersCount: currentPlayers.length + 1,
      isHost: currentPlayers.length === 0,
    };
  });

/**
 * Запускает игру
 */
const startGame = publicProcedure
  .input(z.object({
    sessionId: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    const session = await ctx.db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, input.sessionId),
    });
    
    if (!session) {
      throw new Error('Сессия не найдена');
    }
    
    const players = await ctx.db.select().from(gamePlayers).where(
      eq(gamePlayers.sessionId, input.sessionId)
    );
    
    if (players.length < 1) {
      throw new Error('Нужен минимум 1 игрок');
    }
    
    await ctx.db.update(gameSessions)
      .set({ 
        status: 'in_progress',
        endsAt: new Date(Date.now() + session.duration * 1000),
      })
      .where(eq(gameSessions.id, input.sessionId));
    
    // Боты запускаются через отдельный Edge API route /api/run-bots
    // чтобы работать в serverless-окружении Vercel

    return {
      message: 'Игра началась!',
      grid: session.grid,
      playerCount: players.length,
    };
  });

/**
 * Проверяет найденное слово
 */
const submitWord = publicProcedure
  .input(z.object({
    sessionId: z.string(),
    playerId: z.string(),
    word: z.string(),
    path: z.array(z.object({ row: z.number(), col: z.number() })),
  }))
  .mutation(async ({ ctx, input }) => {
    const session = await ctx.db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, input.sessionId),
    });
    
    if (!session) {
      throw new Error('Сессия не найдена');
    }
    
    if (session.status !== 'in_progress') {
      throw new Error('Игра не началась или закончилась');
    }
    
    const player = await ctx.db.query.gamePlayers.findFirst({
      where: eq(gamePlayers.id, input.playerId),
    });
    
    if (!player) {
      throw new Error('Игрок не найден');
    }
    
    const upperWord = input.word.toUpperCase();
    
    const existingWord = await ctx.db.query.foundWords.findFirst({
      where: and(
        eq(foundWords.sessionId, input.sessionId),
        eq(foundWords.word, upperWord)
      ),
    });
    
    if (existingWord) {
      return {
        success: false,
        error: 'Это слово уже найдено',
      };
    }
    
    // Проверка: слово валидно по пути
    const validation = validateWordByPath(
      input.word,
      session.wordList,
      session.grid,
      input.path
    );
    
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }
    
    // Добавляем слово в найденные
    await ctx.db.insert(foundWords).values({
      sessionId: input.sessionId,
      playerId: input.playerId,
      word: upperWord,
      startRow: input.path[0]?.row ?? 0,
      startCol: input.path[0]?.col ?? 0,
      endRow: input.path[input.path.length - 1]?.row ?? 0,
      endCol: input.path[input.path.length - 1]?.col ?? 0,
      direction: 'horizontal',
      path: input.path,
    });
    
    // Обновляем firstWordTime, если это первое слово игрока
    if (!player.firstWordTime) {
      const sessionStartTime = session.createdAt ? new Date(session.createdAt).getTime() : Date.now();
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - sessionStartTime) / 1000);
      
      await ctx.db.update(gamePlayers)
        .set({ firstWordTime: elapsedSeconds })
        .where(eq(gamePlayers.id, input.playerId));
    }
    
    // Получаем актуальное количество найденных слов игроком
    const playerWords = await ctx.db.select({ id: foundWords.id })
      .from(foundWords)
      .where(eq(foundWords.playerId, input.playerId));
    
    const playerScore = playerWords.length;
    
    // Проверяем, закончилась ли игра (все слова найдены)
    const allFoundWords = await ctx.db.select().from(foundWords).where(
      eq(foundWords.sessionId, input.sessionId)
    );
    
    const gameEnded = allFoundWords.length >= session.wordList.length;
    
    if (gameEnded) {
      await ctx.db.update(gameSessions)
        .set({ status: 'finished' })
        .where(eq(gameSessions.id, input.sessionId));
    }
    
    // Вычисляем результаты
    const results = await calculateResults(ctx, input.sessionId);
    
    return {
      success: true,
      word: upperWord,
      playerScore,
      results,
      gameEnded,
    };
  });

/**
 * Вычисляет результаты игры
 */
async function calculateResults(ctx: any, sessionId: string) {
  const players = await ctx.db.select({
    player: gamePlayers,
  }).from(gamePlayers)
    .where(eq(gamePlayers.sessionId, sessionId));
  
  // Получаем все найденные слова для сессии и считаем вручную
  const allFound = await ctx.db.select({
    playerId: foundWords.playerId,
  }).from(foundWords)
    .where(eq(foundWords.sessionId, sessionId));
  
  const wordsCountMap = new Map<string, number>();
  for (const fw of allFound) {
    wordsCountMap.set(fw.playerId, (wordsCountMap.get(fw.playerId) || 0) + 1);
  }
  
  // Формируем результаты
  const results = players
    .map((p: { player: { id: string; name: string; isBot: boolean; firstWordTime: number | null } }) => ({
      id: p.player.id,
      name: p.player.name,
      wordsFound: wordsCountMap.get(p.player.id) || 0,
      isBot: p.player.isBot,
      firstWordTime: p.player.firstWordTime,
    }))
    .sort((a: { wordsFound: number; firstWordTime: number | null }, b: { wordsFound: number; firstWordTime: number | null }) => {
      if (b.wordsFound !== a.wordsFound) {
        return b.wordsFound - a.wordsFound;
      }
      // При равенстве — кто раньше нашёл первое слово (меньше секунд = лучше)
      const aTime = a.firstWordTime ?? Infinity;
      const bTime = b.firstWordTime ?? Infinity;
      return aTime - bTime;
    })
    .map((player: { id: string; name: string; wordsFound: number; isBot: boolean; firstWordTime: number | null }, index: number) => ({
      rank: index + 1,
      name: player.name,
      wordsFound: player.wordsFound,
      isBot: player.isBot,
      firstWordTime: player.firstWordTime,
    }));
    
  return results;
}

/**
 * Получает состояние сессии
 */
const getSessionState = publicProcedure
  .input(z.object({
    sessionId: z.string(),
    playerId: z.string().optional(),
  }))
  .query(async ({ ctx, input }) => {
    const session = await ctx.db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, input.sessionId),
    });
    
    if (!session) {
      throw new Error('Сессия не найдена');
    }
    
    // Получаем всех игроков
    const playersData = await ctx.db.select({
      player: gamePlayers,
    }).from(gamePlayers)
      .where(eq(gamePlayers.sessionId, input.sessionId))
      .orderBy(asc(gamePlayers.turnOrder));
    
    // Получаем найденные слова
    const foundWordsData = await ctx.db.select({
      playerId: foundWords.playerId,
      word: foundWords.word,
    }).from(foundWords)
      .where(eq(foundWords.sessionId, input.sessionId));
    
    // Считаем слова по игрокам
    const wordsCountMap = new Map<string, number>();
    foundWordsData.forEach(w => {
      wordsCountMap.set(w.playerId, (wordsCountMap.get(w.playerId) || 0) + 1);
    });
    
    // Формируем список игроков
    const players = playersData.map(p => ({
      id: p.player.id,
      name: p.player.name,
      color: p.player.color,
      wordsFound: wordsCountMap.get(p.player.id) || 0,
      isBot: p.player.isBot,
      firstWordTime: p.player.firstWordTime,
      team: p.player.team,
    }));
    
    // Находим текущего игрока
    const currentPlayer = input.playerId
      ? players.find(p => p.id === input.playerId) || null
      : null;
    
    return {
      id: session.id,
      status: session.status,
      grid: session.grid,
      wordList: session.wordList,
      players,
      foundWords: foundWordsData.map(w => w.word),
      maxPlayers: session.maxPlayers,
      duration: session.duration,
      gameMode: session.gameMode,
      startTime: session.createdAt,
      endTime: session.endsAt,
      player: currentPlayer,
      teams: calculateTeams(players),
      rematchSessionId: session.rematchSessionId,
    };
  });

/**
 * Вычисляет результаты команд
 */
function calculateTeams(players: Array<{
  id: string;
  name: string;
  color: string;
  wordsFound: number;
  isBot: boolean;
  firstWordTime?: number | null;
  team?: string | null;
}>) {
  const teams = new Map<string, { name: string; totalWords: number; players: string[] }>();
  
  players.forEach(player => {
    if (player.team) {
      if (!teams.has(player.team)) {
        teams.set(player.team, {
          name: getTeamName(player.team),
          totalWords: 0,
          players: [],
        });
      }
      const team = teams.get(player.team)!;
      team.totalWords += player.wordsFound;
      team.players.push(player.name);
    }
  });
  
  return Array.from(teams.entries()).map(([id, data]) => ({
    id,
    ...data,
  })).sort((a, b) => b.totalWords - a.totalWords);
}

function getTeamName(teamId: string): string {
  const names: Record<string, string> = {
    red: 'Красная команда',
    blue: 'Синяя команда',
    green: 'Зелёная команда',
    yellow: 'Жёлтая команда',
  };
  return names[teamId] || teamId;
}

/**
 * Устанавливает команду игрока
 */
const setTeam = publicProcedure
  .input(z.object({
    sessionId: z.string(),
    playerId: z.string(),
    team: z.enum(['red', 'blue', 'green', 'yellow']).nullable(),
  }))
  .mutation(async ({ ctx, input }) => {
    const session = await ctx.db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, input.sessionId),
    });
    
    if (!session) {
      throw new Error('Сессия не найдена');
    }
    
    if (session.status !== 'waiting') {
      throw new Error('Нельзя менять команду после начала игры');
    }
    
    await ctx.db.update(gamePlayers)
      .set({ team: input.team })
      .where(eq(gamePlayers.id, input.playerId));
    
    return {
      success: true,
      team: input.team,
    };
  });

/**
 * Добавляет бота в сессию (для демонстрации)
 */
const addBot = publicProcedure
  .input(z.object({
    sessionId: z.string(),
    botName: z.string().min(1).max(20),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    team: z.enum(['red', 'blue', 'green', 'yellow']).nullable().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const session = await ctx.db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, input.sessionId),
    });
    
    if (!session) {
      throw new Error('Сессия не найдена');
    }
    
    if (session.status !== 'waiting') {
      throw new Error('Игра уже началась');
    }
    
    const currentPlayers = await ctx.db.select().from(gamePlayers).where(
      eq(gamePlayers.sessionId, input.sessionId)
    );
    
    if (currentPlayers.length >= session.maxPlayers) {
      throw new Error('Сессия заполнена');
    }
    
    const color = PLAYER_COLORS[currentPlayers.length % PLAYER_COLORS.length];
    
    const [bot] = await ctx.db.insert(gamePlayers).values({
      sessionId: input.sessionId,
      name: input.botName,
      isBot: true,
      color,
      turnOrder: currentPlayers.length + 1,
      status: 'joined',
      team: input.team ?? null,
      difficulty: input.difficulty,
    }).returning();
    
    return {
      playerId: bot.id,
      color: bot.color,
      playersCount: currentPlayers.length + 1,
      difficulty: input.difficulty,
      team: bot.team,
    };
  });

/**
 * Создаёт реванш — новую сессию с теми же игроками
 */
const rematch = publicProcedure
  .input(z.object({
    sessionId: z.string(),
    playerId: z.string(), // ID игрока, запросившего реванш
  }))
  .mutation(async ({ ctx, input }) => {
    const oldSession = await ctx.db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, input.sessionId),
    });
    
    if (!oldSession) {
      throw new Error('Сессия не найдена');
    }
    
    // Получаем всех игроков старой сессии (только реальных, не ботов)
    const oldPlayers = await ctx.db.select().from(gamePlayers).where(
      eq(gamePlayers.sessionId, input.sessionId)
    );
    
    const realPlayers = oldPlayers.filter(p => !p.isBot);
    
    // Создаём новую сессию
    const wordList = getRandomWordSubset(12);
    const { grid, placedWords } = generateWordSearch(wordList);
    
    const [newSession] = await ctx.db.insert(gameSessions).values({
      wordList: placedWords,
      grid: grid,
      status: 'waiting',
      maxPlayers: oldSession.maxPlayers,
      duration: oldSession.duration,
      gameMode: oldSession.gameMode,
    }).returning();
    
    // Добавляем тех же игроков в новую сессию
    const newPlayerIds: Array<{ oldId: string; newId: string }> = [];
    for (let i = 0; i < realPlayers.length; i++) {
      const oldPlayer = realPlayers[i];
      const [newPlayer] = await ctx.db.insert(gamePlayers).values({
        sessionId: newSession.id,
        name: oldPlayer.name,
        isBot: false,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        turnOrder: i + 1,
        status: 'joined',
        team: oldPlayer.team,
      }).returning();
      
      newPlayerIds.push({ oldId: oldPlayer.id, newId: newPlayer.id });
    }
    
    // Записываем ссылку на реванш в старую сессию
    await ctx.db.update(gameSessions)
      .set({ rematchSessionId: newSession.id })
      .where(eq(gameSessions.id, input.sessionId));
    
    return {
      success: true,
      sessionId: newSession.id,
      grid,
      wordList: placedWords,
      playerMap: newPlayerIds,
      gameMode: oldSession.gameMode,
    };
  });

// Экспортируем router
export const gameRouter = createTRPCRouter({
  createSession,
  joinSession,
  startGame,
  submitWord,
  getSessionState,
  addBot,
  setTeam,
  rematch,
});

export type GameRouter = typeof gameRouter;
