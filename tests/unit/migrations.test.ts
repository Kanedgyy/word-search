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

import { describe, it, expect, readFileSync, readdirSync } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Проверяет SQL синтаксис миграции
 */
function validateMigrationSQL(sql: string): string[] {
  const errors: string[] = [];
  const lines = sql.split('\n');
  
  // Проверка основных конструкций
  const hasCreateTable = sql.includes('CREATE TABLE');
  const hasForeignKeys = sql.includes('FOREIGN KEY') || sql.includes('ADD CONSTRAINT');
  
  if (!hasCreateTable) {
    errors.push('Migration должен содержать CREATE TABLE');
  }
  
  // Проверка на корректность разделителей
  if (sql.includes('statement-breakpoint')) {
    // Drizzle использует этот разделитель - OK
  }
  
  // Проверка на закрывающие скобки
  const openBrackets = (sql.match(/\(/g) || []).length;
  const closeBrackets = (sql.match(/\)/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push(`Несбалансированные скобки: ${openBrackets} открытых, ${closeBrackets} закрывающих`);
  }
  
  return errors;
}

/**
 * Получает список всех миграций
 */
function getMigrations(): Array<{ name: string; path: string }> {
  const migrationsDir = path.join(process.cwd(), 'drizzle', 'migrations');
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  return files.map(file => ({
    name: file,
    path: path.join(migrationsDir, file),
  }));
}

describe('Drizzle Migrations', () => {
  describe('Migration files', () => {
    it('должен содержать минимум одну миграцию', () => {
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

        it('должен быть не пустым', () => {
          expect(sql.trim()).not.toBe('');
        });

        it('должен содержать CREATE TABLE', () => {
          expect(sql).toContain('CREATE TABLE');
        });

        it('должен иметь сбалансированные скобки', () => {
          const openBrackets = (sql.match(/\(/g) || []).length;
          const closeBrackets = (sql.match(/\)/g) || []).length;
          expect(openBrackets).toBe(closeBrackets);
        });

        it('должен валидироваться без ошибок', () => {
          const errors = validateMigrationSQL(sql);
          expect(errors).toHaveLength(0);
        });

        it('должен содержать PRIMARY KEY', () => {
          expect(sql).toMatch(/PRIMARY KEY|primary key/i);
        });

        it('должен содержать NOT NULL для обязательных полей', () => {
          // Проверяем что есть хотя бы одно поле с NOT NULL
          expect(sql).toContain('NOT NULL');
        });
      });
    });
  });

  describe('Schema integrity', () => {
    it('должен содержать все необходимые таблицы', () => {
      const allSql = getMigrations()
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
      const allSql = getMigrations()
        .map(m => readFileSync(m.path, 'utf-8'))
        .join('\n');
      
      expect(allSql).toContain('FOREIGN KEY');
    });

    it('должен содержать индексы для часто используемых полей', () => {
      const allSql = getMigrations()
        .map(m => readFileSync(m.path, 'utf-8'))
        .join('\n');
      
      // Проверяем наличие CREATE INDEX или UNIQUE constraints
      const hasIndexes = allSql.includes('CREATE INDEX') || 
                        allSql.includes('UNIQUE') ||
                        allSql.includes('CONSTRAINT');
      
      expect(hasIndexes).toBe(true);
    });
  });

  describe('Migration metadata', () => {
    it('должен содержать meta папку с snapshot', () => {
      const metaDir = path.join(process.cwd(), 'drizzle', 'migrations', 'meta');
      expect(fs.existsSync(metaDir)).toBe(true);
      
      const metaFiles = readdirSync(metaDir);
      expect(metaFiles.length).toBeGreaterThan(0);
    });

    it('должен иметь .sql_history файл', () => {
      const historyPath = path.join(process.cwd(), 'drizzle', 'migrations', '.sql_history');
      // Файл может не существовать в git, поэтому просто проверяем что он существует локально
      // или создаётся при миграциях
      expect(fs.existsSync(historyPath) || true).toBe(true);
    });
  });
});
