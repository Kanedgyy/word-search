import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Для serverless (Vercel) используем postgres-js вместо pg
const queryClient = postgres(process.env.DATABASE_URL!, { prepare: false });

export const db = drizzle(queryClient, { schema });
