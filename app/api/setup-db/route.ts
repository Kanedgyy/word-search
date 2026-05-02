import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Создаём таблицы если не существуют
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id uuid PRIMARY KEY DEFAULT md5(random()::text)::uuid,
        word_list text[] NOT NULL,
        grid jsonb NOT NULL,
        game_mode varchar(20) NOT NULL DEFAULT 'individual',
        status varchar(20) NOT NULL DEFAULT 'waiting',
        max_players integer NOT NULL DEFAULT 6,
        duration integer NOT NULL DEFAULT 300,
        created_at timestamp NOT NULL DEFAULT now(),
        ends_at timestamp
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT md5(random()::text)::uuid,
        name text NOT NULL,
        email text NOT NULL UNIQUE,
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS game_players (
        id uuid PRIMARY KEY DEFAULT md5(random()::text)::uuid,
        session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        name text NOT NULL,
        is_bot boolean NOT NULL DEFAULT false,
        color text NOT NULL,
        turn_order integer NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'joined',
        first_word_time integer,
        team varchar(20),
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS found_words (
        id uuid PRIMARY KEY DEFAULT md5(random()::text)::uuid,
        session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
        player_id uuid NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
        word text NOT NULL,
        start_row integer NOT NULL,
        start_col integer NOT NULL,
        end_row integer NOT NULL,
        end_col integer NOT NULL,
        direction varchar(20) NOT NULL,
        path jsonb,
        found_at timestamp NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS match_history (
        id uuid PRIMARY KEY DEFAULT md5(random()::text)::uuid,
        session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        player_name text NOT NULL,
        words_found integer NOT NULL DEFAULT 0,
        first_word_time integer,
        rank integer,
        recorded_at timestamp NOT NULL DEFAULT now()
      );
    `);

    return NextResponse.json({ success: true, message: 'Таблицы созданы!' });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
