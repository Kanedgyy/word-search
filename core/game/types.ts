/**
 * Типы для игрового модуля
 */

export type GameStatus = 'waiting' | 'in_progress' | 'finished';
export type GameMode = 'individual' | 'team';
export type Direction = 'horizontal' | 'vertical' | 'diagonal_down' | 'diagonal_up';
export type TeamId = 'red' | 'blue' | 'green' | 'yellow';

export interface Coordinate {
  readonly row: number;
  readonly col: number;
}

export interface Player {
  readonly id: string;
  readonly name: string;
  readonly isBot: boolean;
  readonly color: string;
  readonly wordsFound: number;
  readonly firstWordTime: number | null;
  readonly team: TeamId | null;
  readonly difficulty?: 'easy' | 'medium' | 'hard';
  readonly turnOrder: number;
  readonly status: 'joined' | 'left';
  readonly userId: string | null;
}

export interface GameSession {
  readonly id: string;
  readonly grid: string[][];
  readonly wordList: string[];
  readonly status: GameStatus;
  readonly gameMode: GameMode;
  readonly onTimeLimit: boolean;
  readonly maxPlayers: number;
  readonly duration: number;
  readonly createdAt: Date;
  readonly endsAt: Date | null;
  readonly rematchSessionId: string | null;
  readonly hostUserId: string | null;
}

export interface FoundWord {
  readonly id: string;
  readonly sessionId: string;
  readonly word: string;
  readonly playerId: string;
  readonly startRow: number;
  readonly startCol: number;
  readonly endRow: number;
  readonly endCol: number;
  readonly direction: Direction;
  readonly path: Coordinate[];
  readonly foundAt: Date;
}

export interface CreateSessionInput {
  readonly maxPlayers: number;
  readonly duration: number;
  readonly gameMode: GameMode;
  readonly onTimeLimit: boolean;
  readonly hostUserId?: string | null;
}

export interface JoinSessionInput {
  readonly sessionId: string;
  readonly playerName: string;
  readonly userId?: string | null;
}

export interface SubmitWordInput {
  readonly sessionId: string;
  readonly playerId: string;
  readonly word: string;
  readonly startRow: number;
  readonly startCol: number;
  readonly endRow: number;
  readonly endCol: number;
  readonly direction: Direction;
  readonly path?: Coordinate[];
}
