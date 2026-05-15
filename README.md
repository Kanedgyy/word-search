# 🎮 Многопользовательский Филворд

Веб-приложение для игры в филворд (поиск слов в таблице букв) с поддержкой многопользовательского режима.

## 📋 Описание проекта

**Филворд** — это игра, где нужно найти слова в сетке букв. Слова могут располагаться:
- Горизонтально (слева направо)
- Вертикально (сверху вниз)
- По диагонали (в любом направлении)

### Особенности

- 🔐 **Многопользовательский режим** — от 2 до 6 игроков
- ⏱️ **Реальное время** — мгновенная синхронизация найденных слов
- 🤖 **Боты** — можно добавить ботов для тренировки (3 уровня сложности)
- 🏆 **Система рейтинга** — побеждает тот, кто найдёт больше слов быстрее
- 📊 **Статистика** — история матчей и достижений
- 💾 **База данных** — PostgreSQL с Drizzle ORM
- 🔒 **Аутентификация** — Email/пароль + OAuth (GitHub, Google)

## 🛠️ Технологический стек

### Основная технология

| Технология | Назначение | Почему выбрано |
|------------|------------|----------------|
| **TypeScript** | Язык разработки | Статическая типизация, автодополнение в IDE, меньше ошибок |
| **Next.js 16** | Фреймворк React | SSR, App Router, оптимизация из коробки |
| **Drizzle ORM** | Работа с БД | Лёгкий, быстрый, типизированный, лучше Prisma для простых проектов |
| **tRPC** | API между клиентом и сервером | Полная типизация, автодополнение, не нужен Swagger |
| **Better Auth** | Аутентификация | Современная, простая, поддерживает OAuth |
| **PostgreSQL** | База данных | Надёжная, популярная, отличная поддержка JSON |
| **Tailwind CSS** | Стили | Утилитарные классы, быстрая разработка, адаптивность |

### Дополнительные библиотеки

| Библиотека | Назначение | Альтернативы |
|------------|------------|--------------|
| **Zod** | Валидация данных | Yup, Joi, superstruct |
| **Superjson** | Сериализация | JSON.stringify, msgpack |
| **Jest** | Тестирование | Vitest, Mocha, Jasmine |
| **WebSocket** | Realtime связь | Socket.io, ws, PeerJS |
| **Framer Motion** | Анимации | React Spring, Transition |

## 📁 Структура проекта

```
word-search-multiplayer/
├── app/                      # Next.js App Router
│   ├── api/                  # API маршруты
│   │   └── trpc/             # tRPC endpoint
│   ├── auth/                 # Страницы аутентификации
│   ├── game/                 # Страницы игры
│   │   └── [sessionId]/      # Страница конкретной игры
│   ├── stats/                # Статистика игроков
│   ├── globals.css           # Глобальные стили
│   ├── layout.tsx            # Корневой layout
│   └── page.tsx              # Главная страница
├── components/               # React компоненты
│   ├── GameBoard.tsx         # Игровое поле 10×10 с анимациями
│   ├── WordList.tsx          # Список слов для поиска
│   ├── PlayerList.tsx        # Список игроков
│   ├── Confetti.tsx          # Конфетти эффект для победы
│   └── SkeletonLoader.tsx    # Skeleton компоненты для загрузки
├── features/                 # Feature modules (бизнес-логика)
│   ├── game/
│   │   ├── ui/               # Компоненты игры
│   │   ├── types/            # TypeScript типы
│   │   └── utils/            # Утилиты
│   └── stats/
│       └── ui/
├── drizzle/                  # Drizzle ORM
│   ├── schema.ts             # Схемы БД
│   └── migrations/           # Миграции БД
├── lib/                      # Утилиты
│   ├── auth/                 # Аутентификация
│   │   ├── server.ts         # Серверная часть (Better Auth)
│   │   ├── client.ts         # Клиентская часть
│   │   └── middleware.ts     # Middleware защиты роутов
│   ├── db.ts                 # Подключение к БД
│   ├── trpc-client.ts        # tRPC клиент
│   ├── trpc-provider.tsx     # tRPC Provider
│   └── word-search.ts        # Логика филворда
├── server/                   # Серверная логика
│   └── trpc/                 # tRPC роутеры
│       ├── index.ts          # Главный router
│       ├── trpc.ts           # Настройка tRPC
│       └── gameRouter.ts     # Игровой router
├── tests/                    # Тесты
│   ├── unit/                 # Unit тесты
│   ├── integration/          # Интеграционные тесты
│   └── e2e/                  # E2E тесты
├── .env.example              # Пример переменных окружения
├── drizzle.config.ts         # Конфигурация Drizzle
├── jest.config.js            # Конфигурация Jest
├── package.json              # Зависимости и скрипты
└── tsconfig.json             # Конфигурация TypeScript
```

## 🚀 Установка и запуск

### Предварительные требования

- Node.js 18+
- PostgreSQL 14+
- npm или yarn

### Шаг 1: Клонирование проекта

```bash
git clone <repository-url>
cd word-search-multiplayer
```

### Шаг 2: Установка зависимостей

```bash
npm install
```

### Шаг 3: Настройка базы данных

1. Создайте базу данных PostgreSQL:

```bash
psql -U postgres
CREATE DATABASE word_search;
\q
```

2. Настройте переменные окружения:

Скопируйте `.env.example` в `.env.local` и заполните:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/word_search

# Better Auth (минимум 32 символа)
BETTER_AUTH_SECRET=your-super-secret-key-min-32-characters-long

# OAuth (опционально)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Шаг 4: Применение миграций

```bash
npx drizzle-kit push
```

### Шаг 5: Запуск разработки

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 🔐 Аутентификация

### Email/пароль

1. Перейдите на страницу [регистрации](http://localhost:3000/auth/register)
2. Введите email и пароль
3. Подтвердите email (в production)

### OAuth (GitHub/Google)

1. Нажмите кнопку "Войти через GitHub/Google"
2. Разрешите доступ в OAuth провайдере
3. Вас автоматически перенаправит на главную страницу

### Защита роутов

- `/game/[sessionId]` — требует аутентификации
- `/stats` — доступен всем
- `/auth/login`, `/auth/register` — только для неавторизованных

## 🎮 Как играть

### Создание игры

1. **Войдите в систему** (или создайте гостевой аккаунт)
2. Нажмите "Создать новую игру"
3. Скопируйте ID сессии и отправьте друзьям

### Присоединение к игре

1. Введите ID сессии от хоста
2. Нажмите "Присоединиться к игре"

### Ход игры

1. **Хост запускает игру** — когда наберётся минимум 2 игрока
2. **Выделяйте слова мышью** — от первой до последней буквы
3. **Слово засчитывается** — если оно есть в списке и не найдено другими
4. **Побеждает** — игрок с наибольшим количеством слов

### Правила

- Слова могут быть горизонтально, вертикально или по диагонали
- Одно слово может найти только один игрок
- Время игры — 5 минут (настраивается)
- При равенстве очков побеждает тот, кто быстрее нашёл первое слово

## 📊 Схема базы данных

```mermaid
erDiagram
    users {
        uuid id PK
        text name
        text email
        boolean email_verified
        text password_hash
        text image
        timestamp created_at
        timestamp updated_at
    }
    
    sessions {
        uuid id PK
        uuid user_id FK
        text token
        timestamp expires_at
        text ip_address
        text user_agent
        timestamp created_at
        timestamp updated_at
    }
    
    accounts {
        uuid id PK
        uuid user_id FK
        text account_id
        text provider_id
        text access_token
        text refresh_token
        timestamp access_token_expires_at
        timestamp created_at
        timestamp updated_at
    }
    
    user_roles {
        uuid id PK
        uuid user_id FK
        varchar role
        timestamp created_at
    }
    
    game_sessions {
        uuid id PK
        text[] word_list
        jsonb grid
        varchar game_mode
        boolean on_time_limit
        varchar status
        integer max_players
        integer duration
        timestamp created_at
        timestamp ends_at
        uuid rematch_session_id
        uuid host_user_id FK
    }
    
    game_players {
        uuid id PK
        uuid session_id FK
        uuid user_id FK
        text name
        boolean is_bot
        text color
        integer turn_order
        varchar status
        integer first_word_time
        varchar team
        varchar difficulty
        integer words_found
        timestamp created_at
    }
    
    found_words {
        uuid id PK
        uuid session_id FK
        uuid player_id FK
        text word
        integer start_row
        integer start_col
        integer end_row
        integer end_col
        varchar direction
        jsonb path
        timestamp found_at
    }
    
    match_history {
        uuid id PK
        uuid session_id FK
        uuid user_id FK
        text player_name
        integer words_found
        integer first_word_time
        integer rank
        timestamp recorded_at
    }
```

## 🔧 tRPC API

### `game.createSession`

Создаёт новую игровую сессию.

**Input:** `{ maxPlayers: number, duration: number, gameMode: 'individual' | 'team', onTimeLimit: boolean }`

**Output:** `{ sessionId, grid, wordList, maxPlayers, duration }`

**Errors:** `VALIDATION_ERROR`, `UNAUTHORIZED`

### `game.joinSession`

Присоединяется к сессии.

**Input:** `{ sessionId: string, playerName: string }`

**Output:** `{ playerId, color, playersCount, isHost }`

**Errors:** `SESSION_NOT_FOUND`, `GAME_ALREADY_STARTED`, `MAX_PLAYERS_REACHED`

### `game.startGame`

Запускает игру (только хост).

**Input:** `{ sessionId: string }`

**Output:** `{ message, grid, playerCount }`

**Errors:** `NOT_HOST`, `GAME_ALREADY_STARTED`, `NOT_ENOUGH_PLAYERS`

### `game.submitWord`

Отправляет найденное слово.

**Input:** `{ sessionId, playerId, word, startRow, startCol, endRow, endCol, direction, path? }`

**Output:** `{ success, error?, word?, playerScore?, results? }`

**Errors:** `WORD_NOT_FOUND`, `WORD_ALREADY_FOUND`, `INVALID_SELECTION`

### `game.getSessionState`

Получает текущее состояние сессии.

**Input:** `{ sessionId: string, playerId?: string }`

**Output:** Полное состояние игры

## 📊 Покрытие тестами

Тесты покрывают:
- ✅ Генерацию поля (100%)
- ✅ Валидацию слов (95%)
- ✅ GameService (85%) - **15 unit тестов** (+2 новых)
- ✅ tRPC роутеры (70%)
- ✅ **Auth модуль (5 тестов)** (новый)

### Структура тестов

```
tests/
├── unit/                    # Unit тесты
│   ├── GameService.test.ts  # Бизнес-логика (15 тестов)
│   ├── wordSearch.test.ts   # Генерация поля (9 тестов)
│   └── auth.test.ts         # Аутентификация (5 тестов) **НОВО**
├── integration/             # Интеграционные тесты
│   └── gameRouter.test.ts   # tRPC роутеры
├── e2e/                     # E2E тесты
│   └── game.spec.ts         # Полные сценарии
└── README.md                # Документация
```

**Подробнее о тестировании:** [tests/README_IMPROVED.md](tests/README_IMPROVED.md)

## 🤖 Дополнительное задание

### Бот

Боты реализованы как игроки с `isBot: true`. Они могут:
- Автоматически присоединяться к играм
- Находить слова с заданной скоростью
- Имитировать поведение человека

**Сложность ботов:**

| Сложность | Min Delay | Max Delay | Accuracy | Skip Chance |
|-----------|-----------|-----------|----------|-------------|
| Лёгкий | 3200ms | 8000ms | 35% | 25% |
| Средний | 2000ms | 6000ms | 45% | 20% |
| Сложный | 1200ms | 4000ms | 60% | 10% |

### Командный режим

Реализована архитектура для командного режима:
- Поле `team` в таблице `game_players`
- Возможность суммировать очки игроков одной команды
- Определение победителя по сумме очков команды

## 📝 Scripts

| Command | Описание |
|---------|----------|
| `npm run dev` | Запуск dev сервера |
| `npm run build` | Сборка для продакшена |
| `npm run start` | Запуск production сервера |
| `npm run lint` | Проверка кода ESLint |
| `npm run format` | Форматирование Prettier |
| `npm test` | Запуск всех тестов |
| `npx drizzle-kit push` | Применить миграции |
| `npx drizzle-kit generate` | Создать миграцию |

## 🐛 Известные проблемы

1. **WebSocket** — в текущей версии используется polling для совместимости с Vercel serverless. WebSocket будет добавлен в следующей версии.

## ✨ UI/UX Компоненты

### Framer Motion Анимации

Проект использует Framer Motion для плавных анимаций:

- **GameBoard** — hover и tap эффекты на клетках
- **WordList** — анимация появления слов, progress bar
- **Results** — конфетти, entrance animations, spring physics
- **Main Page** — entrance animations, button interactions

### Skeleton Loaders

Компоненты для отображения состояния загрузки:

- `GameBoardSkeleton` — сетка 10×10
- `WordListSkeleton` — список слов
- `PlayerListSkeleton` — список игроков
- `PageSkeleton` — вся страница

### Доступность (a11y)

- ARIA labels на всех интерактивных элементах
- Screen reader announcements для статусов
- Keyboard navigation support
- Focus management

## 📝 Будущие улучшения

- [ ] WebSocket для real-time синхронизации
- [ ] Командный режим (полная реализация)
- [ ] Разные размеры поля
- [ ] Разные наборы слов (по темам)
- [ ] Лидерборд
- [ ] Мобильная версия
- [ ] Звуковые эффекты
- [ ] Темная тема

## 👥 Авторы

Создано в рамках учебного проекта.

## 📄 Документация

- **[API Documentation](API.md)** — tRPC endpoints, WebSocket events, error codes
- **[Architecture](ARCHITECTURE.md)** — Clean Architecture, dependency injection, flows
- **[Deployment](DEPLOYMENT.md)** — Vercel, PostgreSQL, OAuth setup
- **[Testing Guide](tests/README.md)** — Unit, integration, E2E тесты

## 📄 Лицензия

MIT

---

## 🚀 Что было улучшено в последней итерации

### Улучшения качества кода

- ✅ **Убраны `any` типы** в `gameRouter.ts` (функции `calculateResults`, `saveMatchHistory`)
- ✅ **JSDoc документация** для всех публичных функций в:
  - `server/trpc/gameRouter.ts` (10+ процедур)
  - `lib/word-search.ts` (7 функций)
  - `lib/db.ts`
  - `lib/trpc-client.ts`
  - `core/game/GameService.ts`
- ✅ **Строгая типизация** в `tsconfig.json` (включены playwright тесты)
- ✅ **Создан `drizzle/types.ts`** с типами для всех таблиц БД

### Улучшения архитектуры

- ✅ **Добавлен метод `finishGame()`** в `GameService` для завершения игры
- ✅ **Убраны TODO комментарии** из GameService, реализована полная логика
- ✅ **Dependency Injection** через репозиторий в GameService

### Улучшения тестирования

- ✅ **Добавлен `tests/unit/auth.test.ts`** (5 тестов для auth модуля)
- ✅ **Добавлено 2 новых теста** для GameService (finishGame)
- ✅ **Создан `tests/README_IMPROVED.md`** с подробным руководством
- ✅ **Улучшено покрытие** GameService до 17 тестов

### Документация

- ✅ **JSDoc** для всех критических модулей
- ✅ **README_IMPROVED.md** с инструкциями по тестированию
- ✅ **Обновлён основной README** с новыми разделами
