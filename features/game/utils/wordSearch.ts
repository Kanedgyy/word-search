/**
 * Генерация поля для игры Word Search
 */

import { GRID_SIZE, getRandomLetter } from './grid';
import type { Coordinate } from '../types';

export interface WordPlacement {
  word: string;
  path: Coordinate[];
}

/**
 * Основные слова для игры
 */
const BASE_WORD_LIST = [
  'ПРОГРАММА', 'АЛГОРИТМ', 'ФУНКЦИЯ', 'ПЕРЕМЕННАЯ', 'МАССИВ',
  'ОБЪЕКТ', 'КЛАСС', 'НАСЛЕДОВАНИЕ', 'ПОЛИМОРФИЗМ', 'ИНКАПСУЛЯЦИЯ',
  'БАЗА', 'ДАННЫХ', 'ЗАПРОС', 'СЕРВЕР', 'КЛИЕНТ',
  'ИНТЕРФЕЙС', 'КОМПОНЕНТ', 'МОДУЛЬ', 'БИБЛИОТЕКА', 'ФРЕЙМВОРК',
  'СЕКВЕНЦИЯ', 'ПАРАЛЛЕЛЬНЫЙ', 'АСИНХРОННЫЙ', 'ОШИБКА', 'ТЕСТИРОВАНИЕ',
  'ВЕСНА', 'ВЕЧЕР', 'ГРУЗОВИК', 'ДВЕРЬ', 'ДЕНЬ',
  'ДИЗАЙНЕР', 'ЖЁЛТЫЙ', 'ЖУРНАЛИСТ', 'ЗАВТРА', 'ОРАНЖЕВЫЙ',
  'ПЛАВАНИЕ', 'СИЛА', 'КНИГА', 'ШКОЛА', 'УЧИТЕЛЬ',
  'СТУДЕНТ', 'ЗАДАЧА', 'РЕШЕНИЕ', 'Код', 'ПРИЛОЖЕНИЕ'
];

/**
 * Выбирает случайные слова из списка
 * @param count Количество слов для выбора
 * @returns Массив случайных слов
 */
export function getRandomWordSubset(count: number): string[] {
  const shuffled = [...BASE_WORD_LIST]
    .map(word => word.toUpperCase().replace(/[^А-ЯЁ]/g, ''))
    .filter(word => word.length >= 3)
    .sort(() => Math.random() - 0.5);
  
  return shuffled.slice(0, count);
}

/**
 * Проверяет, можно ли разместить слово на поле
 * @param grid Текущее поле
 * @param word Слово для размещения
 * @param startRow Начальная строка
 * @param startCol Начальная колонка
 * @param dr Изменение строки
 * @param dc Изменение колонки
 * @returns true если слово можно разместить
 */
function canPlaceWord(
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  dr: number,
  dc: number
): boolean {
  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * dr;
    const col = startCol + i * dc;
    
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
      return false;
    }
    
    const cell = grid[row][col];
    if (cell !== '' && cell !== word[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Размещает слово на поле
 * @param grid Поле для размещения
 * @param word Слово для размещения
 * @param startRow Начальная строка
 * @param startCol Начальная колонка
 * @param dr Изменение строки
 * @param dc Изменение колонки
 * @returns Путь размещённого слова или null
 */
function placeWord(
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  dr: number,
  dc: number
): Coordinate[] | null {
  if (!canPlaceWord(grid, word, startRow, startCol, dr, dc)) {
    return null;
  }
  
  const path: Coordinate[] = [];
  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * dr;
    const col = startCol + i * dc;
    grid[row][col] = word[i];
    path.push({ row, col });
  }
  
  return path;
}

/**
 * Генерирует поле для игры Word Search
 * @param wordList Список слов для размещения
 * @returns Объект с полем и размещёнными словами
 */
export function generateWordSearch(wordList: string[]): { 
  grid: string[][]; 
  placedWords: string[];
} {
  // Инициализируем пустое поле
  const grid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
  const placedWords: string[] = [];
  
  // Направления размещения: горизонтальное, вертикальное, диагональное
  const directions = [
    { dr: 0, dc: 1 },   // горизонтально
    { dr: 1, dc: 0 },   // вертикально
    { dr: 1, dc: 1 },   // диагональ вниз
    { dr: -1, dc: 1 },  // диагональ вверх
  ];
  
  // Пытаемся разместить каждое слово
  for (const word of wordList) {
    const upperWord = word.toUpperCase();
    let placed = false;
    
    // Перемешиваем направления для случайности
    const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);
    
    // Пробуем 100 раз разместить слово
    for (let attempt = 0; attempt < 100 && !placed; attempt++) {
      const startRow = Math.floor(Math.random() * GRID_SIZE);
      const startCol = Math.floor(Math.random() * GRID_SIZE);
      
      for (const { dr, dc } of shuffledDirections) {
        const path = placeWord(grid, upperWord, startRow, startCol, dr, dc);
        if (path) {
          placedWords.push(upperWord);
          placed = true;
          break;
        }
      }
    }
  }
  
  // Заполняем пустые клетки случайными буквами
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === '') {
        grid[row][col] = getRandomLetter();
      }
    }
  }
  
  return { grid, placedWords };
}
