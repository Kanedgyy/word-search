/**
 * Тесты для логики бота
 */

import { 
  findAllWords, 
  createBot, 
  calculateBotDelay, 
  willBotMakeMistake,
  BOT_PRESETS 
} from '../lib/bot';

describe('Логика бота', () => {
  const testGrid = [
    ['Т', 'Е', 'С', 'Т', 'А', 'Б', 'В', 'Г', 'Д', 'Е'],
    ['К', 'О', 'Д', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х'],
    ['Ф', 'У', 'Н', 'К', 'Ц', 'И', 'Я', 'Ы', 'Ь', 'Ъ'],
    ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И'],
    ['К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У'],
    ['Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э'],
    ['Ю', 'Я', 'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж'],
    ['З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р'],
    ['С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ'],
    ['Ы', 'Ь', 'Э', 'Ю', 'Я', 'А', 'Б', 'В', 'Г', 'Д'],
  ];

  test('должен находить все слова в сетке', () => {
    const words = ['ТЕСТ', 'КОД'];
    const found = findAllWords(testGrid, words);
    
    expect(found.length).toBeGreaterThan(0);
    expect(found.some(f => f.word === 'ТЕСТ')).toBe(true);
  });

  test('должен находить слова горизонтально', () => {
    const words = ['ТЕСТ'];
    const found = findAllWords(testGrid, words);
    
    const horizontal = found.find(f => f.word === 'ТЕСТ' && f.direction === 'horizontal');
    expect(horizontal).toBeDefined();
  });

  test('должен находить слова вертикально', () => {
    const words = ['ТКФ'];
    const found = findAllWords(testGrid, words);
    
    const vertical = found.find(f => f.word === 'ТКФ' && f.direction === 'vertical');
    expect(vertical).toBeDefined();
  });

  test('должен создавать бота с конфигурацией', () => {
    const bot = createBot({
      name: 'Тест-Бот',
      averageSpeed: 10,
      errorRate: 0.2,
      difficulty: 'medium',
    });
    
    expect(bot.name).toBe('Тест-Бот');
    expect(bot.averageSpeed).toBe(10);
    expect(bot.errorRate).toBe(0.2);
  });

  test('должен иметь предустановленные конфигурации', () => {
    expect(BOT_PRESETS.easy.difficulty).toBe('easy');
    expect(BOT_PRESETS.medium.difficulty).toBe('medium');
    expect(BOT_PRESETS.hard.difficulty).toBe('hard');
    
    expect(BOT_PRESETS.hard.averageSpeed).toBeLessThan(BOT_PRESETS.easy.averageSpeed);
  });

  test('должен вычислять задержку бота', () => {
    const delay1 = calculateBotDelay(10);
    const delay2 = calculateBotDelay(10);
    
    // Задержки должны быть разными из-за случайности
    expect(delay1).toBeGreaterThanOrEqual(7000); // 10 - 30%
    expect(delay1).toBeLessThanOrEqual(13000);   // 10 + 30%
    expect(delay2).toBeGreaterThanOrEqual(1000);
  });

  test('должен определять ошибку бота', () => {
    // При errorRate = 0 бот не должен ошибаться
    const noError = willBotMakeMistake(0);
    expect(noError).toBe(false);
    
    // При errorRate = 1 бот всегда ошибается
    const alwaysError = willBotMakeMistake(1);
    expect(alwaysError).toBe(true);
  });

  test('должен обрабатывать пустой список слов', () => {
    const found = findAllWords(testGrid, []);
    expect(found).toHaveLength(0);
  });

  test('должен обрабатывать слова, которых нет в сетке', () => {
    const words = ['НЕСУЩЕСТВУЮЩЕЕ'];
    const found = findAllWords(testGrid, words);
    expect(found).toHaveLength(0);
  });
});
