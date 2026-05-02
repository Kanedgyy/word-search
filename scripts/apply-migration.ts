import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const connectionString = 'postgresql://postgres:3812740@localhost:5432/word_search';

async function applyMigration() {
  console.log('Подключение к базе данных...');
  const client = postgres(connectionString);
  
  try {
    // Читаем SQL файл миграции (берём первый .sql файл)
    const migrationDir = path.join(process.cwd(), 'drizzle', 'migrations');
    const sqlFiles = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql'));
    if (sqlFiles.length === 0) throw new Error('No migration files found');
    const migrationPath = path.join(migrationDir, sqlFiles[0]);
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('Применение миграции...');
    
    // Разбиваем на отдельные команды (разделитель — --> statement-breakpoint)
    const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
    
    for (const statement of statements) {
      console.log('Выполняю:', statement.substring(0, 60) + '...');
      await client.unsafe(statement);
    }
    
    console.log('✅ Миграция применена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.end();
  }
}

applyMigration();
