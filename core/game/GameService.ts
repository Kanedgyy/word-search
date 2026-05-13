/**
 * Сервис игры — чистая бизнес-логика
 * Не зависит от фреймворков и БД
 */

import { AppError, isAppError } from './GameErrors';
import type { GameRepository } from './GameRepository';
import type { 
  GameSession, 
  Player, 
  CreateSessionInput, 
  JoinSessionInput, 
  SubmitWordInput,
  Coordinate 
} from './types';

export interface GameServiceOptions {
  repository: GameRepository;
}

export class GameService {
  private repository: GameRepository;

  constructor(options: GameServiceOptions) {
    this.repository = options.repository;
  }

  /**
   * Создаёт новую игровую сессию
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
   */
  async getSession(sessionId: string): Promise<GameSession | null> {
    return await this.repository.getSession(sessionId);
  }

  /**
   * Присоединяется к сессии
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
   */
  async submitWord(input: SubmitWordInput): Promise<{ 
    success: boolean; 
    error?: string; 
    player?: Player;
    results?: Array<{ rank: number; name: string; wordsFound: number; isBot: boolean }>;
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

    // Обновляем игрока
    const player = await this.repository.updatePlayer(input.playerId, {
      wordsFound: Math.floor(Math.random() * 10) + 1, // TODO: реальный подсчёт
    });

    // Получаем результаты
    const players = await this.repository.getPlayersBySession(input.sessionId);
    const results = players
      .sort((a, b) => b.wordsFound - a.wordsFound)
      .map((p) => ({
        rank: 0, // TODO: вычислить ранг
        name: p.name,
        wordsFound: p.wordsFound,
        isBot: p.isBot,
      }));

    // Проверяем закончилась ли игра
    const gameEnded = false; // TODO: проверить через БД

    return {
      success: true,
      player: player ?? undefined,
      results,
      gameEnded,
    };
  }
}
