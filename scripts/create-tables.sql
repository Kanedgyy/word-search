-- SQL скрипт для создания таблиц в PostgreSQL (Neon)
-- Выполните этот скрипт через Neon Dashboard → SQL Editor

-- ============================================================================
-- Better Auth Tables
-- ============================================================================

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE NOT NULL,
  password_hash TEXT DEFAULT '',
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Таблица сессий
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Таблица OAuth аккаунтов
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires_at TIMESTAMP,
  refresh_token_expires_at TIMESTAMP,
  scope TEXT,
  id_token TEXT,
  password TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Таблица верификаций
CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Таблица ролей пользователей
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'user' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Game Tables
-- ============================================================================

-- Таблица игровых сессий
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_list TEXT[] NOT NULL,
  grid JSONB NOT NULL,
  game_mode VARCHAR(20) DEFAULT 'individual' NOT NULL,
  on_time_limit BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'waiting' NOT NULL,
  max_players INTEGER DEFAULT 6 NOT NULL,
  duration INTEGER DEFAULT 300 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  ends_at TIMESTAMP,
  rematch_session_id UUID,
  host_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Таблица игроков в сессиях
CREATE TABLE IF NOT EXISTS game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  is_bot BOOLEAN DEFAULT FALSE NOT NULL,
  color TEXT NOT NULL,
  turn_order INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'joined' NOT NULL,
  first_word_time INTEGER,
  team VARCHAR(20),
  difficulty VARCHAR(20),
  words_found INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Таблица найденных слов
CREATE TABLE IF NOT EXISTS found_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  start_row INTEGER NOT NULL,
  start_col INTEGER NOT NULL,
  end_row INTEGER NOT NULL,
  end_col INTEGER NOT NULL,
  direction VARCHAR(20) NOT NULL,
  path JSONB,
  found_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Таблица истории матчей
CREATE TABLE IF NOT EXISTS match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  words_found INTEGER DEFAULT 0 NOT NULL,
  first_word_time INTEGER,
  rank INTEGER,
  recorded_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Уникальный индекс для match_history
CREATE UNIQUE INDEX IF NOT EXISTS unique_session_idx ON match_history(session_id);

-- ============================================================================
-- Проверка создания
-- ============================================================================

-- Показать все созданные таблицы
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
