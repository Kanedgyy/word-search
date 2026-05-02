/**
 * Скрипт для сброса базы данных
 * Запуск: npx tsx scripts/reset-db.ts
 */

import postgres from 'postgres';

// Укажи здесь свои данные для подключения к PostgreSQL
const connectionString = 'postgresql://postgres:3812740@localhost:5432/word_search';

async function resetDatabase() {
  console.log('Подключение к базе данных...');
  
  const client = postgres(connectionString);
  
  try {
    console.log('Удаление старых таблиц...');
    
    await client`
      DROP TABLE IF EXISTS match_history CASCADE;
    `;
    
    await client`
      DROP TABLE IF EXISTS found_words CASCADE;
    `;
    
    await client`
      DROP TABLE IF EXISTS game_players CASCADE;
    `;
    
    await client`
      DROP TABLE IF EXISTS game_sessions CASCADE;
    `;
    
    await client`
      DROP TABLE IF EXISTS users CASCADE;
    `;
    
    await client`
      DROP TABLE IF EXISTS drizzle.__drizzle_migrations CASCADE;
    `;
    
    console.log('✅ Все таблицы удалены!');
    console.log('Теперь выполни: npx drizzle-kit migrate');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.end();
  }
}

resetDatabase();
