/**
 * Логика генерации классического филворда
 * 
 * Филворд — слова размещаются змейкой (с изгибами под 90°),
 * не пересекаются, поле 10×10 полностью заполнено.
 */

export type Direction = 'horizontal' | 'vertical' | 'diagonal_down' | 'diagonal_up';
export type Coordinate = { row: number; col: number };
export type Grid = string[][];

const GRID_SIZE = 10;
const ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';

const COMMON_WORDS = [
  // IT и программирование
  'ТЕЛЕФОН', 'КОМПЬЮТЕР', 'ПРОГРАММА', 'АЛГОРИТМ', 'ФУНКЦИЯ',
  'ПЕРЕМЕННАЯ', 'МАССИВ', 'ОБЪЕКТ', 'КЛАСС', 'МЕТОД',
  'СЕРВЕР', 'КЛИЕНТ', 'АПИ', 'ИНТЕРФЕЙС',
  'КОДИНГ', 'РЕФАКТОР', 'ДЕБУГ', 'ТЕСТ', 'СКРИПТ',
  'ФРЕЙМВОРК', 'БИБЛИОТЕКА', 'МОДУЛЬ', 'ПЛАГИН',
  'ОШИБКА', 'ЛОГ', 'КОНСОЛЬ', 'ВАРИАНТ', 'СИНТАКСИС',
  'ИНДЕКС', 'ЦИКЛ', 'УСЛОВИЕ', 'ВЫЗОВ', 'ВЕРНУТЬ',
  'СТРОКА', 'ЧИСЛО', 'БУЛЕВ', 'МАТРИЦА', 'ВЕКТОР',
  'МОДЕЛЬ', 'ВИД', 'КОНТРОЛЛЕР', 'РОУТЕР', 'ЗАПРОС',
  'ОТВЕТ', 'ФАЙЛ', 'ПАПКА', 'ПУТЬ', 'СИСТЕМА',
  'КЭШ', 'БАГ', 'ФИЧА', 'РЕЛИЗ', 'ДЕПЛОЙ',
  'МЕРДЖ', 'БРАНЧ', 'КОММИТ', 'ПУЛЛ', 'ПУШ',
  
  // Природа и животные
  'СОЛНЦЕ', 'ЛУНА', 'ЗВЕЗДА', 'НЕБО', 'ОБЛАКО',
  'ДОЖДЬ', 'СНЕГ', 'ВЕТЕР', 'ГРОЗА', 'РАДУГА',
  'ЛЕС', 'ДЕРЕВО', 'ЦВЕТОК', 'ТРАВА', 'РЕКА',
  'ОЗЕРО', 'МОРЕ', 'ОКЕАН', 'ГОРА', 'ХОЛМ',
  'КОШКА', 'СОБАКА', 'ЛОШАДЬ', 'ВОЛК', 'ЛИСА',
  'МЕДВЕДЬ', 'ЗАЯЦ', 'БЕЛКА', 'ПТИЦА', 'ОРЁЛ',
  'РЫБА', 'АКУЛА', 'КИТ', 'ДЕЛЬФИН', 'ПАУК',
  'ЗМЕЯ', 'ЛЯГУШКА', 'БАБОЧКА', 'ПЧЕЛА', 'МУРАВЕЙ',
  
  // Еда
  'ХЛЕБ', 'МОЛОКО', 'СЫР', 'ЯЙЦО', 'МАСЛО',
  'МЯСО', 'КУРИЦА', 'СУП', 'БОРЩ',
  'КАША', 'ПИЦЦА', 'СУШИ', 'ПИРОГ', 'ТОРТ',
  'МОРОЖЕНОЕ', 'ШОКОЛАД', 'КОНФЕТА', 'ПЕЧЕНЬЕ', 'ВАФЛЯ',
  'ЯБЛОКО', 'БАНАН', 'АПЕЛЬСИН', 'ВИНОГРАД', 'КЛУБНИКА',
  'КАРТОШКА', 'МОРКОВЬ', 'ЛУК', 'ЧЕСНОК', 'ПОМИДОР',
  'ОГУРЕЦ', 'КАПУСТА', 'СВЁКЛА', 'ГРИБ', 'ОРЕХ',
  
  // Транспорт
  'МАШИНА', 'АВТОБУС', 'ТРАМВАЙ', 'ПОЕЗД', 'САМОЛЁТ',
  'ВЕРТОЛЁТ', 'КОРАБЛЬ', 'ЛОДКА', 'ВЕЛОСИПЕД', 'МОТОЦИКЛ',
  'ГРУЗОВИК', 'ТАКСИ', 'ТРОЛЛЕЙБУС', 'МЕТРО', 'МОПЕД',
  
  // Дом и быт
  'ДОМ', 'КВАРТИРА', 'КОМНАТА', 'КУХНЯ', 'СПАЛЬНЯ',
  'ВАННАЯ', 'ГОСТИНАЯ', 'БАЛКОН', 'ДВЕРЬ', 'ОКНО',
  'СТОЛ', 'СТУЛ', 'КРОВАТЬ', 'ДИВАН', 'ШКАФ',
  'ЗЕРКАЛО', 'ЛАМПА', 'ТЕЛЕВИЗОР', 'МИКРОВОЛН', 'ПЛИТА',
  'ЧАЙНИК', 'ТАРЕЛКА', 'ВИЛКА', 'ЛОЖКА', 'НОЖ',
  'ФУТБОЛ', 'БАСКЕТБОЛ', 'ВОЛЕЙБОЛ', 'ТЕННИС', 'ХОККЕЙ',
  'БОКС', 'ДЗЮДО', 'БОРЬБА', 'ГИМНАСТИКА', 'АТЛЕТИКА',
  'ПЛАВАНИЕ', 'БЕГ', 'ПРЫЖОК', 'МЯЧ', 'РАКЕТКА',
  'ШАЙБА', 'КОНЬКИ', 'ЛЫЖИ', 'СНОУБОРД', 'СКЕЙТ',
  'ВРАЧ', 'УЧИТЕЛЬ', 'ИНЖЕНЕР', 'КОДЕР', 'ДИЗАЙНЕР',
  'ПОВАР', 'СТРОИТЕЛЬ', 'ВОДИТЕЛЬ', 'ПИЛОТ', 'КОСМОНАВТ',
  'ХУДОЖНИК', 'МУЗЫКАНТ', 'АКТЁР', 'ПИСАТЕЛЬ', 'ЖУРНАЛИСТ',
  'КАПИТАН', 'ПОЖАРНЫЙ', 'ВОЕННЫЙ', 'СЕЛЬ', 'ФЕРМЕР',
  
  // Города и страны
  'МОСКВА', 'ПИТЕР', 'ОМСК', 'МИНСК', 'АЛМАТЫ',
  'РОССИЯ', 'АФРИКА', 'БЕЛАРУСЬ', 'КАЗАХСТАН', 'ПОЛЬША',
  'ГЕРМАНИЯ', 'ФРАНЦИЯ', 'ИТАЛИЯ', 'ИСПАНИЯ', 'АНГЛИЯ',
  'КИТАЙ', 'ЯПОНИЯ', 'ИНДИЯ', 'БРАЗИЛИЯ', 'КАНАДА',
  
  // Цвета и эмоции
  'КРАСНЫЙ', 'СИНИЙ', 'ЗЕЛЁНЫЙ', 'ЖЁЛТЫЙ', 'БЕЛЫЙ',
  'ЧЁРНЫЙ', 'ОРАНЖЕВЫЙ', 'ФИОЛЕТОВЫЙ', 'РОЗОВЫЙ', 'КОРИЧНЕВЫЙ',
  'РАДОСТЬ', 'СЧАСТЬЕ', 'ЛЮБОВЬ', 'ДРУЖБА', 'МЕЧТА',
  'НАДЕЖДА', 'ВЕРА', 'СМЕЛОСТЬ', 'СИЛА', 'МУДРОСТЬ',
  
  // Время
  'ЧАС', 'МИНУТА', 'СЕКУНДА', 'ДЕНЬ', 'НОЧЬ',
  'УТРО', 'ВЕЧЕР', 'НЕДЕЛЯ', 'МЕСЯЦ', 'ГОД',
  'ЗИМА', 'ВЕСНА', 'ЛЕТО', 'ОСЕНЬ', 'ВРЕМЯ',
  'ВЧЕРА', 'СЕГОДНЯ', 'ЗАВТРА', 'СУББОТА', 'ВЫХОДНОЙ',
];

type SegmentDir = 'right' | 'left' | 'down' | 'up';

const DIR_STEPS: Record<SegmentDir, { r: number; c: number }> = {
  right: { r: 0, c: 1 },
  left:  { r: 0, c: -1 },
  down:  { r: 1, c: 0 },
  up:    { r: -1, c: 0 },
};

const TURNS: Record<SegmentDir, SegmentDir[]> = {
  right: ['down', 'up'],
  left:  ['down', 'up'],
  down:  ['right', 'left'],
  up:    ['right', 'left'],
};

function randInt(n: number) { return Math.floor(Math.random() * n); }
function randLetter() { return ALPHABET[randInt(ALPHABET.length)]; }

function inBounds(r: number, c: number) {
  return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;
}

function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''));
}

/**
 * Пробует разместить слово змейкой (максимум 1 поворот под 90°)
 */
function tryPlaceSnake(
  grid: Grid,
  word: string
): Coordinate[] | null {
  const maxAttempts = 500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const startR = randInt(GRID_SIZE);
    const startC = randInt(GRID_SIZE);
    const dir1 = (Object.keys(DIR_STEPS) as SegmentDir[])[randInt(4)];

    // Проверяем первую клетку
    if (grid[startR][startC] !== '' && grid[startR][startC] !== word[0]) continue;

    const minSeg1 = 2;
    const maxSeg1 = word.length > 3 ? word.length - 1 : word.length;
    const seg1Len = word.length > 3
      ? minSeg1 + randInt(maxSeg1 - minSeg1 + 1)
      : word.length;
    const seg2Len = word.length - seg1Len;

    const path: Coordinate[] = [{ row: startR, col: startC }];
    let r = startR, c = startC;
    let ok = true;

    // Первый сегмент
    const s1 = DIR_STEPS[dir1];
    for (let i = 1; i < seg1Len; i++) {
      r += s1.r; c += s1.c;
      if (!inBounds(r, c)) { ok = false; break; }
      // Разрешаем пересечение только с одинаковой буквой
      if (grid[r][c] !== '' && grid[r][c] !== word[i]) { ok = false; break; }
      path.push({ row: r, col: c });
    }
    if (!ok) continue;

    // Второй сегмент (если есть)
    if (seg2Len > 0) {
      const possibleTurns = TURNS[dir1];
      const dir2 = possibleTurns[randInt(possibleTurns.length)];
      const s2 = DIR_STEPS[dir2];
      for (let i = 0; i < seg2Len; i++) {
        r += s2.r; c += s2.c;
        if (!inBounds(r, c)) { ok = false; break; }
        const idx = seg1Len + i;
        if (grid[r][c] !== '' && grid[r][c] !== word[idx]) { ok = false; break; }
        path.push({ row: r, col: c });
      }
      if (!ok) continue;
    }

    // Успех — размещаем
    for (let i = 0; i < word.length; i++) {
      const p = path[i];
      grid[p.row][p.col] = word[i];
    }
    return path;
  }

  return null;
}

/**
 * Генерирует классический филворд
 */
export function generateWordSearch(words: string[]): {
  grid: Grid;
  placedWords: string[];
  failedWords: string[];
  wordPaths: Map<string, Coordinate[]>;
} {
  const grid = createEmptyGrid();
  const placedWords: string[] = [];
  const failedWords: string[] = [];
  const wordPaths = new Map<string, Coordinate[]>();

  const sorted = [...words]
    .map(w => w.toUpperCase().replace(/[^А-ЯЁ]/g, ''))
    .filter(w => w.length >= 3)
    .sort((a, b) => b.length - a.length);

  for (const word of sorted) {
    const path = tryPlaceSnake(grid, word);
    if (path) {
      placedWords.push(word);
      wordPaths.set(word, path);
    } else {
      failedWords.push(word);
    }
  }

  // Заполняем оставшиеся клетки случайными буквами
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === '') grid[r][c] = randLetter();
    }
  }

  return { grid, placedWords, failedWords, wordPaths };
}

/**
 * Проверяет слово по пути координат
 */
export function validateWordByPath(
  word: string,
  validWords: string[],
  grid: Grid,
  path: Coordinate[]
): { isValid: boolean; error?: string } {
  const upperWord = word.toUpperCase().replace(/[^А-ЯЁ]/g, '');

  if (upperWord.length < 3) {
    return { isValid: false, error: 'Слово слишком короткое' };
  }

  if (!validWords.includes(upperWord)) {
    return { isValid: false, error: 'Такого слова нет в списке' };
  }

  if (path.length !== upperWord.length) {
    return { isValid: false, error: 'Неверная длина выделения' };
  }

  // Собираем буквы с поля
  const letters: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const { row, col } = path[i];
    if (!inBounds(row, col)) {
      return { isValid: false, error: 'Координаты вне поля' };
    }
    letters.push(grid[row][col]);

    // Проверяем, что соседние клетки по стороне (не по диагонали)
    if (i > 0) {
      const dr = Math.abs(row - path[i - 1].row);
      const dc = Math.abs(col - path[i - 1].col);
      if (dr + dc !== 1) {
        return { isValid: false, error: 'Неверный путь (разрыв или диагональ)' };
      }
    }
  }

  const gridWord = letters.join('');
  if (gridWord !== upperWord) {
    return { isValid: false, error: 'Буквы на поле не совпадают со словом' };
  }

  return { isValid: true };
}

/**
 * Получает случайный набор слов
 */
export function getRandomWordSubset(count: number = 12): string[] {
  const shuffled = [...COMMON_WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Обратная совместимость — старые функции
export function validateWord(
  word: string,
  validWords: string[],
  grid: Grid,
  start: Coordinate,
  end: Coordinate,
  direction: Direction
): { isValid: boolean; error?: string } {
  // Для прямых слов строим path и используем новую валидацию
  const path: Coordinate[] = [];
  const { row: sr, col: sc } = start;
  const { row: er, col: ec } = end;

  let rStep = 0, cStep = 0;
  if (direction === 'horizontal') cStep = sc <= ec ? 1 : -1;
  else if (direction === 'vertical') rStep = sr <= er ? 1 : -1;
  else if (direction === 'diagonal_down') { rStep = sr <= er ? 1 : -1; cStep = sc <= ec ? 1 : -1; }
  else if (direction === 'diagonal_up') { rStep = sr >= er ? 1 : -1; cStep = sc <= ec ? 1 : -1; }

  let r = sr, c = sc;
  while (true) {
    path.push({ row: r, col: c });
    if (r === er && c === ec) break;
    r += rStep; c += cStep;
    if (path.length > 20) break;
  }

  return validateWordByPath(word, validWords, grid, path);
}

export function calculateDirection(start: Coordinate, end: Coordinate): Direction | null {
  const dr = end.row - start.row;
  const dc = end.col - start.col;
  if (dr === 0 && dc !== 0) return 'horizontal';
  if (dc === 0 && dr !== 0) return 'vertical';
  if (Math.abs(dr) === Math.abs(dc) && dr !== 0) return dr > 0 ? 'diagonal_down' : 'diagonal_up';
  return null;
}

export function directionToText(direction: Direction): string {
  const map: Record<Direction, string> = {
    horizontal: 'горизонтально',
    vertical: 'вертикально',
    diagonal_down: 'по диагонали вниз',
    diagonal_up: 'по диагонали вверх',
  };
  return map[direction];
}

/**
 * Извлекает слово из поля по координатам
 */
export function extractWordFromGrid(
  grid: Grid,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): string {
  const rowStep = Math.sign(endRow - startRow);
  const colStep = Math.sign(endCol - startCol);
  
  let word = '';
  let r = startRow;
  let c = startCol;
  
  while (true) {
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
 * Определяет направление по координатам
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
 * Усиленная валидация слова с проверкой всех параметров
 */
export function validateWordWithCoordinates(
  word: string,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  direction: Direction,
  validWords: string[],
  grid: Grid
): { isValid: boolean; error?: string } {
  const upperWord = word.toUpperCase().replace(/[^А-ЯЁ]/g, '');
  
  // 1. Проверка длины
  if (upperWord.length < 3) {
    return { isValid: false, error: 'Слово слишком короткое (минимум 3 буквы)' };
  }
  
  // 2. Проверка границ
  if (startRow < 0 || startRow >= GRID_SIZE || startCol < 0 || startCol >= GRID_SIZE ||
      endRow < 0 || endRow >= GRID_SIZE || endCol < 0 || endCol >= GRID_SIZE) {
    return { isValid: false, error: 'Координаты вне поля' };
  }
  
  // 3. Проверка направления
  const calculatedDirection = getDirection(startRow, startCol, endRow, endCol);
  if (calculatedDirection !== direction) {
    return { 
      isValid: false, 
      error: `Неверное направление. Вы выбрали ${directionToText(direction)}, но выделено ${directionToText(calculatedDirection) || 'неправильно'}` 
    };
  }
  
  // 4. Проверка что слово на этих координатах
  const extractedWord = extractWordFromGrid(grid, startRow, startCol, endRow, endCol);
  if (extractedWord !== upperWord) {
    return { isValid: false, error: 'Буквы на поле не совпадают со словом' };
  }
  
  // 5. Проверка что слово есть в словаре
  if (!validWords.includes(upperWord)) {
    return { isValid: false, error: 'Такого слова нет в списке' };
  }
  
  return { isValid: true };
}
