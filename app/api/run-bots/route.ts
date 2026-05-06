import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { db } from '../../../lib/db';
import { gamePlayers } from '../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { BotFactory } from '../../../server/bot';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    console.log(`[run-bots] Получен запрос для сессии ${sessionId}`);
    
    after(async () => {
      try {
        console.log(`[after] Запускаю ботов для ${sessionId}`);
        const bots = await db.select().from(gamePlayers).where(
          and(eq(gamePlayers.sessionId, sessionId), eq(gamePlayers.isBot, true))
        );
        
        console.log(`[after] Найдено ${bots.length} ботов для сессии ${sessionId}`);
        console.log(`[after] Боты:`, bots.map(b => ({ id: b.id, name: b.name, difficulty: b.difficulty })));
        
        if (bots.length === 0) {
          console.log(`[after] НЕТ БОТОВ в этой сессии!`);
        }
        
        for (const bot of bots) {
          const difficulty = (bot.difficulty as 'easy' | 'medium' | 'hard') || 'medium';
          console.log(`[after] Запуск бота ${bot.id} (${bot.name}), сложность: ${difficulty}`);
          const gameBot = BotFactory.createBot(sessionId, bot.id, difficulty);
          gameBot.startFindingWords().catch(err => {
            console.error(`[after] Ошибка бота ${bot.id}:`, err);
          });
        }
      } catch (err) {
        console.error('[after] Ошибка запуска ботов:', err);
      }
    });
    
    return NextResponse.json({ success: true, message: `Запущено в фоне` });
  } catch (error: any) {
    console.error('Run bots error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
