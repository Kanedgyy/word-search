/**
 * Кастомные ошибки для игрового модуля
 */

export class AppError extends Error {
  constructor(
    public code: AppErrorCode,
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export type AppErrorCode = 
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'GAME_NOT_STARTED'
  | 'GAME_FINISHED'
  | 'INVALID_SELECTION'
  | 'WORD_ALREADY_FOUND'
  | 'SESSION_NOT_FOUND'
  | 'PLAYER_NOT_FOUND'
  | 'NOT_HOST'
  | 'MAX_PLAYERS_REACHED'
  | 'GAME_ALREADY_STARTED';

/**
 * Type guard для AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError && 'code' in error;
}

/**
 * Типизированная функция для обработки ошибок
 */
export function handleError(error: unknown): { success: false; error: AppError } {
  if (isAppError(error)) {
    return { success: false, error };
  }
  
  if (error instanceof Error) {
    return { 
      success: false, 
      error: new AppError('VALIDATION_ERROR', error.message, error) 
    };
  }
  
  return {
    success: false,
    error: new AppError('VALIDATION_ERROR', 'Неизвестная ошибка'),
  };
}
