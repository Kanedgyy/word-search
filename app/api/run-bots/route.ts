import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { gamePlayers, gameSessions } from '../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { BotFactory } from '../../../server/bot';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Увеличиваем время выполнения до 60 секунд

export async function POST(request: NextRequest) {
  console.log(`[run-bots] === ПОЛУЧЕН ЗАПРОС для сессии ===`);
  
  try {
    const { sessionId } = await request.json();
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
        } catch (err) {
          console.error(`[run-bots] Ошибка бота ${bot.id}:`, err);
        }
      })();
      
      botPromises.push(botPromise);
    }
    
    console.log(`[run-bots] Запущено ${botPromises.length} ботов, ждём завершения...`);
    
    // Ждём пока ВСЕ боты закончат
    await Promise.all(botPromises);
    
    console.log(`[run-bots] === ВСЕ БОТЫ ЗАВЕРШИЛИ РАБОТУ ===`);
    
    return NextResponse.json({ success: true, message: 'Все боты завершили игру', botsCount: bots.length });
    
  } catch (error: any) {
    console.error('[run-bots] Ошибка:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
