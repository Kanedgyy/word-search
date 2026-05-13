/**
 * Утилиты для работы с игровым полем
 */

import type { Coordinate, Direction } from '../types';

export const GRID_SIZE = 10;

/**
 * Генерирует случайную букву из русского алфавита
 * @returns Случайная заглавная буква
 */
export function getRandomLetter(): string {
  const letters = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  return letters[Math.floor(Math.random() * letters.length)];
}

/**
 * Определяет направление между двумя точками
 * @param startRow Начальная строка
 * @param startCol Начальная колонка
 * @param endRow Конечная строка
 * @param endCol Конечная колонка
 * @returns Направление или null если не прямая линия
 */
export function getDirection(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): Direction | null {
  const dr = endRow - startRow;
  const dc = endCol - startCol;
  
  if (dr === 0 && dc !== 0) return 'horizontal';
  if (dc === 0 && dr !== 0) return 'vertical';
  if (Math.abs(dr) === Math.abs(dc) && dr !== 0) {
    return dr > 0 ? 'diagonal_down' : 'diagonal_up';
  }
  return null;
}

/**
 * Генерирует полный путь между двумя точками
 * @param startRow Начальная строка
 * @param startCol Начальная колонка
 * @param endRow Конечная строка
 * @param endCol Конечная колонка
 * @returns Массив координат от start до end
 */
export function generatePath(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): Coordinate[] {
  const path: Coordinate[] = [];
  
  const dr = endRow - startRow;
  const dc = endCol - startCol;
  
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  
  const rowStep = steps === 0 ? 0 : dr / steps;
  const colStep = steps === 0 ? 0 : dc / steps;
  
  for (let i = 0; i <= steps; i++) {
    path.push({
      row: startRow + Math.round(i * rowStep),
      col: startCol + Math.round(i * colStep),
    });
  }
  
  return path;
}

/**
 * Извлекает слово из поля по координатам
 * @param grid Двумерный массив букв
 * @param startRow Начальная строка
 * @param startCol Начальная колонка
 * @param endRow Конечная строка
 * @param endCol Конечная колонка
 * @returns Слово извлечённое из поля
 */
export function extractWordFromGrid(
  grid: string[][],
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): string {
  let word = '';
  let r = startRow;
  let c = startCol;
  
  const dr = endRow - startRow;
  const dc = endCol - startCol;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  
  const rowStep = steps === 0 ? 0 : dr / steps;
  const colStep = steps === 0 ? 0 : dc / steps;
  
  for (let i = 0; i <= steps; i++) {
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
      return ''; // Вне границ
    }
    word += grid[r][c];
    
    if (r === endRow && c === endCol) break;
    
    r += rowStep;
    c += colStep;
    
    // Защита от бесконечного цикла
    if (word.length > GRID_SIZE * GRID_SIZE) break;
  }
  
  return word;
}

/**
 * Проверяет координаты на выход за границы поля
 * @param row Строка
 * @param col Колонка
 * @returns true если координаты в пределах поля
 */
export function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
}
