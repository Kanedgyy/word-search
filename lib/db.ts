/**
 * Подключение к базе данных PostgreSQL через Drizzle ORM
 * 
 * Экспортирует единственный экземпляр db для работы с БД.
 * 
 * @example
 * ```typescript
 * import { db } from '@/lib/db';
 * 
 * const users = await db.select().from(users);
 * ```
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../drizzle/schema';

// Получаем строку подключения из переменных окружения
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/word_search';

/**
 * PostgreSQL client connection
 */
const client = postgres(connectionString);

/**
 * Drizzle ORM instance with full type safety
 * 
 * Provides type-safe database operations using the schema defined in drizzle/schema.ts
 */
export const db = drizzle(client, { schema });
