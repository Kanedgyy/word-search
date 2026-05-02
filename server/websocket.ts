/**
 * WebSocket сервер для real-time синхронизации игры
 * 
 * Используется для:
 * - Мгновенной рассылки найденных слов всем игрокам
 * - Уведомлений о начале/окончании игры
 * - Обновления счёта в реальном времени
 * 
 * В production лучше использовать Socket.io или отдельный WS сервер.
 * Здесь упрощённая реализация для демонстрации.
 */

import { WebSocketServer, WebSocket } from 'ws';

// Типы сообщений
export type WSMessageType = 
  | 'word_found' 
  | 'game_started' 
  | 'game_ended' 
  | 'player_joined' 
  | 'player_left'
  | 'bot_found_word';

export interface WSMessage {
  type: WSMessageType;
  sessionId: string;
  data: any;
}

// Хранилище подключений по сессиям
const sessionConnections = new Map<string, Set<WebSocket>>();

/**
 * Инициализирует WebSocket сервер
 */
export function initWebSocketServer(port: number = 3001): WebSocketServer {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Новое WebSocket подключение');
    
    let currentSessionId: string | null = null;

    ws.on('message', (message: string) => {
      try {
        const msg: WSMessage = JSON.parse(message.toString());
        
        switch (msg.type) {
          case 'player_joined':
            currentSessionId = msg.sessionId;
            if (!sessionConnections.has(msg.sessionId)) {
              sessionConnections.set(msg.sessionId, new Set());
            }
            sessionConnections.get(msg.sessionId)!.add(ws);
            
            // Уведомляем других игроков
            broadcastToSession(msg.sessionId, {
              type: 'player_joined',
              sessionId: msg.sessionId,
              data: msg.data,
            }, ws);
            break;
            
          default:
            // Рассылаем сообщение всем в сессии
            if (msg.sessionId) {
              broadcastToSession(msg.sessionId, msg, ws);
            }
        }
      } catch (err) {
        console.error('Ошибка обработки WS сообщения:', err);
      }
    });

    ws.on('close', () => {
      if (currentSessionId) {
        const connections = sessionConnections.get(currentSessionId);
        if (connections) {
          connections.delete(ws);
          if (connections.size === 0) {
            sessionConnections.delete(currentSessionId);
          }
        }
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket ошибка:', err);
    });
  });

  console.log(`WebSocket сервер запущен на порту ${port}`);
  return wss;
}

/**
 * Рассылает сообщение всем подключениям в сессии
 */
export function broadcastToSession(
  sessionId: string, 
  message: WSMessage, 
  exclude?: WebSocket
): void {
  const connections = sessionConnections.get(sessionId);
  if (!connections) return;

  const messageStr = JSON.stringify(message);
  
  connections.forEach((ws) => {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

/**
 * Отправляет сообщение конкретному подключению
 */
export function sendToClient(ws: WebSocket, message: WSMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}
