/**
 * Тесты для логики филворда
 * 
 * Запуск тестов: npm test
 * 
 * Эти тесты проверяют:
 * 1. Генерацию поля
 * 2. Валидацию слов
 * 3. Определение направления
 * 4. Размещение слов
 */

import { 
  generateWordSearch, 
  validateWord, 
  calculateDirection,
  getRandomWordSubset,
  Direction,
  Coordinate 
} from '../lib/word-search';

describe('Генерация филворда', () => {
  test('должен создавать сетку 10x10', () => {
    const words = ['ТЕСТ', 'КОД'];
    const result = generateWordSearch(words);
    
    expect(result.grid).toHaveLength(10);
    result.grid.forEach(row => {
      expect(row).toHaveLength(10);
    });
  });

  test('должен размещать слова в сетке', () => {
    const words = ['ТЕСТ', 'КОД', 'ФУНКЦИЯ'];
    const result = generateWordSearch(words);
    
    // Все слова должны быть размещены (или часть из них)
    expect(result.placedWords).toBeDefined();
    expect(Array.isArray(result.placedWords)).toBe(true);
  });

  test('должен заполнять все клетки буквами', () => {
    const words = ['ТЕСТ'];
    const result = generateWordSearch(words);
    
    let emptyCells = 0;
    result.grid.forEach(row => {
      row.forEach(cell => {
        if (cell === '') emptyCells++;
      });
    });
    
    expect(emptyCells).toBe(0);
  });

  test('должен генерировать случайный набор слов', () => {
    const subset1 = getRandomWordSubset(10);
    const subset2 = getRandomWordSubset(10);
    
    expect(subset1).toHaveLength(10);
    expect(subset2).toHaveLength(10);
    
    // Наборы могут быть разными из-за случайности
    expect(Array.isArray(subset1)).toBe(true);
  });
});

describe('Валидация слов', () => {
  const testGrid = [
    ['Т', 'Е', 'С', 'Т', 'А', 'Б', 'В', 'Г', 'Д', 'Е'],
    ['К', 'О', 'Д', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х'],
    ['Ф', 'У', 'Н', 'К', 'Ц', 'И', 'Я', 'Ы', 'Ь', 'Ъ'],
    ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И'],
    ['К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У'],
    ['Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э'],
    ['Ю', 'Я', 'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж'],
    ['З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р'],
    ['С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ'],
    ['Ы', 'Ь', 'Э', 'Ю', 'Я', 'А', 'Б', 'В', 'Г', 'Д'],
  ];

  const validWords = ['ТЕСТ', 'КОД', 'ФУНКЦИЯ'];

  test('должен принимать корректное слово', () => {
    const start: Coordinate = { row: 0, col: 0 };
    const end: Coordinate = { row: 0, col: 3 };
    
    const result = validateWord(
      'ТЕСТ',
      validWords,
      testGrid,
      start,
      end,
      'horizontal'
    );
    
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('должен отвергать несуществующее слово', () => {
    const start: Coordinate = { row: 0, col: 0 };
    const end: Coordinate = { row: 0, col: 3 };
    
    const result = validateWord(
      'НЕВСЕРЬЁЗ',
      validWords,
      testGrid,
      start,
      end,
      'horizontal'
    );
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Такого слова нет в списке');
  });

  test('должен отвергать слишком короткие слова', () => {
    const start: Coordinate = { row: 0, col: 0 };
    const end: Coordinate = { row: 0, col: 1 };
    
    const result = validateWord(
      'ТЕ',
      validWords,
      testGrid,
      start,
      end,
      'horizontal'
    );
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Слово слишком короткое');
  });

  test('должен отвергать неверное направление', () => {
    const start: Coordinate = { row: 0, col: 0 };
    const end: Coordinate = { row: 0, col: 3 };
    
    // Указываем вертикальное направление для горизонтального слова
    const result = validateWord(
      'ТЕСТ',
      validWords,
      testGrid,
      start,
      end,
      'vertical'
    );
    
    expect(result.isValid).toBe(false);
    // При неверном направлении path строится неправильно → длина не совпадает
    expect(result.error).toMatch(/Неверная длина|Неверное направление|Буквы/);
  });
});

describe('Определение направления', () => {
  test('должен определять горизонтальное направление', () => {
    const start: Coordinate = { row: 0, col: 0 };
    const end: Coordinate = { row: 0, col: 5 };
    
    const direction = calculateDirection(start, end);
    
    expect(direction).toBe('horizontal');
  });

  test('должен определять вертикальное направление', () => {
    const start: Coordinate = { row: 0, col: 0 };
    const end: Coordinate = { row: 5, col: 0 };
    
    const direction = calculateDirection(start, end);
    
    expect(direction).toBe('vertical');
  });

  test('должен определять диагональ вниз', () => {
    const start: Coordinate = { row: 0, col: 0 };
    const end: Coordinate = { row: 5, col: 5 };
    
    const direction = calculateDirection(start, end);
    
    expect(direction).toBe('diagonal_down');
  });

  test('должен определять диагональ вверх', () => {
    const start: Coordinate = { row: 5, col: 0 };
    const end: Coordinate = { row: 0, col: 5 };
    
    const direction = calculateDirection(start, end);
    
    expect(direction).toBe('diagonal_up');
  });

  test('должен возвращать null для неверного направления', () => {
    const start: Coordinate = { row: 0, col: 0 };
    const end: Coordinate = { row: 2, col: 3 };
    
    const direction = calculateDirection(start, end);
    
    expect(direction).toBeNull();
  });
});

describe('Генерация поля с разными словами', () => {
  test('должен размещать длинные слова', () => {
    const words = ['ПЕРЕМЕННАЯ', 'КОМПЬЮТЕР', 'АЛГОРИТМ'];
    const result = generateWordSearch(words);
    
    // Проверим, что хотя бы одно слово разместилось
    expect(result.placedWords.length).toBeGreaterThan(0);
  });

  test('должен обрабатывать повторяющиеся буквы в словах', () => {
    const words = ['АААА', 'ББББ'];
    const result = generateWordSearch(words);
    
    expect(result.grid).toBeDefined();
  });

  test('должен игнорировать слишком короткие слова', () => {
    const words = ['А', 'ТЕ', 'ТРИ'];
    const result = generateWordSearch(words);
    
    // Короткие слова (< 3) фильтруются на входе и не попадают ни в placedWords, ни в failedWords
    expect(result.placedWords).not.toContain('А');
    expect(result.placedWords).not.toContain('ТЕ');
    expect(result.failedWords).not.toContain('А');
    expect(result.failedWords).not.toContain('ТЕ');
  });
});

describe('Граничные случаи', () => {
  test('должен обрабатывать пустой список слов', () => {
    const result = generateWordSearch([]);
    
    expect(result.grid).toHaveLength(10);
    expect(result.placedWords).toHaveLength(0);
  });

  test('должен обрабатывать одно слово', () => {
    const result = generateWordSearch(['ТЕСТ']);
    
    expect(result.grid).toBeDefined();
  });

  test('должен обрабатывать много слов', () => {
    const words = Array(50).fill(null).map((_, i) => `СЛОВО${i}`);
    const result = generateWordSearch(words);
    
    expect(result.grid).toBeDefined();
    // Не все слова могут разместиться
    expect(result.placedWords.length + result.failedWords.length).toBe(50);
  });
});
