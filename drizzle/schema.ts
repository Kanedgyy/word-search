import { pgTable, uuid, text, timestamp, integer, boolean, varchar, jsonb, primaryKey } from 'drizzle-orm/pg-core';

// ============================================================================
// Better Auth Schema
// ============================================================================

/**
 * Пользователи системы (расширенная таблица для Better-auth)
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  passwordHash: text('password_hash').default(''),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Сессии пользователей (для Better-auth)
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Аккаунты OAuth (для Better-auth)
 */
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Верификации (для Better-auth)
 */
export const verifications = pgTable('verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Роли пользователей (для ролевой модели)
 */
export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// Game Schema
// ============================================================================

/**
 * Сессии игр
 */
export const gameSessions = pgTable('game_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  wordList: text('word_list').array().notNull(),
  grid: jsonb('grid').$type<string[][]>().notNull(),
  gameMode: varchar('game_mode', { enum: ['individual', 'team'] }).notNull().default('individual'),
  onTimeLimit: boolean('on_time_limit').default(false),
  status: varchar('status', { enum: ['waiting', 'in_progress', 'finished'] }).notNull().default('waiting'),
  maxPlayers: integer('max_players').notNull().default(6),
  duration: integer('duration').notNull().default(300),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  endsAt: timestamp('ends_at'),
  rematchSessionId: uuid('rematch_session_id'),
  hostUserId: uuid('host_user_id').references(() => users.id, { onDelete: 'set null' }),
});

/**
 * Игроки в сессиях
 */
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
  team: varchar('team', { enum: ['red', 'blue', 'green', 'yellow'] }),
  difficulty: varchar('difficulty', { enum: ['easy', 'medium', 'hard'] }),
  wordsFound: integer('words_found').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Найденные слова
 */
export const foundWords = pgTable('found_words', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => gameSessions.id, { onDelete: 'cascade' }),
  playerId: uuid('player_id').notNull().references(() => gamePlayers.id, { onDelete: 'cascade' }),
  word: text('word').notNull(),
  startRow: integer('start_row').notNull(),
  startCol: integer('start_col').notNull(),
  endRow: integer('end_row').notNull(),
  endCol: integer('end_col').notNull(),
  direction: varchar('direction', { 
    enum: ['horizontal', 'vertical', 'diagonal_down', 'diagonal_up'] 
  }).notNull(),
  path: jsonb('path').$type<Array<{ row: number; col: number }>>(),
  foundAt: timestamp('found_at').defaultNow().notNull(),
});

/**
 * История матчей
 */
export const matchHistory = pgTable('match_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => gameSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  playerName: text('player_name').notNull(),
  wordsFound: integer('words_found').notNull().default(0),
  firstWordTime: integer('first_word_time'),
  rank: integer('rank'),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
}, (table) => {
  return {
    uniqueSessionIdx: {
      unique: true,
      on: table.sessionId,
    },
  };
});

// Экспорт всех таблиц
export const tables = {
  users,
  sessions,
  accounts,
  verifications,
  userRoles,
  gameSessions,
  gamePlayers,
  foundWords,
  matchHistory,
};

// Экспорт для Better-auth
export const betterAuthSchema = {
  users,
  sessions,
  accounts,
  verifications,
};
