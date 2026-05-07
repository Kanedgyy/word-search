import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gameSessions, gamePlayers, matchHistory, foundWords } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { BotFactory } from '@/server/bot';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function saveMatchHistory(sessionId: string) {
  console.log(`[run-bots saveMatchHistory] === НАЧАЛО сохранения ===`);
  
  // Проверяем дубликаты
  const existing = await db.select().from(matchHistory).where(eq(matchHistory.sessionId, sessionId));
  if (existing.length > 0) {
    console.log(`[run-bots saveMatchHistory] Статистика уже сохранена`);
    return false;
  }
  
  // Получаем игроков
  const players = await db.select({ player: gamePlayers }).from(gamePlayers)
    .where(eq(gamePlayers.sessionId, sessionId));
  
  // Получаем слова
  const words = await db.select({ playerId: foundWords.playerId }).from(foundWords)
    .where(eq(foundWords.sessionId, sessionId));
  
  const wordsCount = new Map<string, number>();
  words.forEach(w => wordsCount.set(w.playerId, (wordsCount.get(w.playerId) || 0) + 1));
  
  // Сортируем
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
  
  const rankMap = new Map(results.map((r, i) => [r.id, i + 1]));
  
  // Фильтруем и сохраняем
  const entries = players
    .map(p => {
      const wf = wordsCount.get(p.player.id) || 0;
      if (wf === 0) return null;
      return {
        sessionId,
        userId: p.player.userId,
        playerName: p.player.name,
        wordsFound: wf,
        firstWordTime: p.player.firstWordTime,
        rank: rankMap.get(p.player.id) || null,
      };
    })
    .filter(Boolean);
  
  if (entries.length > 0) {
    try {
      await db.insert(matchHistory).values(entries as any);
      console.log(`[run-bots saveMatchHistory] ✓ Сохранено ${entries.length} записей`);
      return true;
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('unique')) {
        console.log(`[run-bots saveMatchHistory] Статистика уже сохранена кем-то`);
        return false;
      }
      console.error(`[run-bots saveMatchHistory] Ошибка:`, err);
      return false;
    }
  }
    
  return false;
}

export async function POST(request: NextRequest) {
  console.log(`[run-bots] === ПОЛУЧЕН ЗАПРОС для сессии ===`);
  
  try {
    const body = await request.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      console.error('[run-bots] sessionId не указан!');
      return NextResponse.json({ success: false, error: 'sessionId не указан' }, { status: 400 });
    }
    
    console.log(`[run-bots] sessionId: ${sessionId}`);
    
    console.log(`[run-bots] Загружаю ботов для ${sessionId}`);
    const bots = await db.select().from(gamePlayers).where(
      and(eq(gamePlayers.sessionId, sessionId), eq(gamePlayers.isBot, true))
    );
    
    console.log(`[run-bots] Найдено ${bots.length} ботов:`, bots.map(b => ({ id: b.id, name: b.name, difficulty: b.difficulty })));
    
    if (bots.length === 0) {
      console.log(`[run-bots] НЕТ БОТОВ в этой сессии!`);
      return NextResponse.json({ success: true, message: 'Ботов нет', botsCount: 0 });
    }
    
    // Проверяем что игра в процессе
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId)
    });
    
    if (!session) {
      console.log(`[run-bots] Сессия не найдена`);
      return NextResponse.json({ success: false, error: 'Сессия не найдена' }, { status: 404 });
    }
    
    console.log(`[run-bots] Статус сессии: ${session.status}`);
    
    if (session.status !== 'in_progress') {
      console.log(`[run-bots] Игра не в процессе: ${session.status}`);
      return NextResponse.json({ success: false, error: 'Игра не в процессе' }, { status: 400 });
    }
    
    console.log(`[run-bots] === ЗАПУСКАЮ ВСЕХ БОТОВ ===`);
    console.log(`[run-bots] Количество ботов: ${bots.length}`);
    
    // Запускаем ВСЕХ ботов ПАРАЛЛЕЛЬНО и ЖДЁМ завершения
    const botPromises: Promise<void>[] = [];
    
    for (const bot of bots) {
      const difficulty = (bot.difficulty as 'easy' | 'medium' | 'hard') || 'medium';
      console.log(`[run-bots] Создаю бота ${bot.id} (${bot.name}), сложность: ${difficulty}`);
      
      const botPromise = (async () => {
        try {
          const gameBot = BotFactory.createBot(sessionId, bot.id, difficulty);
          console.log(`[run-bots] Бот ${bot.id} создан, запускаю startFindingWords()`);
          await gameBot.startFindingWords();
          console.log(`[run-bots] Бот ${bot.id} завершил работу`);
        } catch (err: any) {
          console.error(`[run-bots] Ошибка бота ${bot.id}:`, err?.message || err);
        }
      })();
      
      botPromises.push(botPromise);
    }
    
    console.log(`[run-bots] Запущено ${botPromises.length} ботов, ждём завершения...`);
    
    // Ждём пока ВСЕ боты закончат (максимум 60 секунд)
    const timeout = new Promise<void>((_, reject) => {
      setTimeout(() => {
        console.log(`[run-bots] Таймаут 60 секунд! Принудительно завершаю...`);
        reject(new Error('Таймаут'));
      }, 60000);
    });
    
    try {
      await Promise.race([Promise.all(botPromises), timeout]);
      console.log(`[run-bots] === ВСЕ БОТЫ ЗАВЕРШИЛИ РАБОТУ ===`);
    } catch (err: any) {
      console.log(`[run-bots] Ожидание завершено: ${err?.message || err}`);
    }
    
    // Проверяем статус игры после завершения ботов
    const finalSession = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId)
    });
    
    if (finalSession && finalSession.status === 'finished') {
      console.log(`[run-bots] Игра завершена, проверяю статистику...`);
      
      // Проверяем есть ли уже записи в matchHistory
      const existingEntries = await db.select().from(matchHistory).where(eq(matchHistory.sessionId, sessionId));
      
      if (existingEntries.length === 0) {
        console.log(`[run-bots] Статистика не найдена, сохраняю...`);
        const saved = await saveMatchHistory(sessionId);
        console.log(`[run-bots] Статистика ${saved ? 'успешно' : 'НЕ'} сохранена`);
      } else {
        console.log(`[run-bots] Статистика уже сохранена (${existingEntries.length} записей)`);
      }
    } else {
      console.log(`[run-bots] Игра не завершена или сессия не найдена`);
    }
    
    console.log(`[run-bots] Отправляю ответ success=true`);
    return NextResponse.json({ success: true, message: 'Все боты завершили игру', botsCount: bots.length });
    
  } catch (error: any) {
    console.error('[run-bots] КРИТИЧЕСКАЯ ОШИБКА:', error?.message || error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Неизвестная ошибка' 
    }, { status: 500 });
  }
}

