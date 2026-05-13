/**
 * Jest setup файл
 */

import { beforeAll, afterAll } from '@jest/globals';

// Глобальные настройки для тестов
beforeAll(() => {
  // Увеличиваем таймаут для всех тестов
  jest.setTimeout(10000);
});

afterAll(() => {
  // Очистка после всех тестов
});

// Мок для console.error чтобы не засорять вывод тестов
global.console.error = jest.fn();
global.console.warn = jest.fn();
