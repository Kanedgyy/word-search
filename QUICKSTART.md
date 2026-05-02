# 🚀 Быстрый старт проекта

## Предварительные требования

1. **Node.js 18+** - [Скачать](https://nodejs.org/)
2. **PostgreSQL 14+** - [Скачать](https://www.postgresql.org/download/)

## Установка

### Шаг 1: Установка PostgreSQL

**Windows:**
1. Скачай установщик с [postgresql.org](https://www.postgresql.org/download/windows/)
2. Установи, запомни пароль для пользователя `postgres`
3. Открой командную строку и выполни:

```bash
# Создай базу данных
psql -U postgres
CREATE DATABASE word_search;
\q
```

**macOS:**
```bash
# Установи через Homebrew
brew install postgresql

# Запусти PostgreSQL
brew services start postgresql

# Создай базу данных
createdb word_search
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Запусти PostgreSQL
sudo systemctl start postgresql

# Создай базу данных
sudo -u postgres createdb word_search
```

### Шаг 2: Установка зависимостей проекта

```bash
# Перейди в папку проекта
cd word-search-multiplayer

# Установи зависимости
npm install
```

### Шаг 3: Настройка переменных окружения

Создай файл `.env.local` в корне проекта:

```env
# Строка подключения к базе данных
DATABASE_URL=postgresql://postgres:твой-пароль@localhost:5432/word_search

# Секрет для аутентификации (сгенерируй случайную строку)
BETTER_AUTH_SECRET=твоя-случайная-строка-минимум-32-символа

# URL приложения
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Как сгенерировать секрет:**
```bash
# Linux/macOS
openssl rand -base64 32

# Windows (PowerShell)
-join ((65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Шаг 4: Создание миграций базы данных

```bash
# Сгенерируй миграции из схемы
npm run db:generate

# Примени миграции к базе данных
npm run db:migrate
```

### Шаг 5: Запуск проекта

```bash
# Запуск в режиме разработки
npm run dev
```

Открой браузер и перейди по адресу: [http://localhost:3000](http://localhost:3000)

---

## Команды проекта

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск сервера разработки |
| `npm run build` | Сборка для продакшена |
| `npm start` | Запуск продакшен-сервера |
| `npm run lint` | Проверка кода линтером |
| `npm test` | Запуск тестов |
| `npm run test:watch` | Запуск тестов в режиме наблюдения |
| `npm run db:generate` | Генерация миграций БД |
| `npm run db:migrate` | Применение миграций БД |
| `npm run db:studio` | Запуск GUI для БД |

---

## Проверка работы

### 1. Создай новую игру

1. Открой [http://localhost:3000](http://localhost:3000)
2. Введи своё имя
3. Нажми "Создать новую игру"
4. Скопируй ID сессии

### 2. Присоединись к игре (в другом браузере или инкогнито)

1. Открой ту же ссылку
2. Введи другое имя
3. Вставь ID сессии
4. Нажми "Присоединиться к игре"

### 3. Запусти игру

1. Хост (первый игрок) нажмёт "Начать игру"
2. Нужно минимум 2 игрока

### 4. Играй!

- Выделяй слова мышью на поле 10×10
- Слова могут быть горизонтально, вертикально или по диагонали
- Найденное слово вычеркивается у всех игроков
- Побеждает тот, кто найдёт больше слов!

---

## Решение проблем

### Ошибка: "database does not exist"

```bash
# Создай базу данных
psql -U postgres
CREATE DATABASE word_search;
\q
```

### Ошибка: "password authentication failed"

1. Проверь пароль в `.env.local`
2. Или измени метод аутентификации в `pg_hba.conf`:
```
# Измените trust на trust для локальных соединений
host    all             all             127.0.0.1/32            trust
```

### Ошибка: "relation does not exist"

```bash
# Примени миграции
npm run db:migrate
```

### Ошибка: "Cannot find module 'pg'"

```bash
# Установи зависимости
npm install
```

---

## Структура проекта

```
word-search-multiplayer/
├── app/                    # Next.js App Router
│   ├── api/                # API маршруты
│   │   └── trpc/           # tRPC endpoint
│   ├── game/               # Страницы игры
│   ├── layout.tsx          # Корневой layout
│   └── page.tsx            # Главная страница
├── components/             # React компоненты
│   ├── GameBoard.tsx       # Игровое поле
│   ├── WordList.tsx        # Список слов
│   └── PlayerList.tsx      # Список игроков
├── docs/                   # Документация
│   ├── PROJECT_EXPLANATION.md
│   └── LIBRARY_CHOICES.md
├── drizzle/                # Drizzle ORM
│   ├── migrations/         # Миграции БД
│   └── schema.ts           # Схема БД
├── lib/                    # Утилиты
│   ├── db.ts               # Подключение к БД
│   └── word-search.ts      # Логика филворда
├── server/                 # Серверная логика
│   └── trpc/               # tRPC роутеры
├── tests/                  # Тесты
├── .env.local              # Переменные окружения
├── package.json            # Зависимости
└── README.md               # Этот файл
```

---

## Дополнительная информация

- **Документация проекта:** смотри в папке `docs/`
- **Тесты:** `tests/word-search.test.ts`
- **Схема БД:** `drizzle/schema.ts`

---

## Нужна помощь?

Если возникли проблемы:
1. Проверь, что все предварительные требования установлены
2. Убедись, что PostgreSQL запущен
3. Проверь переменные окружения в `.env.local`
4. Попробуй удалить `node_modules` и установить заново:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

Удачи в игре! 🎮
