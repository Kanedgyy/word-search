/**
 * Типы для Drizzle ORM
 * 
 * Экспортирует все типы для таблиц из схемы
 */

import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { 
  users, 
  sessions, 
  accounts, 
  verifications, 
  userRoles,
  gameSessions, 
  gamePlayers, 
  foundWords, 
  matchHistory 
} from './schema';

// User types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// Session types (auth)
export type AuthSession = InferSelectModel<typeof sessions>;
export type NewAuthSession = InferInsertModel<typeof sessions>;

// Account types
export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;

// Verification types
export type Verification = InferSelectModel<typeof verifications>;
export type NewVerification = InferInsertModel<typeof verifications>;

// User role types
export type UserRole = InferSelectModel<typeof userRoles>;
export type NewUserRole = InferInsertModel<typeof userRoles>;

// Game session types
export type GameSession = InferSelectModel<typeof gameSessions>;
export type NewGameSession = InferInsertModel<typeof gameSessions>;

// Game player types
export type GamePlayer = InferSelectModel<typeof gamePlayers>;
export type NewGamePlayer = InferInsertModel<typeof gamePlayers>;

// Found word types
export type FoundWord = InferSelectModel<typeof foundWords>;
export type NewFoundWord = InferInsertModel<typeof foundWords>;

// Match history types
export type MatchHistory = InferSelectModel<typeof matchHistory>;
export type NewMatchHistory = InferInsertModel<typeof matchHistory>;

// Export all tables object
export { 
  users, 
  sessions, 
  accounts, 
  verifications, 
  userRoles,
  gameSessions, 
  gamePlayers, 
  foundWords, 
  matchHistory 
};
