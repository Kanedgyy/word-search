import { pgTable, uuid, text, timestamp, integer, boolean, varchar, jsonb } from 'drizzle-orm/pg-core';

// Таблица пользователей
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Таблица сессий игр
export const gameSessions = pgTable('game_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Список слов для поиска
  wordList: text('word_list').array().notNull(),
  // Состояние поля (10x10 букв) — храним как JSON
  grid: jsonb('grid').$type<string[][]>().notNull(),
  // Режим игры: individual (каждый сам за себя) или team (командный)
  gameMode: varchar('game_mode', { enum: ['individual', 'team'] }).notNull().default('individual'),
  // Игра на времени (да/нет)
  onTimeLimit: boolean('on_time_limit').default(false),
  // Статус игры: 'waiting' | 'in_progress' | 'finished'
  status: varchar('status', { enum: ['waiting', 'in_progress', 'finished'] }).notNull().default('waiting'),
  // Максимальное количество игроков
  maxPlayers: integer('max_players').notNull().default(6),
  // Длительность игры в секундах
  duration: integer('duration').notNull().default(300), // 5 минут по умолчанию
  // Время создания
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // Время окончания
  endsAt: timestamp('ends_at'),
  // Ссылка на реванш (новая сессия)
  rematchSessionId: uuid('rematch_session_id'),
});

// Таблица игроков в сессиях
export const gamePlayers = pgTable('game_players', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => gameSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  isBot: boolean('is_bot').notNull().default(false),
  color: text('color').notNull(),
  turnOrder: integer('turn_order').notNull(),
  status: varchar('status', { enum: ['joined', 'left'] }).notNull().default('joined'),
  firstWordTime: integer('first_word_time'),
  // Команда игрока (null = индивидуальный режим)
  team: varchar('team', { enum: ['red', 'blue', 'green', 'yellow'] }),
  // Сложность бота
  difficulty: varchar('difficulty', { enum: ['easy', 'medium', 'hard'] }),
  // Количество найденных слов (кэш для быстрого отображения)
  wordsFound: integer('words_found').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Таблица найденных слов
export const foundWords = pgTable('found_words', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Ссылка на сессию
  sessionId: uuid('session_id').notNull().references(() => gameSessions.id, { onDelete: 'cascade' }),
  // Ссылка на игрока
  playerId: uuid('player_id').notNull().references(() => gamePlayers.id, { onDelete: 'cascade' }),
  // Найденное слово
  word: text('word').notNull(),
  // Координаты начала слова [row, col]
  startRow: integer('start_row').notNull(),
  startCol: integer('start_col').notNull(),
  // Координаты конца слова [row, col]
  endRow: integer('end_row').notNull(),
  endCol: integer('end_col').notNull(),
  // Направление: 'horizontal' | 'vertical' | 'diagonal_down' | 'diagonal_up'
  direction: varchar('direction', { 
    enum: ['horizontal', 'vertical', 'diagonal_down', 'diagonal_up'] 
  }).notNull(),
  // Путь слова (для змейки) — массив координат [{row, col}, ...]
  path: jsonb('path').$type<Array<{ row: number; col: number }>>(),
  // Время нахождения
  foundAt: timestamp('found_at').defaultNow().notNull(),
});

// Таблица статистики матчей (история)
export const matchHistory = pgTable('match_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Ссылка на сессию
  sessionId: uuid('session_id').notNull().references(() => gameSessions.id, { onDelete: 'cascade' }),
  // Ссылка на пользователя
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  // Имя игрока (сохраняем копию на случай удаления пользователя)
  playerName: text('player_name').notNull(),
  // Количество найденных слов
  wordsFound: integer('words_found').notNull().default(0),
  // Время первого слова (для определения скорости)
  firstWordTime: integer('first_word_time'), // в секундах от начала игры
  // Место в соревновании
  rank: integer('rank'),
  // Время записи
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

// Экспорт всех таблиц для Drizzle
export const tables = {
  users,
  gameSessions,
  gamePlayers,
  foundWords,
  matchHistory,
};
