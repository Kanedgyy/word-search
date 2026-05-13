# 🏗️ Архитектура проекта

## Обзор

Проект построен по принципам **Clean Architecture** с чётким разделением на слои:

```
┌─────────────────────────────────────────────────┐
│              Presentation Layer                  │
│  (React Components, tRPC Routers, UI)           │
├─────────────────────────────────────────────────┤
│              Application Layer                   │
│  (Use Cases, GameService)                       │
├─────────────────────────────────────────────────┤
│                Domain Layer                      │
│  (Entities, Types, Business Rules)              │
├─────────────────────────────────────────────────┤
│             Infrastructure Layer                 │
│  (Drizzle, WebSocket, External APIs)            │
└─────────────────────────────────────────────────┘
```

## Структура каталогов

```
word-search-multiplayer/
├── core/                        # Domain Layer (не зависит от фреймворков)
│   └── game/
│       ├── GameService.ts       # Бизнес-логика
│       ├── GameRepository.ts    # Интерфейс репозитория
│       ├── GameErrors.ts        # Кастомные ошибки
│       └── types.ts             # Доменные типы
│
├── infrastructure/              # Infrastructure Layer
│   ├── drizzle/
│   │   └── GameRepositoryImpl.ts   # Drizzle реализация
│   └── websocket/
│       └── server.ts             # WebSocket сервер
│
├── presentation/                # Presentation Layer
│   ├── trpc/
│   │   ├── gameRouter.ts        # tRPC роутер
│   │   └── trpc.ts              # tRPC конфигурация
│   └── components/
│       ├── GameBoard.tsx        # UI компоненты
│       ├── WordList.tsx
│       └── Confetti.tsx
│
├── app/                         # Next.js App Router
│   ├── api/                     # API Routes
│   ├── game/                    # Страницы игры
│   ├── auth/                    # Страницы аутентификации
│   └── page.tsx                 # Главная страница
│
├── lib/                         # Утилиты и конфигурация
│   ├── auth/                    # Better Auth
│   ├── db.ts                    # Drizzle подключение
│   └── trpc-client.ts           # tRPC клиент
│
└── tests/                       # Тесты
    ├── unit/                    # Unit тесты
    ├── integration/             # Интеграционные тесты
    └── e2e/                     # E2E тесты
```

## Слои архитектуры

### 1. Domain Layer (`core/`)

**Чистая бизнес-логика**, не зависит от фреймворков, БД или UI.

**GameService:**
```typescript
class GameService {
  async createSession(input: CreateSessionInput): Promise<GameSession>
  async joinSession(input: JoinSessionInput): Promise<JoinResult>
  async startGame(sessionId: string): Promise<GameSession>
  async submitWord(input: SubmitWordInput): Promise<WordResult>
}
```

**GameRepository (интерфейс):**
```typescript
interface GameRepository {
  createSession(session: Omit<GameSession, 'id'>): Promise<GameSession>
  getSession(sessionId: string): Promise<GameSession | null>
  addPlayer(sessionId: string, player: Omit<Player, 'id'>): Promise<Player>
  // ...
}
```

**Преимущества:**
- Легко тестировать (mock репозитория)
- Не зависит от Next.js, Drizzle, React
- Можно заменить реализацию без изменения бизнес-логики

---

### 2. Infrastructure Layer (`infrastructure/`)

**Реализации технологий**: Drizzle, WebSocket, внешние API.

**GameRepositoryImpl (Drizzle):**
```typescript
class GameRepositoryImpl implements GameRepository {
  async createSession(session: Omit<GameSession, 'id'>): Promise<GameSession> {
    const [result] = await db
      .insert(gameSessions)
      .values({ ...session })
      .returning();
    return result;
  }
}
```

**WebSocket Server:**
```typescript
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (message: WSMessage) => {
    handleWebSocketMessage(message);
  });
});
```

---

### 3. Presentation Layer (`presentation/`, `components/`)

**tRPC Routers и React компоненты.**

**gameRouter:**
```typescript
const gameRouter = createTRPCRouter({
  createSession: publicProcedure
    .input(createSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new GameService({ repository: ctx.gameRepository });
      return await service.createSession(input);
    }),
  
  submitWord: publicProcedure
    .input(submitWordSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new GameService({ repository: ctx.gameRepository });
      return await service.submitWord(input);
    }),
});
```

**React Components:**
```typescript
function GameBoard({ grid, foundWords }: GameBoardProps) {
  const [selectedPath, setSelectedPath] = useState<Coordinate[]>([]);
  
  const handleWordSelect = async (word: string, path: Coordinate[]) => {
    await trpc.game.submitWord.mutate({
      sessionId,
      playerId,
      word,
      // ...
    });
  };
  
  return <div className="game-board">...</div>;
}
```

---

## Dependency Injection

**Контейнер DI** в `server/trpc/trpc.ts`:

```typescript
const createContext = async (opts: CreateContextOptions) => {
  const gameRepository = new GameRepositoryImpl();
  
  return {
    db: opts.db,
    userId: opts.userId,
    gameRepository,  // Передаётся в роутеры
  };
};
```

**Использование в роутерах:**
```typescript
const gameRouter = createTRPCRouter({
  createSession: publicProcedure.mutation(async ({ ctx }) => {
    const service = new GameService({ repository: ctx.gameRepository });
    return await service.createSession(input);
  }),
});
```

**Преимущества:**
- Легко подменить репозиторий на mock для тестов
- Централизованная конфигурация
- Явные зависимости

---

## Flow: Создание игры

```
1. Пользователь нажимает "Создать игру"
   ↓
2. Client → trpc.game.createSession.mutate()
   ↓
3. tRPC Router получает контекст с GameRepositoryImpl
   ↓
4. GameService.createSession()
   ↓
5. GameRepositoryImpl.createSession() → Drizzle INSERT
   ↓
6. Возврат GameSession клиенту
   ↓
7. Переход на страницу игры
```

**Sequence Diagram:**
```
┌──────────┐     ┌─────────┐     ┌───────────┐     ┌──────────────┐
│  Client  │     │ tRPC    │     │GameService│     │   Repository │
└────┬─────┘     └────┬────┘     └────┬──────┘     └──────┬───────┘
     │                │                │                   │
     │ mutate()       │                │                   │
     │───────────────>│                │                   │
     │                │                │                   │
     │                │ createSession()│                   │
     │                │───────────────>│                   │
     │                │                │                   │
     │                │                │  INSERT INTO db   │
     │                │                │──────────────────>│
     │                │                │                   │
     │                │                │  GameSession      │
     │                │                │<──────────────────│
     │                │                │                   │
     │                │  GameSession   │                   │
     │                │<───────────────│                   │
     │                │                │                   │
     │  GameSession   │                │                   │
     │<───────────────│                │                   │
     │                │                │                   │
```

---

## Flow: Отправка слова

```
1. Игрок выделяет слово на поле
   ↓
2. Client → trpc.game.submitWord.mutate()
   ↓
3. tRPC Router → GameService.submitWord()
   ↓
4. Проверка: слово в списке?
   ↓
5. Проверка: слово уже найдено?
   ↓
6. GameRepository.addFoundWord() → Drizzle INSERT
   ↓
7. GameRepository.updatePlayer() → Drizzle UPDATE
   ↓
8. WebSocket → всем игрокам: word_found
   ↓
9. Возврат результата клиенту
```

---

## Состояние игры

**Источники истины:**

1. **База данных** — основное хранилище
2. **Redis** (опционально) — кэш состояния
3. **WebSocket** — real-time синхронизация
4. **Client state** — локальное отображение

**Синхронизация:**
- Polling каждые 2 секунды (`refetchInterval: 2000`)
- WebSocket для мгновенных обновлений
- Optimistic updates для отзывчивости

---

## Обработка ошибок

**Иерархия ошибок:**

```typescript
class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
  }
}

class SessionNotFoundError extends AppError {
  constructor() {
    super('SESSION_NOT_FOUND', 'Сессия не найдена', 404);
  }
}
```

**Глобальный обработчик:**
```typescript
// server/trpc/trpc.ts
export const appRouter = createTRPCRouter({
  // ...
}).middleware(async ({ ctx, next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof AppError) {
      throw TRPCError.fromAppError(error);
    }
    throw error;
  }
});
```

---

## Масштабирование

**Горизонтальное масштабирование:**

1. **Stateless роутеры** — tRPC роутеры не хранят состояние
2. **Shared database** — PostgreSQL для общего состояния
3. **WebSocket clustering** — Redis Pub/Sub для синхронизации
4. **Load balancing** — Vercel Edge Functions

**Оптимизация:**
- **Debouncing** — для частых запросов
- **Caching** — Redis для горячих данных
- **Pagination** — для истории матчей
- **Lazy loading** — для больших списков

---

## Безопасность

**Аутентификация:**
- Better Auth с JWT tokens
- Session validation на каждом запросе
- OAuth (GitHub, Google)

**Авторизация:**
- Middleware для проверки прав
- Только хост может запускать игру
- Только владелец может удалять данные

**Валидация:**
- Zod схемы на всех входах
- Санитизация пользовательского ввода
- Rate limiting на API

---

## Тестирование

**Unit тесты** (Vitest):
```typescript
const mockRepository = createMockRepository();
const service = new GameService({ repository: mockRepository });

await service.createSession(input);
expect(mockRepository.createSession).toHaveBeenCalled();
```

**Интеграционные тесты** (Jest):
```typescript
const caller = createCaller(context);
const result = await caller.game.createSession(input);
expect(result.sessionId).toBeDefined();
```

**E2E тесты** (Playwright):
```typescript
await page.click('text=Создать игру');
await page.waitForURL(/\/game\/.+/);
```

---

## Производительность

**Метрики:**
- **TTFB** < 200ms
- **First Paint** < 1s
- **Time to Interactive** < 3s

**Оптимизации:**
- **Turbopack** — быстрый bundler
- **Image optimization** — Next.js Image
- **Code splitting** — динамические импорты
- **Streaming** — React Server Components

---

## Мониторинг

**Логирование:**
- `console.log` для разработки
- Winston/Pino для production
- Sentry для ошибок

**Метрики:**
- Game duration
- Words per game
- Player retention
- Error rates
