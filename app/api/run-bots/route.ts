import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gameSessions, gamePlayers, matchHistory, foundWords } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { BotFactory } from '@/server/bot';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Сохраняет статистику матча после завершения игры
 * Сохраняет ВСЕХ игроков, включая тех кто нашёл 0 слов
 */
async function saveMatchHistory(sessionId: string) {
  console.log(`[run-bots saveMatchHistory] === НАЧАЛО сохранения ===`);
  
  // Проверка дубликатов
  const existing = await db.select().from(matchHistory).where(eq(matchHistory.sessionId, sessionId));
  if (existing.length > 0) {
    console.log(`[run-bots saveMatchHistory] Статистика уже сохранена (${existing.length} записей)`);
    return false;
  }
  
  // Получаем всех игроков
  const players = await db.select({ player: gamePlayers }).from(gamePlayers)
    .where(eq(gamePlayers.sessionId, sessionId));
  
  console.log(`[run-bots saveMatchHistory] Найдено игроков: ${players.length}`);
  
  // Получаем все найденные слова
  const words = await db.select({ playerId: foundWords.playerId }).from(foundWords)
    .where(eq(foundWords.sessionId, sessionId));
  
  console.log(`[run-bots saveMatchHistory] Найдено слов в БД: ${words.length}`);
  
  // Считаем слова для каждого игрока
  const wordsCount = new Map<string, number>();
  words.forEach(w => wordsCount.set(w.playerId, (wordsCount.get(w.playerId) || 0) + 1));
  
  // Считаем время первого слова для каждого игрока
  const firstWordTimes = new Map<string, number>();
  const foundWordsFull = await db.select({ 
    playerId: foundWords.playerId,
    foundAt: foundWords.foundAt
  }).from(foundWords).where(eq(foundWords.sessionId, sessionId));
  
  for (const fw of foundWordsFull) {
    if (!firstWordTimes.has(fw.playerId)) {
      firstWordTimes.set(fw.playerId, 0);
    }
  }
  
  // Получаем firstWordTime из gamePlayers
  for (const p of players) {
    firstWordTimes.set(p.player.id, p.player.firstWordTime ?? Infinity);
  }
  
  // Сортируем игроков по результатам
  const results = players
    .map(p => ({
      id: p.player.id,
      name: p.player.name,
      wordsFound: wordsCount.get(p.player.id) || 0,
      firstWordTime: p.player.firstWordTime,
    }))
    .sort((a, b) => {
      if (b.wordsFound !== a.wordsFound) return b.wordsFound - a.wordsFound;
      return (a.firstWordTime ?? Infinity) - (b.firstWordTime ?? Infinity);
    });
  
  console.log(`[run-bots saveMatchHistory] Результаты:`, results);
  
  // Создаём карту мест
  const rankMap = new Map<string, number>();
  results.forEach((r, i) => rankMap.set(r.id, i + 1));
  
  // Создаём записи для всех игроков (даже с 0 словами)
  const entries = players.map(p => {
    const wf = wordsCount.get(p.player.id) || 0;
    const rank = rankMap.get(p.player.id) || null;
    const firstWordTime = p.player.firstWordTime ?? null;
    
    console.log(`[run-bots saveMatchHistory] Игрок ${p.player.name}: ${wf} слов, место: ${rank}`);
    
    return {
      sessionId,
      userId: p.player.userId,
      playerName: p.player.name,
      wordsFound: wf,
      firstWordTime: firstWordTime,
      rank: rank,
    };
  });
  
  console.log(`[run-bots saveMatchHistory] ИТОГО записей для сохранения: ${entries.length}`);
  
  if (entries.length > 0) {
    try {
      await db.insert(matchHistory).values(entries as any);
      console.log(`[run-bots saveMatchHistory] ✓ УСПЕШНО сохранено ${entries.length} записей!`);
      
      // Проверка
      const verify = await db.select().from(matchHistory).where(eq(matchHistory.sessionId, sessionId));
      console.log(`[run-bots saveMatchHistory] ✓ Проверка: в БД теперь ${verify.length} записей`);
      return true;
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('unique')) {
        console.log(`[run-bots saveMatchHistory] Статистика уже сохранена кем-то (ошибка уникальности)`);
        return false;
      }
      console.error(`[run-bots saveMatchHistory] Ошибка:`, err);
      return false;
    }
  }
  
  console.log('[run-bots saveMatchHistory] ⚠ НЕТ записей для сохранения');
  return false;
}

export async function POST(request: NextRequest) {
  console.log(`[run-bots] === ПОЛУЧЕН ЗАПРОС ===`);
  
  try {
    const body = await request.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      console.error('[run-bots] sessionId не указан!');
      return NextResponse.json({ success: false, error: 'sessionId не указан' }, { status: 400 });
    }
    
    console.log(`[run-bots] sessionId: ${sessionId}`);
    
    // Проверяем сессию
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId)
    });
    
    if (!session) {
      console.error('[run-bots] Сессия не найдена');
      return NextResponse.json({ success: false, error: 'Сессия не найдена' }, { status: 404 });
    }
    
    console.log(`[run-bots] Статус сессии: ${session.status}`);
    
    // Если игра ещё не началась или уже закончена - просто сохраняем статистику
    if (session.status === 'finished') {
      console.log(`[run-bots] Игра уже завершена, проверяю статистику...`);
      const existing = await db.select().from(matchHistory).where(eq(matchHistory.sessionId, sessionId));
      if (existing.length === 0) {
        console.log(`[run-bots] Статистика не найдена, сохраняю...`);
        await saveMatchHistory(sessionId);
      } else {
        console.log(`[run-bots] Статистика уже есть (${existing.length} записей)`);
      }
      return NextResponse.json({ success: true, message: 'Игра завершена', botsCount: 0 });
    }
    
    if (session.status !== 'in_progress') {
      console.log(`[run-bots] Игра не в процессе: ${session.status}`);
      return NextResponse.json({ success: false, error: 'Игра не в процессе' }, { status: 400 });
    }
    
    // Проверяем есть ли боты
    const bots = await db.select().from(gamePlayers).where(
      and(eq(gamePlayers.sessionId, sessionId), eq(gamePlayers.isBot, true))
    );
    
    console.log(`[run-bots] Найдено ${bots.length} ботов`);
    
    // Запускаем ботов если они есть
    if (bots.length > 0) {
      console.log(`[run-bots] === ЗАПУСКАЮ ВСЕХ БОТОВ ===`);
      
      const botPromises: Promise<void>[] = [];
      
      for (const bot of bots) {
        const difficulty = (bot.difficulty as 'easy' | 'medium' | 'hard') || 'medium';
        console.log(`[run-bots] Создаю бота ${bot.id} (${bot.name}), сложность: ${difficulty}`);
        
        const botPromise = (async () => {
          try {
            const gameBot = BotFactory.createBot(sessionId, bot.id, difficulty);
            await gameBot.startFindingWords();
            console.log(`[run-bots] Бот ${bot.id} завершил работу`);
          } catch (err: any) {
            console.error(`[run-bots] Ошибка бота ${bot.id}:`, err?.message || err);
          }
        })();
        
        botPromises.push(botPromise);
      }
      
      console.log(`[run-bots] Запущено ${botPromises.length} ботов, ждём...`);
      
      const timeout = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Таймаут')), 60000);
      });
      
      try {
        await Promise.race([Promise.all(botPromises), timeout]);
        console.log(`[run-bots] === ВСЕ БОТЫ ЗАВЕРШИЛИ РАБОТУ ===`);
      } catch (err: any) {
        console.log(`[run-bots] Ожидание завершено: ${err?.message || err}`);
      }
      
      // ТОЛЬКО ЕСЛИ ЕСТЬ БОТЫ - завершаем игру и сохраняем статистику
      console.log(`[run-bots] Завершаю игру и сохраняю статистику...`);
      
      // Проверяем текущий статус
      const finalSession = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, sessionId)
      });
      
      if (finalSession && finalSession.status !== 'finished') {
        await db.update(gameSessions)
          .set({ status: 'finished' })
          .where(eq(gameSessions.id, sessionId));
        console.log(`[run-bots] Игра завершена принудительно`);
      }
      
      // Проверяем статистику
      const existingEntries = await db.select().from(matchHistory).where(eq(matchHistory.sessionId, sessionId));
      
      if (existingEntries.length === 0) {
        console.log(`[run-bots] Статистика не найдена, сохраняю...`);
        const saved = await saveMatchHistory(sessionId);
        console.log(`[run-bots] Статистика ${saved ? 'успешно' : 'НЕ'} сохранена`);
      } else {
        console.log(`[run-bots] Статистика уже сохранена (${existingEntries.length} записей)`);
      }
    } else {
      console.log(`[run-bots] БОТОВ НЕТ - одиночная игра, не завершаем игру автоматически`);
      // В одиночной игре игра завершится когда игрок найдёт все слова через submitWord
    }
    
    return NextResponse.json({ 
      success: true, 
      message: bots.length > 0 ? 'Игра завершена, статистика сохранена' : 'Ботов нет, игра продолжается', 
      botsCount: bots.length 
    });
    
  } catch (error: any) {
    console.error('[run-bots] КРИТИЧЕСКАЯ ОШИБКА:', error?.message || error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Неизвестная ошибка' 
    }, { status: 500 });
  }
}
