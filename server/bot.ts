/**
 * Реализация игрового бота
 * 
 * Бот автоматически находит слова на поле с заданной скоростью
 * Имитирует поведение человека
 */

import { db } from '../lib/db';
import { gameSessions, gamePlayers, foundWords, matchHistory } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

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
 * @deprecated Устарело — сложность теперь хранится в БД
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
    console.log(`[Бот ${this.playerId}] >>> НАЧАЛ поиск слов <<<`);
    console.log(`[Бот ${this.playerId}] sessionId: ${this.sessionId}, minDelay: ${this.minDelay}ms, maxDelay: ${this.maxDelay}ms, accuracy: ${this.accuracy}`);
    this.isActive = true;

    try {
      // Получаем состояние игры
      const session = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, this.sessionId),
      });

      if (!session) {
        console.error(`[Бот ${this.playerId}] ✗ Сессия не найдена`);
        return;
      }

      console.log(`[Бот ${this.playerId}] Сессия найдена, статус: ${session.status}`);

      if (session.status !== 'in_progress') {
        console.log(`[Бот ${this.playerId}] ✗ Игра ещё не началась или закончилась: ${session.status}`);
        return;
      }

      // Находим все слова на поле — ВСЕ боты знают все слова
      console.log(`[Бот ${this.playerId}] Ищу слова на поле...`);
      const allWordsOnGrid = this.findWordsOnGrid(session.grid, session.wordList);
      console.log(`[Бот ${this.playerId}] Найдено ${allWordsOnGrid.length} слов на поле`);
      
      const knownWords = shuffleArray(allWordsOnGrid);
      console.log(`[Бот ${this.playerId}] ✓ Знает все ${knownWords.length} слов, начинает игру`);

      let iteration = 0;
      // Бесконечный цикл: бот играет, пока игра не закончится
      while (this.isActive) {
        iteration++;
        console.log(`[Бот ${this.playerId}] Итерация ${iteration}...`);
        
        // Проверяем статус игры
        const currentSession = await db.query.gameSessions.findFirst({
          where: eq(gameSessions.id, this.sessionId),
        });
        if (!currentSession || currentSession.status === 'finished') {
          console.log(`[Бот ${this.playerId}] Игра закончилась, останавливаюсь`);
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

        console.log(`[Бот ${this.playerId}] Осталось слов: ${remainingWords.length}`);

        // Если все слова найдены — выходим
        if (remainingWords.length === 0) {
          console.log(`[Бот ${this.playerId}] Все слова уже найдены`);
          await this.sleep(500);
          continue;
        }

        // Бот иногда "зависает" и не ищет в этом раунде
        if (Math.random() < this.skipChance) {
          const skipDelay = this.getRandomDelay();
          console.log(`[Бот ${this.playerId}] Размышляет... ${skipDelay}ms`);
          await this.sleep(skipDelay);
          continue;
        }

        // Выбираем СЛУЧАЙНОЕ слово из оставшихся (а не по порядку)
        const wordData = remainingWords[Math.floor(Math.random() * remainingWords.length)];
        console.log(`[Бот ${this.playerId}] Выбрал слово: ${wordData.word}`);

        // Имитируем задержку человека
        const delay = this.getRandomDelay();
        console.log(`[Бот ${this.playerId}] Жду ${delay}ms перед поиском...`);
        await this.sleep(delay);

        // Проверяем статус ещё раз после задержки
        const sessionAfterDelay = await db.query.gameSessions.findFirst({
          where: eq(gameSessions.id, this.sessionId),
        });
        if (!sessionAfterDelay || sessionAfterDelay.status === 'finished') {
          console.log(`[Бот ${this.playerId}] Игра закончилась во время ожидания, останавливаюсь`);
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
          console.log(`[Бот ${this.playerId}] Слово уже найдено кем-то другим`);
          continue;
        }

        // Отправляем слово (с вероятностью ошибки)
        if (Math.random() < this.accuracy) {
          console.log(`[Бот ${this.playerId}] ✓ Отправляю слово: ${wordData.word}`);
          await this.submitWord(wordData);
        } else {
          console.log(`[Бот ${this.playerId}] ✗ Ошибка при поиске слова: ${wordData.word}`);
        }
      }

      console.log(`[Бот ${this.playerId}] Завершил работу после ${iteration} итераций`);
    } catch (error) {
      console.error(`[Бот ${this.playerId}] ✗ Ошибка в работе:`, error);
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
    console.log(`[Бот ${this.playerId}] Сохраняю слово: ${wordData.word}`);
    
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

    // Ждём немного чтобы данные точно записались
    await new Promise(resolve => setTimeout(resolve, 50));

    // Проверяем, нужно ли обновить firstWordTime (первое слово бота)
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, this.sessionId),
    });

    if (session) {
      const playerWords = await db.select({ id: foundWords.id })
        .from(foundWords)
        .where(eq(foundWords.playerId, this.playerId));
      
      // Если это первое слово — обновляем firstWordTime
      if (playerWords.length === 1) {
        const sessionStartTime = session.createdAt ? new Date(session.createdAt).getTime() : Date.now();
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - sessionStartTime) / 1000);
        
        await db.update(gamePlayers)
          .set({ firstWordTime: elapsedSeconds })
          .where(eq(gamePlayers.id, this.playerId));
        
        console.log(`[Бот ${this.playerId}] Первое слово найдено за ${elapsedSeconds} секунд`);
      }
      
      // Обновляем счётчик найденных слов игрока
      await db.update(gamePlayers)
        .set({ wordsFound: playerWords.length })
        .where(eq(gamePlayers.id, this.playerId));

      console.log(`[Бот ${this.playerId}] Всего слов: ${playerWords.length}`);

      // Проверяем, не закончилась ли игра
      const allFound = await db.select({ id: foundWords.id })
        .from(foundWords)
        .where(eq(foundWords.sessionId, this.sessionId));

      if (allFound.length >= session.wordList.length) {
        console.log(`[Бот ${this.playerId}] Все слова найдены (${allFound.length}/${session.wordList.length}), завершаем игру`);
        await db.update(gameSessions)
          .set({ status: 'finished' })
          .where(eq(gameSessions.id, this.sessionId));
        
        // Ждём немного чтобы все данные успели записаться
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Сохраняем статистику матча
        await saveMatchHistory(this.sessionId);
        
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
 * Сохраняет статистику матча после завершения игры
 */
async function saveMatchHistory(sessionId: string) {
  console.log(`[saveMatchHistory] Saving for session: ${sessionId}`);
  
  // Получаем всех игроков сессии
  const players = await db.select({
    player: gamePlayers,
  }).from(gamePlayers)
    .where(eq(gamePlayers.sessionId, sessionId));
  
  // Получаем все найденные слова
  const foundWordsData = await db.select({
    playerId: foundWords.playerId,
  }).from(foundWords)
    .where(eq(foundWords.sessionId, sessionId));
  
  // Считаем слова по игрокам
  const wordsCountMap = new Map<string, number>();
  foundWordsData.forEach((w: { playerId: string }) => {
    wordsCountMap.set(w.playerId, (wordsCountMap.get(w.playerId) || 0) + 1);
  });
  
  console.log(`[saveMatchHistory] Words per player:`, Object.fromEntries(wordsCountMap));
  
  // Сортируем игроков по результату
  const results = players
    .map((p: { player: { id: string; name: string; isBot: boolean; firstWordTime: number | null } }) => ({
      id: p.player.id,
      name: p.player.name,
      wordsFound: wordsCountMap.get(p.player.id) || 0,
      isBot: p.player.isBot,
      firstWordTime: p.player.firstWordTime,
    }))
    .sort((a: { wordsFound: number; firstWordTime: number | null }, b: { wordsFound: number; firstWordTime: number | null }) => {
      if (b.wordsFound !== a.wordsFound) {
        return b.wordsFound - a.wordsFound;
      }
      const aTime = a.firstWordTime ?? Infinity;
      const bTime = b.firstWordTime ?? Infinity;
      return aTime - bTime;
    });
  
  const rankMap = new Map<string, number>();
  results.forEach((r: { id: string }, index: number) => {
    rankMap.set(r.id, index + 1);
  });
  
  // Фильтруем: сохраняем только игроков, которые нашли хотя бы 1 слово
  const historyEntries: Array<{
    sessionId: string;
    userId: string | null;
    playerName: string;
    wordsFound: number;
    firstWordTime: number | null;
    rank: number | null;
  }> = players
    .map((p: { player: { id: string; name: string; isBot: boolean; firstWordTime: number | null; userId: string | null } }) => {
      const wordsFound = wordsCountMap.get(p.player.id) || 0;
      const rank = rankMap.get(p.player.id) || 999;
      
      // Пропускаем игроков с 0 словами
      if (wordsFound === 0) {
        console.log(`[saveMatchHistory] Skipping ${p.player.name} - 0 words`);
        return null;
      }
      
      return {
        sessionId,
        userId: p.player.userId,
        playerName: p.player.name,
        wordsFound,
        firstWordTime: p.player.firstWordTime,
        rank: rank === 999 ? null : rank,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  
  console.log(`[saveMatchHistory] Entries to save:`, historyEntries);
  
  if (historyEntries.length > 0) {
    try {
      await db.insert(matchHistory).values(historyEntries);
      console.log(`[saveMatchHistory] ✓ Saved ${historyEntries.length} entries`);
    } catch (err: any) {
      console.error('[saveMatchHistory] ✗ Error:', err.message);
    }
  } else {
    console.log('[saveMatchHistory] No entries to save');
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
        minDelay: 400,       // 0.4 секунды минимум
        maxDelay: 1500,      // 1.5 секунд максимум
        accuracy: 0.55,      // 55% точность
        knownWordsRatio: 1.0,// Знает ВСЕ слова
        skipChance: 0.15,    // 15% шанс "зависнуть"
      },
      medium: {
        minDelay: 250,       // 0.25 секунды
        maxDelay: 900,       // 0.9 секунд
        accuracy: 0.75,      // 75% точность
        knownWordsRatio: 1.0,// Знает ВСЕ слова
        skipChance: 0.08,    // 8% шанс пропустить ход
      },
      hard: {
        minDelay: 100,       // 0.1 секунда
        maxDelay: 500,       // 0.5 секунд
        accuracy: 0.92,      // 92% точность
        knownWordsRatio: 1.0,// Знает ВСЕ слова
        skipChance: 0.02,    // 2% шанс пропустить ход
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
