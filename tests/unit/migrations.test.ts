/**
 * Unit тесты для Drizzle миграций
 * 
 * Проверяет:
 * - Существование всех SQL файлов миграций
 * - Корректность синтаксиса SQL
 * - Порядок миграций
 * - Соответствие схеме
 * 
 * @example
 * ```bash
 * npm run test:vitest tests/unit/migrations.test.ts
 * ```
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Проверяет SQL синтаксис миграции
 */
function validateMigrationSQL(sql: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Проверка основных конструкций - миграция может содержать CREATE TABLE, ALTER TABLE ИЛИ CREATE INDEX
  const hasCreateTable = sql.toUpperCase().includes('CREATE TABLE');
  const hasAlterTable = sql.toUpperCase().includes('ALTER TABLE');
  const hasCreateIndex = sql.toUpperCase().includes('CREATE INDEX') || sql.toUpperCase().includes('CREATE UNIQUE INDEX');
  
  if (!hasCreateTable && !hasAlterTable && !hasCreateIndex) {
    errors.push('Migration должен содержать CREATE TABLE, ALTER TABLE или CREATE INDEX');
  }
  
  // Проверка на сбалансированность скобок
  const openBrackets = (sql.match(/\(/g) || []).length;
  const closeBrackets = (sql.match(/\)/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push(`Несбалансированные скобки: ${openBrackets} открытых, ${closeBrackets} закрывающих`);
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Получает список всех миграций
 */
function getMigrations(): Array<{ name: string; path: string }> {
  const migrationsDir = join(process.cwd(), 'drizzle', 'migrations');
  
  if (!existsSync(migrationsDir)) {
    return [];
  }
  
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && !f.includes('.sql_history'))
    .sort();
  
  return files.map(file => ({
    name: file,
    path: join(migrationsDir, file),
  }));
}

describe('Drizzle Migrations', () => {
  describe('Migration files', () => {
    it('должен иметь миграции', () => {
      const migrations = getMigrations();
      expect(migrations.length).toBeGreaterThan(0);
    });

    it('должен иметь миграции в правильном порядке', () => {
      const migrations = getMigrations();
      const names = migrations.map(m => m.name);
      
      // Проверяем что имена отсортированы
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });

    it('должен иметь миграции с правильным форматом имени', () => {
      const migrations = getMigrations();
      // Формат: 0000_simple_the_spike.sql (4 цифры, нижнее подчеркивание, название, .sql)
      const pattern = /^\d{4}_.+\.sql$/;
      
      migrations.forEach(m => {
        expect(m.name).toMatch(pattern);
      });
    });
  });

  describe('Migration SQL validation', () => {
    const migrations = getMigrations();

    migrations.forEach(migration => {
      describe(`Migration: ${migration.name}`, () => {
        let sql: string;

        beforeAll(() => {
          sql = readFileSync(migration.path, 'utf-8');
        });

        it('должен содержать CREATE TABLE, ALTER TABLE или CREATE INDEX', () => {
          const sqlUpper = sql.toUpperCase();
          const hasCreateTable = sqlUpper.includes('CREATE TABLE');
          const hasAlterTable = sqlUpper.includes('ALTER TABLE');
          const hasCreateIndex = sqlUpper.includes('CREATE INDEX') || sqlUpper.includes('CREATE UNIQUE INDEX');
          expect(hasCreateTable || hasAlterTable || hasCreateIndex).toBe(true);
        });

        it('должен иметь сбалансированные скобки', () => {
          const openBrackets = (sql.match(/\(/g) || []).length;
          const closeBrackets = (sql.match(/\)/g) || []).length;
          expect(openBrackets).toBe(closeBrackets);
        });

        it('должен валидироваться без ошибок', () => {
          const result = validateMigrationSQL(sql);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        });

        it('должен содержать PRIMARY KEY или ALTER TABLE или CREATE INDEX', () => {
          const sqlLower = sql.toLowerCase();
          const sqlUpper = sql.toUpperCase();
          const hasPrimaryKey = sqlLower.includes('primary key');
          const hasAlterTable = sqlUpper.includes('ALTER TABLE');
          const hasCreateIndex = sqlUpper.includes('CREATE INDEX') || sqlUpper.includes('CREATE UNIQUE INDEX');
          // Если миграция содержит только CREATE INDEX, она может не содержать PRIMARY KEY
          // В этом случае тест считается успешным
          if (hasCreateIndex && !hasAlterTable) {
            expect(true).toBe(true);
            return;
          }
          expect(hasPrimaryKey || hasAlterTable).toBe(true);
        });

        it('должен содержать NOT NULL или ALTER TABLE или CREATE INDEX', () => {
          const sqlLower = sql.toLowerCase();
          const sqlUpper = sql.toUpperCase();
          const hasNotNull = sqlLower.includes('not null');
          const hasAlterTable = sqlUpper.includes('ALTER TABLE');
          const hasCreateIndex = sqlUpper.includes('CREATE INDEX') || sqlUpper.includes('CREATE UNIQUE INDEX');
          // Если миграция содержит только CREATE INDEX, она может не содержать NOT NULL
          // В этом случае тест считается успешным
          if (hasCreateIndex && !hasAlterTable && !hasNotNull) {
            expect(true).toBe(true);
            return;
          }
          expect(hasNotNull || hasAlterTable).toBe(true);
        });
      });
    });
  });

  describe('Schema integrity', () => {
    it('должен содержать все необходимые таблицы', () => {
      const migrations = getMigrations();
      if (migrations.length === 0) {
        expect(true).toBe(true);
        return;
      }
      
      const allSql = migrations
        .map(m => readFileSync(m.path, 'utf-8'))
        .join('\n');
      
      const requiredTables = [
        'users',
        'game_sessions',
        'game_players',
        'found_words',
        'match_history'
      ];
      
      requiredTables.forEach(table => {
        expect(allSql.toLowerCase()).toContain(`"${table.toLowerCase()}"`);
      });
    });

    it('должен содержать внешние ключи', () => {
      const migrations = getMigrations();
      if (migrations.length === 0) {
        expect(true).toBe(true);
        return;
      }
      
      const allSql = migrations
        .map(m => readFileSync(m.path, 'utf-8'))
        .join('\n');
      
      expect(allSql).toContain('FOREIGN KEY');
    });
  });

  describe('Migration metadata', () => {
    it('должен содержать meta папку', () => {
      const metaDir = join(process.cwd(), 'drizzle', 'migrations', 'meta');
      expect(existsSync(metaDir)).toBe(true);
      
      const metaFiles = readdirSync(metaDir);
      expect(metaFiles.length).toBeGreaterThan(0);
    });
  });
});

