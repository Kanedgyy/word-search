/**
 * React Hook для работы с WebSocket
 * 
 * Подключается к WS серверу и обрабатывает сообщения
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { WSMessage, WSMessageType } from '../server/websocket';

interface UseWebSocketOptions {
  sessionId: string;
  playerId: string;
  onMessage?: (message: WSMessage) => void;
}

export function useWebSocket({ sessionId, playerId, onMessage }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Определяем URL WebSocket (в dev используем тот же хост)
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    
    // Проверяем включён ли WebSocket
    const WS_ENABLED = process.env.NEXT_PUBLIC_WS_ENABLED === 'true';
    if (!WS_ENABLED) {
      console.log('[WS] WebSocket выключен, используем polling');
      return;
    }
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket подключен');
      setIsConnected(true);
      setError(null);
      
      // Отправляем информацию о присоединении
      ws.send(JSON.stringify({
        type: 'player_joined',
        sessionId,
        data: { playerId },
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        onMessage?.(message);
      } catch (err) {
        console.error('Ошибка парсинга WS сообщения:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket отключен');
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('WebSocket ошибка:', err);
      setError('Ошибка подключения');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [sessionId, playerId, onMessage]);

  const sendMessage = useCallback((type: WSMessageType, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type,
        sessionId,
        data,
      }));
    }
  }, [sessionId]);

  return {
    isConnected,
    error,
    sendMessage,
  };
}
