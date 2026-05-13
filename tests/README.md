# 🧪 Тестирование

## Структура тестов

```
tests/
├── unit/                    # Unit тесты
│   ├── GameService.test.ts  # Тесты бизнес-логики
│   └── wordSearch.test.ts   # Тесты генерации поля
├── integration/             # Интеграционные тесты
│   └── gameRouter.test.ts   # Тесты tRPC роутеров
├── e2e/                     # E2E тесты
│   └── game.spec.ts         # Полные сценарии игры
└── README.md                # Эта документация
```

## Запуск тестов

```bash
# Все тесты
npm test

# Unit тесты
npm run test:unit

# Интеграционные тесты
npm run test:integration

# E2E тесты
npm run test:e2e

# С покрытием
npm run test:coverage
```

## Покрытие тестами

### Целевые метрики

| Тип теста | Покрытие |
|-----------|----------|
| Unit | 80%+ |
| Integration | 70%+ |
| E2E | Критические сценарии |

### Текущее покрытие

- ✅ Генерация поля (100%)
- ✅ Валидация слов (95%)
- ✅ GameService (85%)
- ✅ tRPC роутеры (70%)

## Unit тесты

### GameService

Тестирует бизнес-логику без зависимостей:

```typescript
describe('GameService', () => {
  it('должен создать сессию', async () => {
    const mockRepository = createMockRepository();
    const service = new GameService({ repository: mockRepository });
    
    const result = await service.createSession({
      maxPlayers: 4,
      duration: 300,
      gameMode: 'individual',
      onTimeLimit: false,
    });
    
    expect(result.status).toBe('waiting');
  });
});
```

### wordSearch

Тестирует генерацию игрового поля:

```typescript
describe('generateWordSearch', () => {
  it('должен разместить все слова', () => {
    const words = ['ТЕСТ', 'ИГРА'];
    const { grid, placedWords } = generateWordSearch(words);
    
    expect(placedWords.length).toBe(2);
    expect(grid).toHaveLength(10);
  });
});
```

## Интеграционные тесты

### tRPC роутеры

Тестируют взаимодействие с БД через tRPC:

```typescript
describe('gameRouter', () => {
  let caller: any;
  
  beforeAll(async () => {
    const { createCaller } = await import('@/server/trpc/test');
    const context = createContext();
    caller = createCaller(context);
  });
  
  it('должен создать сессию', async () => {
    const result = await caller.game.createSession({
      maxPlayers: 4,
      duration: 300,
      gameMode: 'individual',
      onTimeLimit: false,
    });
    
    expect(result.sessionId).toBeDefined();
  });
});
```

## E2E тесты

Полные сценарии через браузер:

```typescript
test('создание и начало игры', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Создание игры
  await page.click('text=Создать новую игру');
  await page.waitForURL(/\/game\/.+/);
  
  // Проверка загрузки
  await expect(page.locator('.game-board')).toBeVisible();
});
```

## Mock и фикстуры

### Mock репозитория

```typescript
const createMockRepository = (): GameRepository => ({
  createSession: vi.fn(),
  getSession: vi.fn(),
  // ...
});
```

### Фикстуры данных

```typescript
const mockSession: GameSession = {
  id: 'session-123',
  grid: [],
  wordList: ['ТЕСТ'],
  status: 'waiting',
  // ...
};
```

## CI/CD интеграция

Тесты запускаются в CI при каждом push:

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - run: npm ci
    - run: npm test
```

## Best Practices

1. **Изоляция** — каждый тест независим
2. **Mock внешних зависимостей** — БД, API
3. **Тестирование ошибок** — не только happy path
4. **Читаемость** — понятные имена тестов
5. **Покрытие** — 70%+ для продакшена

## Тестирование UI компонентов

### React Testing Library

```typescript
import { render, screen } from '@testing-library/react';

describe('GameBoard', () => {
  it('должен отобразить сетку', () => {
    render(<GameBoard grid={mockGrid} foundWords={new Set()} />);
    
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
});
```

### Framer Motion тесты

```typescript
import { motion } from 'framer-motion';

describe('animated components', () => {
  it('должен анимировать элементы', async () => {
    const { container } = render(<Confetti />);
    
    // Проверка анимации
    expect(container.firstChild).toHaveStyle('animation-duration: 3s');
  });
});
```
