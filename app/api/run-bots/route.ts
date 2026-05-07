import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { gamePlayers, gameSessions } from '../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { BotFactory } from '../../../server/bot';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    console.log(`[run-bots] === Получен запрос для сессии ${sessionId} ===`);
    
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
    
    if (session.status !== 'in_progress') {
      console.log(`[run-bots] Игра не в процессе: ${session.status}`);
      return NextResponse.json({ success: false, error: 'Игра не в процессе' }, { status: 400 });
    }
    
    console.log(`[run-bots] === ЗАПУСКАЮ БОТОВ ПРЯМО ЗДЕСЬ ===`);
    
    // Запускаем ботов синхронно в этом же запросе
    // Они будут работать в фоне после того как ответ вернётся
    for (const bot of bots) {
      const difficulty = (bot.difficulty as 'easy' | 'medium' | 'hard') || 'medium';
      console.log(`[run-bots] Создаю бота ${bot.id} (${bot.name}), сложность: ${difficulty}`);
      
      try {
        const gameBot = BotFactory.createBot(sessionId, bot.id, difficulty);
        console.log(`[run-bots] Бот ${bot.id} создан, запускаю startFindingWords()`);
        
        // Запускаем бота - он будет работать асинхронно
        const botPromise = gameBot.startFindingWords();
        
        // Не ждём завершения, но даем боту начать инициализацию
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`[run-bots] Бот ${bot.id} начал работу`);
        
      } catch (err) {
        console.error(`[run-bots] Ошибка создания бота ${bot.id}:`, err);
      }
    }
    
    // Ждём немного чтобы боты успели начать
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log(`[run-bots] === ВСЕ БОТЫ ЗАПУЩЕНЫ ===`);
    return NextResponse.json({ success: true, message: 'Боты запущены', botsCount: bots.length });
    
  } catch (error: any) {
    console.error('[run-bots] Ошибка:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
