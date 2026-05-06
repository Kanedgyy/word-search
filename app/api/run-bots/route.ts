import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { gamePlayers, gameSessions } from '../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { BotFactory } from '../../../server/bot';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    console.log(`[run-bots] Получен запрос для сессии ${sessionId}`);
    
    try {
      console.log(`[run-bots] Загружаю ботов для ${sessionId}`);
      const bots = await db.select().from(gamePlayers).where(
        and(eq(gamePlayers.sessionId, sessionId), eq(gamePlayers.isBot, true))
      );
      
      console.log(`[run-bots] Найдено ${bots.length} ботов для сессии ${sessionId}`);
      console.log(`[run-bots] Боты:`, bots.map(b => ({ id: b.id, name: b.name, difficulty: b.difficulty })));
      
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
      
      // Запускаем ботов в фоне (не ждём)
      for (const bot of bots) {
        const difficulty = (bot.difficulty as 'easy' | 'medium' | 'hard') || 'medium';
        console.log(`[run-bots] Запуск бота ${bot.id} (${bot.name}), сложность: ${difficulty}`);
        
        // Запускаем бота в отдельном микротаске
        queueMicrotask(() => {
          try {
            const gameBot = BotFactory.createBot(sessionId, bot.id, difficulty);
            gameBot.startFindingWords().catch(err => {
              console.error(`[run-bots] Ошибка бота ${bot.id}:`, err);
            });
            console.log(`[run-bots] Бот ${bot.id} запущен через queueMicrotask`);
          } catch (err) {
            console.error(`[run-bots] Ошибка создания бота ${bot.id}:`, err);
          }
        });
      }
      
      // Даем немного времени чтобы микротаски начали выполняться
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log(`[run-bots] Все боты запущены!`);
      return NextResponse.json({ success: true, message: 'Боты запущены', botsCount: bots.length });
      
    } catch (innerError: any) {
      console.error('[run-bots] Ошибка внутри:', innerError);
      return NextResponse.json({ success: false, error: innerError.message }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Run bots error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
