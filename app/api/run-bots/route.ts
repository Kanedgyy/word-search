import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { gamePlayers } from '../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { BotFactory } from '../../../server/bot';

// Edge Runtime — поддерживает waitUntil для фоновых задач
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

declare const waitUntil: ((promise: Promise<any>) => void) | undefined;

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    // Находим ботов в сессии
    const bots = await db.select().from(gamePlayers).where(
      and(eq(gamePlayers.sessionId, sessionId), eq(gamePlayers.isBot, true))
    );
    
    if (bots.length === 0) {
      return NextResponse.json({ success: true, botsStarted: 0 });
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
