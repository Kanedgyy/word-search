# 📝 Инструкция по созданию таблиц в Neon

## Проблема

При регистрации вы получаете ошибку:
```
Failed query: select ... from "users" where "users"."email" = $1
```

Это означает, что таблица `users` не существует в вашей базе данных Neon.

## Решение

### Вариант 1: Через Neon Dashboard (рекомендуется)

1. Откройте [Neon Dashboard](https://console.neon.tech/)
2. Выберите ваш проект
3. Нажмите **"SQL Editor"** в левом меню
4. Скопируйте содержимое файла `scripts/create-tables.sql`
5. Вставьте в SQL Editor и нажмите **"Run"**
6. Убедитесь, что все таблицы созданы (должно быть 9 таблиц)

### Вариант 2: Через psql

```bash
# Установите psql если нет
# macOS: brew install postgresql
# Windows: скачайте с https://www.postgresql.org/download/windows/

# Подключитесь к базе данных
psql "postgresql://neondb_owner:YOUR_PASSWORD@ep-cold-pine-aqnhujxq-pooler.c-8.us-east-1.aws.neon.tech/neondb"

# Выполните скрипт
\i scripts/create-tables.sql

# Проверьте создание таблиц
\dt
```

### Вариант 3: Через Vercel CLI

```bash
# Установите Vercel CLI
npm install -g vercel

# Получите переменные окружения
vercel env pull

# Примените миграции
npx drizzle-kit push --env .env.local
```

## Проверка

После выполнения скрипта проверьте, что таблицы созданы:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Должны появиться таблицы:
- `users`
- `sessions`
- `accounts`
- `verifications`
- `user_roles`
- `game_sessions`
- `game_players`
- `found_words`
- `match_history`

## После создания таблиц

1. Перезапустите dev сервер:
   ```bash
   npm run dev
   ```

2. Попробуйте зарегистрироваться снова

3. Если ошибка сохраняется, проверьте логи сервера в консоли

## Если таблица users уже существует

Если вы получили ошибку "relation already exists", это хорошо — таблицы уже созданы. Попробуйте зарегистрироваться снова.

## Альтернатива: OAuth

Если проблема не решается, попробуйте войти через **GitHub** или **Google** OAuth — это может работать даже без таблицы users (Better Auth создаст её автоматически).

## Поддержка

Если проблема остаётся:
1. Проверьте, что DATABASE_URL в `.env.local` правильный
2. Убедитесь, что Neon база доступна (проверьте в Dashboard)
3. Проверьте логи сервера при регистрации
