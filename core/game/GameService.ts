/**
 * Сервис игры — чистая бизнес-логика
 * Не зависит от фреймворков и БД
 * 
 * Использует репозиторий для доступа к данным, что позволяет:
 * - Тестировать сервис без БД (mock репозиторий)
 * - Заменять реализацию репозитория (PostgreSQL → SQLite для тестов)
 * - Соблюдать принцип Dependency Inversion
 */

import { AppError, isAppError } from './GameErrors';
import type { GameRepository } from './GameRepository';
import type { 
  GameSession, 
  Player, 
  CreateSessionInput, 
  JoinSessionInput, 
  SubmitWordInput,
  Coordinate,
  FoundWord
} from './types';

export interface GameServiceOptions {
  repository: GameRepository;
}

/**
 * Результаты игры с ранжированием
 */
interface GameResult {
  rank: number;
  name: string;
  wordsFound: number;
  isBot: boolean;
  firstWordTime: number | null;
}

export class GameService {
  private repository: GameRepository;

  constructor(options: GameServiceOptions) {
    this.repository = options.repository;
  }

  /**
   * Создаёт новую игровую сессию
   * 
   * @param input - Параметры сессии
   * @returns Созданная сессия с grid и wordList
   * @throws AppError если параметры валидации не пройдены
   */
  async createSession(input: CreateSessionInput): Promise<GameSession> {
    // Валидация
    if (input.maxPlayers < 2 || input.maxPlayers > 6) {
      throw new AppError('VALIDATION_ERROR', 'Максимум игроков должен быть от 2 до 6');
    }
    
    if (input.duration < 60 || input.duration > 600) {
      throw new AppError('VALIDATION_ERROR', 'Длительность должна быть от 60 до 600 секунд');
    }

    // Генерируем поле и слова (вызов к внешнему сервису)
    const { generateWordSearch } = await import('@/features/game/utils/wordSearch');
    const randomWords = await import('@/features/game/utils/wordSearch');
    const wordList = randomWords.getRandomWordSubset(12);
    const { grid } = generateWordSearch(wordList);

    const session = await this.repository.createSession({
      ...input,
      grid,
      wordList,
      status: 'waiting',
      endsAt: null,
      rematchSessionId: null,
      hostUserId: input.hostUserId ?? null,
    });

    return session;
  }

  /**
   * Получает сессию по ID
   * 
   * @param sessionId - ID сессии
   * @returns Сессия или null если не найдена
   */
  async getSession(sessionId: string): Promise<GameSession | null> {
    return await this.repository.getSession(sessionId);
  }

  /**
   * Присоединяется к сессии
   * 
   * @param input - Данные игрока
   * @returns Информация о игроке и сессии
   * @throws AppError если сессия не найдена или игра началась
   */
  async joinSession(input: JoinSessionInput): Promise<{ player: Player; playersCount: number; isHost: boolean }> {
    const session = await this.repository.getSession(input.sessionId);
    
    if (!session) {
      throw new AppError('SESSION_NOT_FOUND', 'Сессия не найдена');
    }

    if (session.status !== 'waiting') {
      throw new AppError('GAME_ALREADY_STARTED', 'Игра уже началась');
    }

    const players = await this.repository.getPlayersBySession(input.sessionId);

    if (players.length >= session.maxPlayers) {
      throw new AppError('MAX_PLAYERS_REACHED', 'Максимум игроков достигнут');
    }

    // Генерируем цвет
    const colors = ['#FF006E', '#3A86FF', '#8338EC', '#FB5607', '#FFBE0B', '#06D6A0'];
    const color = colors[players.length % colors.length];

    const isHost = players.length === 0;

    const player = await this.repository.addPlayer(input.sessionId, {
      name: input.playerName,
      isBot: false,
      color,
      turnOrder: players.length,
      status: 'joined',
      firstWordTime: null,
      team: null,
      wordsFound: 0,
      userId: input.userId ?? null,
    });

    return {
      player,
      playersCount: players.length + 1,
      isHost,
    };
  }

  /**
   * Запускает игру
   * 
   * @param sessionId - ID сессии
   * @param hostUserId - ID хоста (для проверки прав)
   * @returns Обновлённая сессия со статусом in_progress
   * @throws AppError если проверка прав не пройдена
   */
  async startGame(sessionId: string, hostUserId: string): Promise<GameSession> {
    const session = await this.repository.getSession(sessionId);
    
    if (!session) {
      throw new AppError('SESSION_NOT_FOUND', 'Сессия не найдена');
    }

    if (session.status !== 'waiting') {
      throw new AppError('GAME_ALREADY_STARTED', 'Игра уже началась');
    }

    if (session.hostUserId !== hostUserId) {
      throw new AppError('NOT_HOST', 'Только хост может запустить игру');
    }

    const players = await this.repository.getPlayersBySession(sessionId);

    if (players.length < 2) {
      throw new AppError('VALIDATION_ERROR', 'Нужно минимум 2 игрока');
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + session.duration * 1000);

    const updated = await this.repository.updateSession(sessionId, {
      status: 'in_progress',
      endsAt,
    });
    
    if (!updated) {
      throw new AppError('NOT_FOUND', 'Не удалось обновить сессию');
    }
    
    return updated;
  }

  /**
   * Отправляет найденное слово
   * 
   * @param input - Данные о слове и игроке
   * @returns Результат проверки слова
   */
  async submitWord(input: SubmitWordInput): Promise<{ 
    success: boolean; 
    error?: string; 
    player?: Player;
    results?: GameResult[];
    gameEnded: boolean;
  }> {
    const session = await this.repository.getSession(input.sessionId);
    
    if (!session) {
      throw new AppError('SESSION_NOT_FOUND', 'Сессия не найдена');
    }

    if (session.status !== 'in_progress') {
      throw new AppError('GAME_NOT_STARTED', 'Игра не началась');
    }

    // Проверка что слово есть в списке
    if (!session.wordList.includes(input.word.toUpperCase())) {
      return {
        success: false,
        error: 'Такого слова нет в списке',
        gameEnded: false,
      };
    }

    // Проверка что слово ещё не найдено
    const wordExists = await this.repository.wordExists(input.sessionId, input.word.toUpperCase());
    if (wordExists) {
      return {
        success: false,
        error: 'Это слово уже найдено',
        gameEnded: false,
      };
    }

    // Добавляем слово
    await this.repository.addFoundWord({
      sessionId: input.sessionId,
      playerId: input.playerId,
      word: input.word.toUpperCase(),
      startRow: input.startRow,
      startCol: input.startCol,
      endRow: input.endRow,
      endCol: input.endCol,
      direction: input.direction,
      path: input.path ?? [],
    });

    // Получаем актуальное количество слов игрока
    const playerWords = await this.repository.getFoundWordsBySession(input.sessionId);
    const playerScore = playerWords.filter(w => w.playerId === input.playerId).length;

    // Обновляем игрока
    const player = await this.repository.updatePlayer(input.playerId, {
      wordsFound: playerScore,
    });

    // Получаем результаты всех игроков
    const players = await this.repository.getPlayersBySession(input.sessionId);
    const foundWords = await this.repository.getFoundWordsBySession(input.sessionId);
    
    // Считаем слова по игрокам
    const wordsCountMap = new Map<string, number>();
    foundWords.forEach(w => {
      wordsCountMap.set(w.playerId, (wordsCountMap.get(w.playerId) || 0) + 1);
    });

    const results: GameResult[] = players
      .map(p => ({
        rank: 0,
        name: p.name,
        wordsFound: wordsCountMap.get(p.id) || 0,
        isBot: p.isBot,
        firstWordTime: p.firstWordTime,
      }))
      .sort((a, b) => {
        if (b.wordsFound !== a.wordsFound) {
          return b.wordsFound - a.wordsFound;
        }
        const aTime = a.firstWordTime ?? Infinity;
        const bTime = b.firstWordTime ?? Infinity;
        return aTime - bTime;
      })
      .map((result, index) => ({
        ...result,
        rank: index + 1,
      }));

    // Проверяем закончилась ли игра
    const gameEnded = foundWords.length >= session.wordList.length;

    return {
      success: true,
      player: player ?? undefined,
      results,
      gameEnded,
    };
  }

  /**
   * Завершает игру и сохраняет статистику
   * 
   * @param sessionId - ID сессии
   */
  async finishGame(sessionId: string): Promise<void> {
    const session = await this.repository.getSession(sessionId);
    
    if (!session || session.status === 'finished') {
      return;
    }

    // Обновляем статус
    await this.repository.updateSession(sessionId, {
      status: 'finished',
    });

    // Получаем данные для статистики
    const players = await this.repository.getPlayersBySession(sessionId);
    const foundWords = await this.repository.getFoundWordsBySession(sessionId);

    // Считаем слова по игрокам
    const wordsCountMap = new Map<string, number>();
    const firstWordTimeMap = new Map<string, number>();
    
    foundWords.forEach(w => {
      wordsCountMap.set(w.playerId, (wordsCountMap.get(w.playerId) || 0) + 1);
      if (!firstWordTimeMap.has(w.playerId)) {
        firstWordTimeMap.set(w.playerId, Math.floor((new Date(w.foundAt).getTime() - new Date(session.createdAt).getTime()) / 1000));
      }
    });

    // Сортируем игроков и определяем ранги
    const sortedPlayers = players
      .map(p => ({
        id: p.id,
        name: p.name,
        wordsFound: wordsCountMap.get(p.id) || 0,
        firstWordTime: firstWordTimeMap.get(p.id) ?? null,
      }))
      .sort((a, b) => {
        if (b.wordsFound !== a.wordsFound) {
          return b.wordsFound - a.wordsFound;
        }
        const aTime = a.firstWordTime ?? Infinity;
        const bTime = b.firstWordTime ?? Infinity;
        return aTime - bTime;
      });

    // Сохраняем статистику для каждого игрока
    for (let i = 0; i < sortedPlayers.length; i++) {
      const player = sortedPlayers[i];
      if (player.wordsFound > 0) {
        await this.repository.recordMatchHistory({
          sessionId,
          userId: null, // Нужно получить из player
          playerName: player.name,
          wordsFound: player.wordsFound,
          firstWordTime: player.firstWordTime,
          rank: i + 1,
        });
      }
    }
  }
}
