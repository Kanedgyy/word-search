/**
 * Интерфейс репозитория для работы с игровыми сессиями
 */

import type { GameSession, Player, FoundWord } from './types';

export interface GameRepository {
  // CRUD для сессий
  createSession(session: Omit<GameSession, 'id' | 'createdAt'>): Promise<GameSession>;
  getSession(sessionId: string): Promise<GameSession | null>;
  updateSession(sessionId: string, updates: Partial<GameSession>): Promise<GameSession | null>;
  deleteSession(sessionId: string): Promise<boolean>;
  
  // Игроки
  addPlayer(sessionId: string, player: Omit<Player, 'id'>): Promise<Player>;
  getPlayer(playerId: string): Promise<Player | null>;
  getPlayersBySession(sessionId: string): Promise<Player[]>;
  updatePlayer(playerId: string, updates: Partial<Player>): Promise<Player | null>;
  
  // Найденные слова
  addFoundWord(word: Omit<FoundWord, 'id' | 'foundAt'>): Promise<FoundWord>;
  getFoundWordsBySession(sessionId: string): Promise<FoundWord[]>;
  wordExists(sessionId: string, word: string): Promise<boolean>;
  
  // Статистика
  recordMatchHistory(data: {
    sessionId: string;
    userId: string | null;
    playerName: string;
    wordsFound: number;
    firstWordTime: number | null;
    rank: number;
  }): Promise<void>;
}
