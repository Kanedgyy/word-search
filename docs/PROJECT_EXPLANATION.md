# 📚 Полный гайд по проекту «Соревновательный филворд»

Этот документ подробно объясняет, как работает наше веб-приложение. Он написан для начинающих разработчиков — даже если ты никогда не программировал, постараюсь объяснить максимально просто.

## 📋 Содержание

1. [Что такое филворд?](#что-такое-филворд)
2. [Технологический стек](#технологический-стек)
3. [Архитектура приложения](#архитектура-приложения)
4. [Как работает каждая часть](#как-работает-каждая-часть)
5. [Установка и запуск](#установка-и-запуск)
6. [Разбор кода по файлам](#разбор-кода-по-файлам)
7. [Расширение функционала](#расширение-функционала)

---

## Что такое филворд?

**Филворд** (Word Search) — это игра, где нужно найти слова в таблице букв. Слова могут располагаться:
- Горизонтально (слева направо)
- Вертикально (сверху вниз)
- По диагонали (в любом направлении)

### Пример филворда 5×5:

```
К О Д П Р
У Н К Ц И
Т Е С Т А
Я Ы Ь Ъ Ф
С Т У Ф Х
```

Здесь можно найти слова: КОД, ФУНКЦИЯ, ТЕСТ

---

## Технологический стек

### Основная технология

| Технология | Что это | Зачем нужно |
|------------|---------|-------------|
| **TypeScript** | Язык программирования | Позволяет писать код с типами — меньше ошибок, лучше автодополнение в редакторе |
| **Next.js 16** | Фреймворк для React | Упрощает создание веб-приложений, имеет встроенный роутинг и серверный рендеринг |
| **Drizzle ORM** | Инструмент для работы с БД | Позволяет работать с базой данных на TypeScript, без написания SQL-запросов |
| **tRPC** | Протокол для API | Позволяет вызывать функции сервера как локальные, с полной типизацией |
| **Better Auth** | Библиотека аутентификации | Добавляет вход/регистрацию пользователей |
| **PostgreSQL** | База данных | Хранит данные игроков, сессий, статистику |
| **Tailwind CSS** | CSS-фреймворк | Позволяет стилизовать элементы через классы в HTML |

### Почему выбраны эти технологии?

#### TypeScript vs JavaScript
```javascript
// JavaScript — нет проверки типов
function add(a, b) {
  return a + b;
}
add("5", 3); // "53" — ошибка! Но TypeScript этого не заметит

// TypeScript — есть проверка типов
function add(a: number, b: number): number {
  return a + b;
}
add("5", 3); // Ошибка на этапе написания кода!
```

#### tRPC vs REST API

**REST API** (традиционный подход):
```typescript
// На сервере
app.post('/api/user', (req, res) => {
  const { name, email } = req.body;
  // ...
});

// На клиенте
fetch('/api/user', {
  method: 'POST',
  body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});
// Нет проверки типов! Можно отправить что угодно
```

**tRPC** (наш подход):
```typescript
// На сервере
const userProcedure = publicProcedure
  .input(z.object({ name: z.string(), email: z.string() }))
  .mutation(async ({ input }) => {
    // input.name и input.email гарантированно строки
  });

// На клиенте
const result = await trpc.user.create.mutate({
  name: 'John',
  email: 'john@example.com'
});
// Ошибка, если передать не те типы!
```

---

## Архитектура приложения

```
┌─────────────────────────────────────────────────────────┐
│                    Клиент (Browser)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Next.js App (React компоненты)                   │  │
│  │  - Главная страница (/)                           │  │
│  │  - Страница игры (/game/[sessionId])              │  │
│  │  - GameBoard (игровое поле)                       │  │
│  │  - WordList (список слов)                         │  │
│  │  - PlayerList (список игроков)                    │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                                │
│                         │ tRPC запросы                   │
│                         ▼                                │
└─────────────────────────────────────────────────────────┘
                         │
                         │
┌─────────────────────────────────────────────────────────┐
│                   Сервер (Node.js)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  tRPC Server                                      │  │
│  │  - game.createSession()                           │  │
│  │  - game.joinSession()                             │  │
│  │  - game.startGame()                               │  │
│  │  - game.submitWord()                              │  │
│  │  - game.getSessionState()                         │  │
│  │  - game.addBot()                                  │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                                │
│                         │ Drizzle ORM                    │
│                         ▼                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                              │  │
│  │  - users                                          │  │
│  │  - game_sessions                                  │  │
│  │  - game_players                                   │  │
│  │  - found_words                                    │  │
│  │  - match_history                                  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Как работает каждая часть

### 1. Генерация филворда (`lib/word-search.ts`)

#### Как создаётся поле?

```typescript
// Шаг 1: Создаём пустую сетку 10x10
function createEmptyGrid(): Grid {
  return Array.from({ length: 10 }, () => 
    Array(10).fill('')
  );
}
// Результат: [['', '', ...], ['', '', ...], ...]

// Шаг 2: Размещаем слова
for (const word of words) {
  // Пробуем найти место для слова
  // Проверяем: не выходит ли за границы, не пересекается ли с другими
  if (canPlaceWord(grid, word, start, direction)) {
    placeWordInGrid(grid, word, start, direction);
  }
}

// Шаг 3: Заполняем пустые клетки случайными буквами
fillEmptyCells(grid);
```

#### Как проверяется слово?

```typescript
// Игрок выделяет слово от (startRow, startCol) до (endRow, endCol)
// 1. Проверяем, что слово есть в списке допустимых
if (!validWords.includes(word)) {
  return { isValid: false, error: 'Такого слова нет' };
}

// 2. Проверяем, что координаты образуют прямую линию (горизонталь/вертикаль/диагональ)
const direction = calculateDirection(start, end);
if (!direction) {
  return { isValid: false, error: 'Неверное направление' };
}

// 3. Проверяем, что на этих координатах действительно это слово
const gridWord = getWordFromGrid(grid, start, end, direction);
if (gridWord !== word) {
  return { isValid: false, error: 'Неверные координаты' };
}
```

### 2. tRPC Роутер (`server/trpc/gameRouter.ts`)

#### Что делает каждая процедура?

**createSession** — создаёт новую игру
```typescript
const createSession = publicProcedure
  .input(z.object({ maxPlayers: number, duration: number }))
  .mutation(({ input }) => {
    // 1. Генерируем уникальный ID сессии
    const sessionId = `game_${Date.now()}_${random}`;
    
    // 2. Генерируем филворд
    const { grid, placedWords } = generateWordSearch(words);
    
    // 3. Сохраняем сессию
    sessions.set(sessionId, {
      id: sessionId,
      grid,
      wordList: placedWords,
      players: [],
      status: 'waiting',
      // ...
    });
    
    return { sessionId, grid, wordList: placedWords };
  });
```

**submitWord** — проверяет найденное слово
```typescript
const submitWord = publicProcedure
  .input(z.object({ 
    sessionId, playerId, word, 
    startRow, startCol, endRow, endCol, direction 
  }))
  .mutation(({ input }) => {
    const session = sessions.get(input.sessionId);
    
    // 1. Проверяем, что слово ещё не найдено
    if (session.foundWords.has(input.word)) {
      return { success: false, error: 'Слово уже найдено' };
    }
    
    // 2. Проверяем валидность слова
    const validation = validateWord(...);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }
    
    // 3. Добавляем слово в найденные
    session.foundWords.add(input.word);
    
    // 4. Обновляем счёт игрока
    player.wordsFound++;
    
    return { success: true, word: input.word };
  });
```

### 3. React Компоненты

#### GameBoard — игровое поле

```typescript
export function GameBoard({ grid, onWordSelect }) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);

  // Когда игрок нажимает на клетку
  const handleMouseDown = (row, col) => {
    setIsSelecting(true);
    setSelectionStart({ row, col });
    setSelectionEnd({ row, col });
  };

  // Когда игрок ведёт мышью
  const handleMouseEnter = (row, col) => {
    if (isSelecting) {
      setSelectionEnd({ row, col });
    }
  };

  // Когда игрок отпускает мышь
  const handleMouseUp = () => {
    if (selectionStart && selectionEnd) {
      const word = getWordFromSelection(selectionStart, selectionEnd);
      const direction = calculateDirection(selectionStart, selectionEnd);
      onWordSelect(word, selectionStart, selectionEnd, direction);
    }
    setIsSelecting(false);
  };

  return (
    <div className="grid gap-1">
      {grid.map((row, rowIndex) => (
        row.map((letter, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
            onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
          >
            {letter}
          </div>
        ))
      ))}
    </div>
  );
}
```

---

## Установка и запуск

### Предварительные требования

1. **Node.js 18+** — скачай с [nodejs.org](https://nodejs.org/)
2. **PostgreSQL** — база данных

### Шаг 1: Установка PostgreSQL

**Windows:**
1. Скачай с [postgresql.org](https://www.postgresql.org/download/windows/)
2. Установи, запомни пароль для пользователя `postgres`
3. Создай базу данных:
```bash
# Открой pgAdmin или используй psql
psql -U postgres
CREATE DATABASE word_search;
\q
```

### Шаг 2: Установка проекта

```bash
# Перейди в папку проекта
cd word-search-multiplayer

# Установи зависимости
npm install

# Создай файл .env.local
cp .env.example .env.local

# Настрой переменные окружения
# .env.local:
DATABASE_URL=postgresql://postgres:пароль@localhost:5432/word_search
BETTER_AUTH_SECRET=твоя-случайная-строка-минимум-32-символа
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Шаг 3: Создание миграций БД

```bash
# Сгенерируй миграции из схемы
npm run db:generate

# Примени миграции к базе данных
npm run db:migrate
```

### Шаг 4: Запуск в режиме разработки

```bash
npm run dev
```

Открой http://localhost:3000 в браузере.

---

## Разбор кода по файлам

### Файл: `lib/word-search.ts`

Этот файл содержит всю логику игры:

```typescript
// Константы
const GRID_SIZE = 10; // Размер поля 10x10
const ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'; // Русский алфавит

// Типы данных
type Direction = 'horizontal' | 'vertical' | 'diagonal_down' | 'diagonal_up';
type Coordinate = { row: number; col: number };
type Grid = string[][]; // Двумерный массив букв

// Функция генерации филворда
export function generateWordSearch(words: string[]) {
  // 1. Создаём пустую сетку
  const grid = createEmptyGrid();
  
  // 2. Размещаем слова
  for (const word of sortedWords) {
    // Пробуем 100 раз разместить слово
    for (let attempt = 0; attempt < 100; attempt++) {
      const direction = getRandomDirection();
      const start = getRandomPosition();
      
      if (canPlaceWord(grid, word, start, direction)) {
        placeWordInGrid(grid, word, start, direction);
        placedWords.push(word);
        break;
      }
    }
  }
  
  // 3. Заполняем пустые клетки
  fillEmptyCells(grid);
  
  return { grid, placedWords, failedWords };
}
```

### Файл: `server/trpc/gameRouter.ts`

Здесь определяются все API endpoint'ы:

```typescript
// Создаём router
export const gameRouter = createTRPCRouter({
  // Процедура создания сессии
  createSession: publicProcedure
    .input(z.object({ maxPlayers: z.number(), duration: z.number() }))
    .mutation(async ({ input }) => {
      // Логика создания
    }),
  
  // Процедура присоединения
  joinSession: publicProcedure
    .input(z.object({ sessionId: z.string(), playerName: z.string() }))
    .mutation(async ({ input }) => {
      // Логика присоединения
    }),
  
  // и так далее...
});
```

### Файл: `drizzle/schema.ts`

Здесь определяются таблицы базы данных:

```typescript
// Таблица пользователей
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Таблица сессий игр
export const gameSessions = pgTable('game_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  wordList: text('word_list').array().notNull(),
  grid: text('grid').array().array().notNull(),
  status: varchar('status', { enum: ['waiting', 'in_progress', 'finished'] })
    .notNull().default('waiting'),
  // ...
});
```

---

## Расширение функционала

### 1. Добавление WebSocket для real-time

Сейчас используется polling (опрос каждые 2 секунды). Можно улучшить с WebSocket:

```bash
npm install ws
```

```typescript
// server/websocket.ts
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Обработка сообщения от клиента
    const data = JSON.parse(message);
    
    if (data.type === 'SUBMIT_WORD') {
      // Проверка слова и рассылка всем игрокам
      broadcast({ type: 'WORD_FOUND', ...data });
    }
  });
});
```

### 2. Добавление командного режима

```typescript
// В схему БД добавить поле team
export const gamePlayers = pgTable('game_players', {
  // ...
  team: varchar('team').default(''),
});

// При подсчёте результатов суммировать очки команды
function calculateTeamResults(session) {
  const teams = new Map();
  
  for (const player of session.players) {
    const team = player.team || 'solo';
    if (!teams.has(team)) {
      teams.set(team, { score: 0, players: [] });
    }
    teams.get(team).score += player.wordsFound;
    teams.get(team).players.push(player);
  }
  
  return Array.from(teams.entries())
    .sort((a, b) => b[1].score - a[1].score);
}
```

### 3. Создание умного бота

```typescript
// server/bot.ts
class GameBot {
  constructor(private sessionId: string, private playerId: string) {}
  
  async startFindingWords() {
    const state = await getSessionState(this.sessionId);
    
    // Найти все слова на поле
    const foundWords = this.findWordsOnGrid(state.grid, state.wordList);
    
    // Отправлять слова с задержкой (имитация человека)
    for (const word of foundWords) {
      await sleep(Math.random() * 5000 + 2000); // 2-7 секунд
      
      await submitWord({
        sessionId: this.sessionId,
        playerId: this.playerId,
        ...word.coordinates
      });
    }
  }
  
  findWordsOnGrid(grid: Grid, wordList: string[]) {
    // Алгоритм поиска слов в сетке
    // Проверяем все направления для каждого слова
  }
}
```

---

## Заключение

Этот проект демонстрирует:
- Современный веб-стек (TypeScript, Next.js, tRPC)
- Работу с базой данных (PostgreSQL, Drizzle)
- Многопользовательскую логику
- Генерацию и валидацию игровых данных

Для дальнейшего изучения:
1. Изучи [документацию Next.js](https://nextjs.org/docs)
2. Изучи [документацию tRPC](https://trpc.io/docs)
3. Попробуй добавить новые функции (команды, разные размеры поля, темы слов)

Удачи в разработке! 🚀
