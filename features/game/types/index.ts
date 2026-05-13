/**
 * Типы для игрового модуля
 */

export type GameStatus = 'waiting' | 'in_progress' | 'finished';
export type GameMode = 'individual' | 'team';
export type Direction = 'horizontal' | 'vertical' | 'diagonal_down' | 'diagonal_up';
export type Difficulty = 'easy' | 'medium' | 'hard';
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
  readonly difficulty?: Difficulty;
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
}

export interface FoundWord {
  readonly id: string;
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

export interface Team {
  readonly id: TeamId;
  readonly name: string;
  readonly totalWords: number;
  readonly players: string[];
}

export interface WordSubmitInput {
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

/**
 * Exhaustive check для всех состояний игры
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

export function getGameStatusText(status: GameStatus): string {
  switch (status) {
    case 'waiting':
      return 'Ожидание начала игры';
    case 'in_progress':
      return 'Игра идёт';
    case 'finished':
      return 'Игра завершена';
    default:
      return assertNever(status);
  }
}
