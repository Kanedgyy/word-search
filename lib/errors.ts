/**
 * Кастомный класс ошибок приложения
 * Используется для типизированной обработки ошибок
 */

export type AppErrorCode = 
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'GAME_NOT_STARTED'
  | 'GAME_FINISHED'
  | 'INVALID_SELECTION'
  | 'WORD_ALREADY_FOUND'
  | 'SESSION_NOT_FOUND';

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

/**
 * Типизированная функция для обработки ошибок
 */
export function handleError(error: unknown): { success: false; error: AppError } {
  if (error instanceof AppError) {
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
