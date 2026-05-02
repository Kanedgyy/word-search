/**
 * Реализация игрового бота
 * 
 * Бот автоматически находит слова на поле с заданной скоростью
 * Имитирует поведение человека
 */

import { db } from '../lib/db';
import { gameSessions, gamePlayers, foundWords } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

// Типы
interface Coordinate {
  row: number;
  col: number;
}

interface WordPosition {
  word: string;
  path: Coordinate[];
}

interface GameBotConfig {
  sessionId: string;
  playerId: string;
  minDelay: number;      // Минимальная задержка между попытками (мс)
  maxDelay: number;      // Максимальная задержка между попытками (мс)
  accuracy: number;      // Вероятность правильного поиска (0-1)
  knownWordsRatio: number; // Какую часть слов бот видит на поле (0-1)
  skipChance: number;    // Вероятность "зависнуть" и пропустить ход (0-1)
}

/**
 * Перемешивает массив (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Реестр ботов — хранит настройки до запуска игры
 */
export const botRegistry = new Map<string, { difficulty: 'easy' | 'medium' | 'hard' }>();

/**
 * ИИ-бот для игры в филворд
 */
export class GameBot {
  private sessionId: string;
  private playerId: string;
  private minDelay: number;
  private maxDelay: number;
  private accuracy: number;
  private knownWordsRatio: number;
  private skipChance: number;
  private isActive: boolean = false;
  
  constructor(config: GameBotConfig) {
    this.sessionId = config.sessionId;
    this.playerId = config.playerId;
    this.minDelay = config.minDelay;
    this.maxDelay = config.maxDelay;
    this.accuracy = config.accuracy;
    this.knownWordsRatio = config.knownWordsRatio;
    this.skipChance = config.skipChance;
  }

  /**
   * Запускает поиск слов
   */
  async startFindingWords() {
    console.log(`Бот ${this.playerId} начинает поиск слов`);
    this.isActive = true;

    try {
      // Случайная начальная задержка, чтобы боты не стартовали синхронно
      await this.sleep(Math.floor(Math.random() * 2000));

      // Получаем состояние игры
      const session = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, this.sessionId),
      });

      if (!session) {
        console.error('Сессия не найдена');
        return;
      }

      if (session.status !== 'in_progress') {
        console.log('Игра ещё не началась или закончилась');
        return;
      }

      // Находим все слова на поле — ВСЕ боты знают все слова
      const allWordsOnGrid = this.findWordsOnGrid(session.grid, session.wordList);
      const knownWords = shuffleArray(allWordsOnGrid);
      console.log(`Бот ${this.playerId}: знает все ${knownWords.length} слов, ищет в случайном порядке`);

      // Бесконечный цикл: бот играет, пока игра не закончится
      while (this.isActive) {
        // Проверяем статус игры
        const currentSession = await db.query.gameSessions.findFirst({
          where: eq(gameSessions.id, this.sessionId),
        });
        if (!currentSession || currentSession.status === 'finished') {
          console.log(`Бот ${this.playerId}: игра закончилась, останавливаюсь`);
          break;
        }

        // Собираем слова, которые ещё не найдены (из тех что бот знает)
        const remainingWords: WordPosition[] = [];
        for (const wordData of knownWords) {
          const alreadyFound = await db.query.foundWords.findFirst({
            where: and(
              eq(foundWords.sessionId, this.sessionId),
              eq(foundWords.word, wordData.word)
            ),
          });
          if (!alreadyFound) {
            remainingWords.push(wordData);
          }
        }

        // Если все слова найдены — выходим
        if (remainingWords.length === 0) {
          console.log(`Бот ${this.playerId}: все слова уже найдены`);
          await this.sleep(1000);
          continue;
        }

        // Бот иногда "зависает" и не ищет в этом раунде
        if (Math.random() < this.skipChance) {
          const skipDelay = this.getRandomDelay() * 2;
          console.log(`Бот ${this.playerId} размышляет...`);
          await this.sleep(skipDelay);
          continue;
        }

        // Выбираем СЛУЧАЙНОЕ слово из оставшихся (а не по порядку)
        const wordData = remainingWords[Math.floor(Math.random() * remainingWords.length)];

        // Имитируем задержку человека
        const delay = this.getRandomDelay();
        await this.sleep(delay);

        // Проверяем статус ещё раз после задержки
        const sessionAfterDelay = await db.query.gameSessions.findFirst({
          where: eq(gameSessions.id, this.sessionId),
        });
        if (!sessionAfterDelay || sessionAfterDelay.status === 'finished') {
          console.log(`Бот ${this.playerId}: игра закончилась во время ожидания`);
          this.isActive = false;
          break;
        }

        // Проверяем ещё раз, не нашли ли пока мы спали
        const stillNotFound = await db.query.foundWords.findFirst({
          where: and(
            eq(foundWords.sessionId, this.sessionId),
            eq(foundWords.word, wordData.word)
          ),
        });
        if (stillNotFound) {
          continue;
        }

        // Отправляем слово (с вероятностью ошибки)
        if (Math.random() < this.accuracy) {
          await this.submitWord(wordData);
          console.log(`Бот ${this.playerId} нашёл слово: ${wordData.word}`);
        } else {
          console.log(`Бот ${this.playerId} ошибся при поиске слова: ${wordData.word}`);
        }
      }

      console.log(`Бот ${this.playerId} завершил работу`);
    } catch (error) {
      console.error('Ошибка в работе бота:', error);
    }

    this.isActive = false;
  }

  /**
   * Останавливает поиск слов
   */
  stopFindingWords() {
    this.isActive = false;
    console.log(`Бот ${this.playerId} остановлен`);
  }

  /**
   * Ищет все слова на поле (змейкой)
   */
  private findWordsOnGrid(
    grid: string[][],
    wordList: string[]
  ): WordPosition[] {
    const foundPositions: WordPosition[] = [];

    for (const word of wordList) {
      const path = this.findWordPath(grid, word);
      if (path) {
        foundPositions.push({ word, path });
      }
    }

    return foundPositions;
  }

  /**
   * Ищет путь слова на поле (змейка с 1 поворотом)
   */
  private findWordPath(grid: string[][], word: string): Coordinate[] | null {
    const directions: Array<{ r: number; c: number }> = [
      { r: 0, c: 1 }, { r: 0, c: -1 }, { r: 1, c: 0 }, { r: -1, c: 0 },
    ];

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        for (const dir1 of directions) {
          // Пробуем разные длины первого сегмента
          for (let seg1 = 2; seg1 <= word.length; seg1++) {
            const path = this.tryBuildPath(grid, word, row, col, dir1, seg1);
            if (path) return path;
          }
        }
      }
    }

    return null;
  }

  private tryBuildPath(
    grid: string[][],
    word: string,
    startR: number,
    startC: number,
    dir1: { r: number; c: number },
    seg1Len: number
  ): Coordinate[] | null {
    const path: Coordinate[] = [{ row: startR, col: startC }];
    let r = startR, c = startC;

    // Первый сегмент
    for (let i = 1; i < seg1Len; i++) {
      r += dir1.r; c += dir1.c;
      if (!this.inBounds(r, c, grid)) return null;
      path.push({ row: r, col: c });
    }

    const seg2Len = word.length - seg1Len;
    if (seg2Len > 0) {
      // Возможные повороты под 90°
      const turns = this.getTurns(dir1);
      for (const dir2 of turns) {
        const path2 = [...path];
        let r2 = r, c2 = c;
        let ok = true;
        for (let i = 0; i < seg2Len; i++) {
          r2 += dir2.r; c2 += dir2.c;
          if (!this.inBounds(r2, c2, grid)) { ok = false; break; }
          path2.push({ row: r2, col: c2 });
        }
        if (!ok) continue;

        // Проверяем буквы
        const letters = path2.map((p, i) => grid[p.row][p.col]);
        if (letters.join('') === word) return path2;
      }
    } else {
      // Односегментное слово
      const letters = path.map((p, i) => grid[p.row][p.col]);
      if (letters.join('') === word) return path;
    }

    return null;
  }

  private inBounds(r: number, c: number, grid: string[][]): boolean {
    return r >= 0 && r < grid.length && c >= 0 && c < grid[0].length;
  }

  private getTurns(dir: { r: number; c: number }): Array<{ r: number; c: number }> {
    if (dir.r === 0) return [{ r: 1, c: 0 }, { r: -1, c: 0 }];
    return [{ r: 0, c: 1 }, { r: 0, c: -1 }];
  }

  /**
   * Отправляет найденное слово и проверяет окончание игры
   */
  private async submitWord(wordData: WordPosition) {
    await db.insert(foundWords).values({
      sessionId: this.sessionId,
      playerId: this.playerId,
      word: wordData.word,
      startRow: wordData.path[0].row,
      startCol: wordData.path[0].col,
      endRow: wordData.path[wordData.path.length - 1].row,
      endCol: wordData.path[wordData.path.length - 1].col,
      direction: 'horizontal',
      path: wordData.path,
    });

    // Проверяем, не закончилась ли игра
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, this.sessionId),
    });

    if (session) {
      const allFound = await db.select({ id: foundWords.id })
        .from(foundWords)
        .where(eq(foundWords.sessionId, this.sessionId));

      if (allFound.length >= session.wordList.length) {
        await db.update(gameSessions)
          .set({ status: 'finished' })
          .where(eq(gameSessions.id, this.sessionId));
        console.log(`Бот ${this.playerId}: игра завершена, все слова найдены!`);
        this.stopFindingWords();
      }
    }
  }

  /**
   * Генерирует случайную задержку
   */
  private getRandomDelay(): number {
    return Math.floor(Math.random() * (this.maxDelay - this.minDelay + 1)) + this.minDelay;
  }

  /**
   * Пауза на указанное количество миллисекунд
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Фабрика для создания ботов
 */
export class BotFactory {
  /**
   * Создаёт бота с заданной сложностью
   */
  static createBot(
    sessionId: string,
    playerId: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): GameBot {
    const configs = {
      easy: {
        minDelay: 8000,      // 8 секунд минимум
        maxDelay: 20000,     // 20 секунд максимум
        accuracy: 0.35,      // 35% точность — часто ошибается
        knownWordsRatio: 1.0,// Знает ВСЕ слова
        skipChance: 0.4,     // 40% шанс "зависнуть" на ход
      },
      medium: {
        minDelay: 5000,      // 5 секунд
        maxDelay: 12000,     // 12 секунд
        accuracy: 0.55,      // 55% точность
        knownWordsRatio: 1.0,// Знает ВСЕ слова
        skipChance: 0.25,    // 25% шанс пропустить ход
      },
      hard: {
        minDelay: 3000,      // 3 секунды
        maxDelay: 7000,      // 7 секунд
        accuracy: 0.7,       // 70% точность
        knownWordsRatio: 1.0,// Знает ВСЕ слова
        skipChance: 0.15,    // 15% шанс пропустить ход
      },
    };

    const config = configs[difficulty];

    return new GameBot({
      sessionId,
      playerId,
      minDelay: config.minDelay,
      maxDelay: config.maxDelay,
      accuracy: config.accuracy,
      knownWordsRatio: config.knownWordsRatio,
      skipChance: config.skipChance,
    });
  }
}
