/**
 * API endpoint для запуска WebSocket сервера
 * Next.js App Router версия
 */

import { NextResponse } from 'next/server';
import { initWebSocketServer, getWebSocketServer } from '@/server/websocket';

let serverInstance: ReturnType<typeof initWebSocketServer> | null = null;

export async function POST() {
  const port = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001;
  
  if (!serverInstance) {
    serverInstance = initWebSocketServer(port);
    
    return NextResponse.json({ 
      success: true, 
      message: `WebSocket сервер запущен на порту ${port}`,
    });
  } else {
    return NextResponse.json({ 
      success: true, 
      message: 'WebSocket сервер уже запущен',
    });
  }
}

export async function GET() {
  const server = getWebSocketServer();
  
  return NextResponse.json({ 
    success: !!server,
    message: server ? 'WebSocket сервер запущен' : 'WebSocket сервер не запущен',
  });
}
