# 📡 API Документация

## tRPC Endpoints

### `game.createSession`

Создаёт новую игровую сессию.

**Method:** `mutation`

**Input:**
```typescript
{
  maxPlayers: number;      // 2-6 игроков
  duration: number;        // 60-600 секунд
  gameMode: 'individual' | 'team';
  onTimeLimit: boolean;
}
```

**Output:**
```typescript
{
  sessionId: string;
  grid: string[][];
  wordList: string[];
  maxPlayers: number;
  duration: number;
  gameMode: 'individual' | 'team';
  onTimeLimit: boolean;
}
```

**Errors:**
- `VALIDATION_ERROR` — некорректные параметры
- `UNAUTHORIZED` — пользователь не авторизован

**Example:**
```typescript
const result = await trpc.game.createSession.mutate({
  maxPlayers: 4,
  duration: 300,
  gameMode: 'individual',
  onTimeLimit: false,
});
```

---

### `game.joinSession`

Присоединяется к существующей сессии.

**Method:** `mutation`

**Input:**
```typescript
{
  sessionId: string;
  playerName: string;     // 1-20 символов
  userId?: string | null; // ID пользователя Better Auth
}
```

**Output:**
```typescript
{
  playerId: string;
  color: string;
  playersCount: number;
  isHost: boolean;
}
```

**Errors:**
- `SESSION_NOT_FOUND` — сессия не существует
- `GAME_ALREADY_STARTED` — игра уже началась
- `MAX_PLAYERS_REACHED` — сессия заполнена

**Example:**
```typescript
const result = await trpc.game.joinSession.mutate({
  sessionId: 'abc-123',
  playerName: 'Игрок1',
});
```

---

### `game.startGame`

Запускает игру (только хост).

**Method:** `mutation`

**Input:**
```typescript
{
  sessionId: string;
}
```

**Output:**
```typescript
{
  message: string;
  grid: string[][];
  playerCount: number;
}
```

**Errors:**
- `SESSION_NOT_FOUND` — сессия не найдена
- `NOT_HOST` — только хост может запустить
- `GAME_ALREADY_STARTED` — игра уже началась
- `NOT_ENOUGH_PLAYERS` — нужно минимум 2 игрока

**Example:**
```typescript
await trpc.game.startGame.mutate({ sessionId: 'abc-123' });
```

---

### `game.submitWord`

Отправляет найденное слово для проверки.

**Method:** `mutation`

**Input:**
```typescript
{
  sessionId: string;
  playerId: string;
  word: string;
  startRow: number;       // 0-9
  startCol: number;       // 0-9
  endRow: number;         // 0-9
  endCol: number;         // 0-9
  direction: 'horizontal' | 'vertical' | 'diagonal_down' | 'diagonal_up';
  path?: Coordinate[];    // Полный путь от клиента
}
```

**Output:**
```typescript
{
  success: boolean;
  error?: string;
  word?: string;
  playerScore?: number;
  results?: Array<{
    rank: number;
    name: string;
    wordsFound: number;
    isBot: boolean;
  }>;
  gameEnded: boolean;
}
```

**Errors:**
- `GAME_NOT_STARTED` — игра не началась
- `WORD_NOT_FOUND` — слова нет в списке
- `WORD_ALREADY_FOUND` — слово уже найдено

**Example:**
```typescript
const result = await trpc.game.submitWord.mutate({
  sessionId: 'abc-123',
  playerId: 'player-1',
  word: 'ТЕСТ',
  startRow: 0,
  startCol: 0,
  endRow: 0,
  endCol: 3,
  direction: 'horizontal',
  path: [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 0, col: 3 },
  ],
});

if (result.success) {
  console.log(`Найдено! Счёт: ${result.playerScore}`);
}
```

---

### `game.getSessionState`

Получает текущее состояние сессии.

**Method:** `query`

**Input:**
```typescript
{
  sessionId: string;
  playerId?: string;
}
```

**Output:**
```typescript
{
  id: string;
  status: 'waiting' | 'in_progress' | 'finished';
  grid: string[][];
  wordList: string[];
  players: Player[];
  foundWords: string[];
  foundCellsMap: Record<string, string>;
  maxPlayers: number;
  duration: number;
  gameMode: 'individual' | 'team';
  onTimeLimit: boolean;
  startTime?: number;
  endTime?: number;
  player?: Player | null;
  teams?: Team[];
  rematchSessionId?: string | null;
  totalWordCount: number;
}
```

**Example:**
```typescript
const state = await trpc.game.getSessionState.useQuery({
  sessionId: 'abc-123',
  playerId: 'player-1',
});
```

---

### `game.addBot`

Добавляет бота в сессию (для демонстрации).

**Method:** `mutation`

**Input:**
```typescript
{
  sessionId: string;
  botName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  team?: 'red' | 'blue' | 'green' | 'yellow';
}
```

**Output:**
```typescript
{
  playerId: string;
  color: string;
  playersCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  team: string | null;
}
```

---

### `game.setTeam`

Устанавливает команду игроку (командный режим).

**Method:** `mutation`

**Input:**
```typescript
{
  sessionId: string;
  playerId: string;
  team: 'red' | 'blue' | 'green' | 'yellow' | null;
}
```

**Output:**
```typescript
{
  success: boolean;
  team: string | null;
}
```

---

### `game.rematch`

Создаёт реванш — новую сессию с теми же игроками.

**Method:** `mutation`

**Input:**
```typescript
{
  sessionId: string;
  playerId: string;
}
```

**Output:**
```typescript
{
  success: boolean;
  sessionId: string;
  grid: string[][];
  wordList: string[];
  gameMode: 'individual' | 'team';
  onTimeLimit: boolean;
}
```

---

### `game.removePlayer`

Удаляет игрока из сессии (только хост).

**Method:** `mutation`

**Input:**
```typescript
{
  sessionId: string;
  playerId: string;        // ID хоста
  targetPlayerId: string;  // Кого удаляем
}
```

**Output:**
```typescript
{
  success: boolean;
  removedPlayerId: string;
}
```

---

### `game.getMatchHistory`

Получает историю матчей игрока.

**Method:** `query`

**Input:**
```typescript
{
  playerName: string;
  limit: number;  // 1-50, default 20
}
```

**Output:**
```typescript
{
  history: Array<{
    id: string;
    playerName: string;
    wordsFound: number;
    firstWordTime: number | null;
    rank: number | null;
    recordedAt: Date;
    sessionId: string;
  }>;
  stats: {
    totalMatches: number;
    totalWords: number;
    wins: number;
    avgWords: number;
  };
}
```

---

## WebSocket Events

### Client → Server

#### `word_found`
```typescript
{
  type: 'word_found';
  sessionId: string;
  data: {
    playerId: string;
    word: string;
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
    direction: string;
  };
}
```

#### `game_started`
```typescript
{
  type: 'game_started';
  sessionId: string;
  data: {
    grid: string[][];
    wordList: string[];
  };
}
```

---

### Server → Client

#### `word_found`
```typescript
{
  type: 'word_found';
  sessionId: string;
  data: {
    playerId: string;
    playerName: string;
    word: string;
    results: PlayerResult[];
  };
}
```

#### `game_started`
```typescript
{
  type: 'game_started';
  sessionId: string;
  data: {
    grid: string[][];
    playerCount: number;
  };
}
```

#### `game_ended`
```typescript
{
  type: 'game_ended';
  sessionId: string;
  data: {
    results: PlayerResult[];
  };
}
```

#### `player_joined`
```typescript
{
  type: 'player_joined';
  sessionId: string;
  data: {
    player: Player;
    playersCount: number;
  };
}
```

---

## Authentication API

### Better Auth Endpoints

#### POST `/api/auth/login`
```typescript
{
  email: string;
  password: string;
}
```

**Output:**
```typescript
{
  user: {
    id: string;
    name: string;
    email: string;
  };
  session: {
    token: string;
    expiresAt: Date;
  };
}
```

#### POST `/api/auth/register`
```typescript
{
  name: string;
  email: string;
  password: string;
}
```

**Output:**
```typescript
{
  user: User;
  session: Session;
}
```

#### GET `/api/auth/session`
**Output:**
```typescript
{
  user: User | null;
  session: Session | null;
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Некорректные входные данные |
| `UNAUTHORIZED` | Пользователь не авторизован |
| `SESSION_NOT_FOUND` | Сессия не существует |
| `GAME_ALREADY_STARTED` | Игра уже началась |
| `GAME_NOT_STARTED` | Игра ещё не началась |
| `NOT_HOST` | Действие доступно только хосту |
| `MAX_PLAYERS_REACHED` | Достигнут максимум игроков |
| `NOT_ENOUGH_PLAYERS` | Нужно минимум 2 игрока |
| `WORD_NOT_FOUND` | Слова нет в списке |
| `WORD_ALREADY_FOUND` | Слово уже найдено другим |
| `INVALID_SELECTION` | Некорректное выделение |

---

## Rate Limits

- `createSession`: 10 запросов/минуту
- `joinSession`: 30 запросов/минуту
- `submitWord`: 60 запросов/минуту
- `getSessionState`: 30 запросов/минуту

---

## CORS Configuration

Разрешённые origins:
- `http://localhost:3000` (development)
- `https://your-domain.vercel.app` (production)

Методы: `GET`, `POST`

Headers: `Content-Type`, `Authorization`
