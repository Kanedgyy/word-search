/**
 * Vitest setup файл
 */

import { vi, beforeAll, afterAll } from 'vitest';

// Глобальные настройки для тестов
beforeAll(() => {
  // Увеличиваем таймаут для всех тестов
  vi.setConfig({ testTimeout: 10000 });
});

afterAll(() => {
  // Очистка после всех тестов
});

// Мок для console.error чтобы не засорять вывод тестов
global.console.error = vi.fn();
global.console.warn = vi.fn();
