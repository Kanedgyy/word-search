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
    
    console.log(`[run-bots] === ЗАПУСКАЮ БОТОВ В ФОНЕ ===`);
    
    // Запускаем ботов в фоне через новый Worker
    // Используем setTimeout с большой задержкой чтобы гарантировать выполнение после ответа
    setTimeout(async () => {
      console.log(`[run-bots] Фоновый процесс запущен для ${sessionId}`);
      try {
        // Перезагружаем ботов из БД
        const freshBots = await db.select().from(gamePlayers).where(
          and(eq(gamePlayers.sessionId, sessionId), eq(gamePlayers.isBot, true))
        );
        
        console.log(`[run-bots] Загружено ${freshBots.length} ботов для запуска`);
        
        // Создаём массив промисов для ВСЕХ ботов
        const botPromises: Promise<void>[] = [];
        
        for (const bot of freshBots) {
          const difficulty = (bot.difficulty as 'easy' | 'medium' | 'hard') || 'medium';
          console.log(`[run-bots] === Создаю бота ${bot.id} (${bot.name}), сложность: ${difficulty} ===`);
          
          // Создаём промис для каждого бота
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
        
        // Ждём пока ВСЕ боты закончат (или игра закончится)
        await Promise.all(botPromises);
        console.log(`[run-bots] === ВСЕ БОТЫ ЗАВЕРШИЛИ РАБОТУ (${freshBots.length} шт) ===`);
      } catch (err) {
        console.error('[run-bots] Ошибка в фоновом процессе:', err);
      }
    }, 100);
    
    // Возвращаем ответ сразу
    console.log(`[run-bots] Ответ отправлен, боты запущены в фоне`);
    return NextResponse.json({ success: true, message: 'Боты запущены в фоне', botsCount: bots.length });
    
  } catch (error: any) {
    console.error('[run-bots] Ошибка:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
