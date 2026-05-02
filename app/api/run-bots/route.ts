import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { db } from '../../../lib/db';
import { gamePlayers } from '../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { BotFactory } from '../../../server/bot';

// Node.js runtime — поддерживает TCP-соединения с PostgreSQL
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    // Запускаем ботов в фоне ПОСЛЕ отправки ответа
    after(async () => {
      try {
        const bots = await db.select().from(gamePlayers).where(
          and(eq(gamePlayers.sessionId, sessionId), eq(gamePlayers.isBot, true))
        );
        
        console.log(`[after] Запуск ${bots.length} ботов для сессии ${sessionId}`);
        
        for (const bot of bots) {
          const difficulty = (bot.difficulty as 'easy' | 'medium' | 'hard') || 'medium';
          const gameBot = BotFactory.createBot(sessionId, bot.id, difficulty);
          gameBot.startFindingWords().catch(err => {
            console.error(`[after] Ошибка бота ${bot.id}:`, err);
          });
        }
      } catch (err) {
        console.error('[after] Ошибка запуска ботов:', err);
      }
    });
    
    return NextResponse.json({ success: true, message: 'Боты запущены в фоне' });
  } catch (error: any) {
    console.error('Run bots error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

    for (const bot of bots) {
      const difficulty = (bot.difficulty as 'easy' | 'medium' | 'hard') || 'medium';
      const gameBot = BotFactory.createBot(sessionId, bot.id, difficulty);
      
      // waitUntil позволяет фоновой задаче работать после отправки ответа
      const botPromise = gameBot.startFindingWords().catch(err => {
        console.error(`Ошибка бота ${bot.id}:`, err);
      });
      
      if (typeof waitUntil === 'function') {
        waitUntil(botPromise);
      }
    }
    
    return NextResponse.json({ success: true, botsStarted: bots.length });
  } catch (error: any) {
    console.error('Run bots error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
