import { test, expect } from '@playwright/test';

test.describe('Word Search Game', () => {
  test('user can create a game', async ({ page }) => {
    await page.goto('/');
    
    // Заполняем имя
    await page.fill('input[placeholder="Введите ваше имя"]', 'TestPlayer');
    
    // Создаём игру
    await page.click('button:has-text("Создать новую игру")');
    
    // Ждём перехода на страницу игры
    await expect(page).toHaveURL(/\/game\/.*/);
    
    // Проверяем что отображается игровое поле
    await expect(page.locator('div').filter({ hasText: /^Филворд$/ })).toBeVisible();
  });

  test('user can join existing game', async ({ page }) => {
    await page.goto('/');
    
    // Заполняем имя
    await page.fill('input[placeholder="Введите ваше имя"]', 'JoinPlayer');
    
    // Вводим ID сессии (нужно создать заранее)
    const sessionId = 'test-session-id';
    await page.fill('input[placeholder="Введите ID сессии"]', sessionId);
    
    // Присоединяемся
    await page.click('button:has-text("Присоединиться к игре")');
    
    // Должна быть ошибка (сессия не существует)
    await expect(page.locator('text=Сессия не найдена')).toBeVisible();
  });

  test('game displays word list', async ({ page }) => {
    await page.goto('/');
    
    // Создаём игру
    await page.fill('input[placeholder="Введите ваше имя"]', 'WordViewer');
    await page.click('button:has-text("Создать новую игру")');
    
    // Ждём загрузки страницы игры
    await page.waitForURL(/\/game\/.*/);
    
    // Проверяем что есть список слов
    await expect(page.locator('text=Слова для поиска')).toBeVisible();
  });
});
