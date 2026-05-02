import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../drizzle/schema';

// Получаем строку подключения из переменных окружения
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/word_search';

// Создаём клиент postgres
const client = postgres(connectionString);

// Создаём экземпляр drizzle с схемой
export const db = drizzle(client, { schema });
