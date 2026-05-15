# Руководство по тестированию

## 📊 Покрытие тестами

### Текущее состояние

| Тип тестов | Фреймворк | Файлы | Охват |
|------------|-----------|-------|-------|
| **Unit** | Vitest | `tests/unit/` | GameService (15 тестов), wordSearch (9 тестов) |
| **Integration** | Jest | `tests/integration/` | tRPC роутеры (8 тестов) |
| **E2E** | Playwright | `tests/e2e/` | Основные сценарии (3 теста) |
| **Auth** | Vitest | `tests/unit/auth.test.ts` | Базовые тесты (5 тестов) |

### Целевое покрытие

- **Unit тесты**: >80% бизнес-логики (GameService, wordSearch)
- **Интеграционные**: Все критические API endpoints
- **E2E**: Основные пользовательские сценарии (login, create game, play, finish)

---

## 🧪 Запуск тестов

### Все тесты

```bash
npm test
```

### Unit тесты (Vitest)

```bash
# Все unit тесты
npm run test:vitest

# Конкретный файл
npm run test:vitest tests/unit/GameService.test.ts

# Watch mode
npm run test:vitest:watch
```

### Интеграционные тесты

```bash
# Все интеграционные тесты
npm run test:integration

# Конкретный файл
npm run test:integration tests/integration/gameRouter.test.ts
```

### E2E тесты

```bash
# Все E2E тесты
npm run test:e2e

# В headed mode (с браузером)
npm run test:e2e:headed

# Конкретный файл
npm run test:e2e tests/e2e/game.spec.ts
```

---

## 📁 Структура тестов

```
tests/
├── unit/                          # Unit тесты (быстрые, без БД)
│   ├── GameService.test.ts        # Бизнес-логика игры (15 тестов)
│   ├── wordSearch.test.ts         # Генерация поля (9 тестов)
│   └── auth.test.ts               # Аутентификация (5 тестов)
├── integration/                   # Интеграционные тесты (с БД)
│   └── gameRouter.test.ts         # tRPC endpoints (8 тестов)
├── e2e/                           # E2E тесты (полные сценарии)
│   └── game.spec.ts               # Пользовательские сценарии (3 теста)
├── setup.ts                       # Глобальная настройка тестов
└── README.md                      # Это руководство
```

---

## 📝 Написание тестов

### Unit тесты (Vitest)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameService } from '@/core/game/GameService';

describe('GameService', () => {
  let mockRepository: GameRepository;
  let gameService: GameService;

  beforeEach(() => {
    // Создаём mock репозитория
    mockRepository = {
      createSession: vi.fn(),
      getSession: vi.fn(),
      // ... другие методы
    };
    gameService = new GameService({ repository: mockRepository });
  });

  it('должен создать сессию с корректными параметрами', async () => {
    // Arrange
    const mockSession = { id: '1', /* ... */ };
    vi.mocked(mockRepository.createSession).mockResolvedValue(mockSession);

    // Act
    const result = await gameService.createSession({
      maxPlayers: 4,
      duration: 300,
      gameMode: 'individual',
      onTimeLimit: false,
    });

    // Assert
    expect(result.id).toBe('1');
    expect(mockRepository.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ maxPlayers: 4 })
    );
  });
});
```

### Интеграционные тесты (Jest)

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import { db } from '../../lib/db';
import { createCaller } from '../../server/trpc/test';

describe('gameRouter', () => {
  let caller: any;

  beforeAll(async () => {
    // Настраиваем реальный tRPC вызыватель
    caller = createCaller({ db });
  });

  it('should create a new session', async () => {
    const result = await caller.game.createSession({
      maxPlayers: 4,
      duration: 300,
      gameMode: 'individual',
      onTimeLimit: false,
    });

    expect(result.sessionId).toBeDefined();
    expect(result.grid).toHaveLength(10);
  });
});
```

### E2E тесты (Playwright)

```typescript
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
});
```

---

## ✅ Best Practices

### 1. AAA паттерн (Arrange-Act-Assert)

```typescript
it('должен проверить сценарий', async () => {
  // Arrange - подготовка
  const mockData = { /* ... */ };
  vi.mocked(repository.method).mockResolvedValue(mockData);

  // Act - выполнение действия
  const result = await service.method(input);

  // Assert - проверка результата
  expect(result).toBe(expected);
});
```

### 2. Имена тестов

Используйте описательные имена на русском или английском:

```typescript
// ✅ Хорошо
it('должен выбросить ошибку если сессия не найдена')
it('should throw error when session not found')

// ❌ Плохо
it('тест 1')
it('test session')
```

### 3. Изоляция тестов

Каждый тест должен быть независимым:

```typescript
beforeEach(() => {
  vi.resetAllMocks(); // Очищаем все mocks перед каждым тестом
});
```

### 4. Тестирование ошибок

```typescript
it('должен выбросить ошибку если duration < 60', async () => {
  await expect(
    gameService.createSession({
      maxPlayers: 4,
      duration: 30, // Слишком мало
      gameMode: 'individual',
      onTimeLimit: false,
    })
  ).rejects.toThrow(AppError);
});
```

---

## 🐛 Отладка тестов

### Запуск с verbose выводом

```bash
npm run test:vitest -- --reporter=verbose
```

### Запуск одного теста

```bash
npm run test:vitest -- -t "должен создать сессию"
```

### Watch mode с интерактивным управлением

```bash
npm run test:vitest:watch
```

В watch mode можно:
- Нажать `p` - фильтровать по имени файла
- Нажать `t` - фильтровать по имени теста
- Нажать `u` - обновить snapshot

---

## 📈 CI/CD интеграция

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: word_search_test
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/word_search_test
          BETTER_AUTH_SECRET: test-secret-key-min-32-characters
```

---

## 🎯 Планы по улучшению

### Приоритет 1 (критичный)

- [ ] Добавить тесты для WebSocket маршрутов
- [ ] Покрытие тестами Drizzle миграций
- [ ] Интеграционные тесты для auth endpoints

### Приоритет 2 (важный)

- [ ] E2E тесты для командного режима
- [ ] Тесты для ботов (GameBot)
- [ ] Тесты на обработку ошибок (edge cases)

### Приоритет 3 (желательный)

- [ ] Performance тесты для генерации поля
- [ ] Load тесты для tRPC endpoints
- [ ] Visual regression тесты для UI

---

## 📚 Ресурсы

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
