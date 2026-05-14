/**
 * Логика бота для филворда
 * 
 * Бот имитирует поведение человека:
 * - Находит слова с заданной скоростью
 * - Может ошибаться (с небольшой вероятностью)
 * - Имеет "реакцию" на слова других игроков
 */

import { Grid, Direction, Coordinate, calculateDirection } from './word-search';

export interface BotConfig {
  /** Имя бота */
  name: string;
  /** Среднее время между нахождениями слов (в секундах) */
  averageSpeed: number;
  /** Вероятность ошибки (0-1) */
  errorRate: number;
  /** Сложность: 'easy' | 'medium' | 'hard' */
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Находит все возможные слова в сетке
 */
export function findAllWords(
  grid: Grid,
  wordList: string[]
): Array<{
  word: string;
  start: Coordinate;
  end: Coordinate;
  direction: Direction;
}> {
  const found: Array<{
    word: string;
    start: Coordinate;
    end: Coordinate;
    direction: Direction;
  }> = [];

  const directions: Direction[] = ['horizontal', 'vertical', 'diagonal_down', 'diagonal_up'];

  for (const word of wordList) {
    const upperWord = word.toUpperCase();
    
    // Ищем слово во всех направлениях
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        for (const direction of directions) {
          const end = findWordEnd(grid, upperWord, { row, col }, direction);
          if (end) {
            found.push({
              word: upperWord,
              start: { row, col },
              end,
              direction,
            });
          }
        }
      }
    }
  }

  return found;
}

/**
 * Проверяет, находится ли слово в сетке начиная с заданной позиции
 */
function findWordEnd(
  grid: Grid,
  word: string,
  start: Coordinate,
  direction: Direction
): Coordinate | null {
  let rowStep = 0;
  let colStep = 0;

  switch (direction) {
    case 'horizontal':
      colStep = 1;
      break;
    case 'vertical':
      rowStep = 1;
      break;
    case 'diagonal_down':
      rowStep = 1;
      colStep = 1;
      break;
    case 'diagonal_up':
      rowStep = -1;
      colStep = 1;
      break;
  }

  let row = start.row;
  let col = start.col;

  for (let i = 0; i < word.length; i++) {
    if (
      row < 0 || row >= grid.length ||
      col < 0 || col >= grid[0].length ||
      grid[row][col] !== word[i]
    ) {
      return null;
    }
    row += rowStep;
    col += colStep;
  }

  // Возвращаем координаты последней буквы
  return {
    row: row - rowStep,
    col: col - colStep,
  };
}

/**
 * Создаёт бота с заданной конфигурацией
 */
export function createBot(config: BotConfig): BotConfig {
  return {
    name: config.name,
    averageSpeed: config.averageSpeed,
    errorRate: config.errorRate,
    difficulty: config.difficulty,
  };
}

/**
 * Предустановленные конфигурации ботов
 */
export const BOT_PRESETS = {
  easy: createBot({
    name: 'Бот-Новичок',
    averageSpeed: 7.5, // Уменьшено в 2 раза (было 15)
    errorRate: 0.15, // Уменьшено в 2 раза (было 0.3)
    difficulty: 'easy',
  }),
  medium: createBot({
    name: 'Бот-Любитель',
    averageSpeed: 4, // Уменьшено в 2 раза (было 8)
    errorRate: 0.075, // Уменьшено в 2 раза (было 0.15)
    difficulty: 'medium',
  }),
  hard: createBot({
    name: 'Бот-Профи',
    averageSpeed: 2, // Уменьшено в 2 раза (было 4)
    errorRate: 0.025, // Уменьшено в 2 раза (было 0.05)
    difficulty: 'hard',
  }),
};

/**
 * Вычисляет задержку перед следующим ходом бота
 * Использует нормальное распределение для реалистичности
 */
export function calculateBotDelay(averageSpeed: number): number {
  // Добавляем случайность ±30%
  const variance = averageSpeed * 0.3;
  const delay = averageSpeed + (Math.random() * variance * 2 - variance);
  return Math.max(1, delay) * 1000; // в миллисекундах
}

/**
 * Определяет, сделает ли бот ошибку
 */
export function willBotMakeMistake(errorRate: number): boolean {
  return Math.random() < errorRate;
}
