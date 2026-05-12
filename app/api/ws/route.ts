/**
 * API endpoint для WebSocket сервера
 * 
 * Запускает WebSocket сервер для real-time синхронизации игры
 */

import { NextResponse } from 'next/server';

// WebSocket сервер запускается только если включён через переменную окружения
const WS_ENABLED = process.env.ENABLE_WS === 'true';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: WS_ENABLED ? 'WebSocket сервер включён' : 'WebSocket сервер выключен',
    port: process.env.WS_PORT || '3001',
    enabled: WS_ENABLED,
  });
}

