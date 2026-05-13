/**
 * React Hook для работы с WebSocket
 * 
 * Подключается к WS серверу и обрабатывает сообщения
 * Автоматически переподключается при обрыве связи
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { WSMessage, WSMessageType } from '@/server/websocket';

interface UseWebSocketOptions {
  sessionId: string;
  playerId: string;
  onMessage?: (message: WSMessage) => void;
  enabled?: boolean;
}

interface WebSocketState {
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;
}

export function useWebSocket({ sessionId, playerId, onMessage, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    error: null,
    reconnectAttempts: 0,
  });

  const connect = useCallback(() => {
    if (!enabled) return;
    
    // Определяем URL WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Подключен к WebSocket серверу');
        setState({
          isConnected: true,
          error: null,
          reconnectAttempts: 0,
        });
        
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
          console.error('[WS] Ошибка парсинга сообщения:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Подключение закрыто');
        setState(prev => ({ ...prev, isConnected: false }));
        
        // Автоматическое переподключение с экспоненциальной задержкой
        if (enabled && state.reconnectAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000);
          console.log(`[WS] Переподключение через ${delay}мс (попытка ${state.reconnectAttempts + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }));
            connect();
          }, delay);
        }
      };

      ws.onerror = (err) => {
        console.error('[WS] Ошибка подключения:', err);
        setState(prev => ({
          ...prev,
          error: 'Ошибка подключения к серверу',
          isConnected: false,
        }));
      };
    } catch (err) {
      console.error('[WS] Ошибка создания подключения:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Неизвестная ошибка',
      }));
    }
  }, [sessionId, playerId, enabled, onMessage, state.reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState({
      isConnected: false,
      error: null,
      reconnectAttempts: 0,
    });
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  const sendMessage = useCallback((type: WSMessageType, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type,
        sessionId,
        data,
      }));
    } else {
      console.warn('[WS] WebSocket не подключен, сообщение не отправлено');
    }
  }, [sessionId]);

  return {
    isConnected: state.isConnected,
    error: state.error,
    reconnectAttempts: state.reconnectAttempts,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
}
