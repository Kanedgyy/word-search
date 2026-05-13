# 🚀 Деплой проекта

## Развёртывание на Vercel

### Предварительные требования

1. Аккаунт на [Vercel](https://vercel.com)
2. Аккаунт на [GitHub](https://github.com)
3. PostgreSQL база данных (например, [Neon](https://neon.tech) или [Supabase](https://supabase.com))

### Шаг 1: Подключение к GitHub

1. Push кода на GitHub:
   ```bash
   git remote add origin https://github.com/your-username/word-search.git
   git push -u origin main
   ```

2. Перейдите на [Vercel Dashboard](https://vercel.com/dashboard)
3. Нажмите "Add New Project"
4. Import your GitHub repository

### Шаг 2: Настройка переменных окружения

В Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:5432/database
BETTER_AUTH_SECRET=your-32-char-secret-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Шаг 3: Применение миграций

**Вариант A: Через Vercel Functions**

Создайте `api/setup-db/route.ts` (уже есть в проекте):

```bash
curl https://your-app.vercel.app/api/setup-db
```

**Вариант B: Через локальный CLI**

```bash
npx drizzle-kit push --env .env.local
```

### Шаг 4: Деплой

Vercel автоматически деплоит при push в main:

```bash
git push origin main
```

Ссылка на деплой будет в Vercel Dashboard.

---

## Деплой PostgreSQL

### Neon (рекомендуется)

1. Создайте аккаунт на [Neon.tech](https://neon.tech)
2. Создайте новый проект
3. Скопируйте connection string
4. Добавьте в Vercel как `DATABASE_URL`

### Supabase

1. Создайте проект на [Supabase.com](https://supabase.com)
2. Получите connection string из Settings → Database
3. Добавьте в Vercel

---

## Деплой Better Auth

### OAuth провайдеры

#### GitHub

1. Перейдите на [GitHub Developer Settings](https://github.com/settings/developers)
2. Создайте "New OAuth App"
3. Homepage URL: `https://your-app.vercel.app`
4. Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`
5. Скопируйте Client ID и Client Secret
6. Добавьте в Vercel:
   ```
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```

#### Google

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект
3. Enable "Google+ API"
4. Create credentials → OAuth 2.0 Client ID
5. Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`
6. Добавьте в Vercel:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

---

## Настройка домена

### Пользовательский домен

1. Vercel Dashboard → Your Project → Settings → Domains
2. Добавьте ваш домен
3. Настройте DNS:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

---

## Production настройки

### Build Command

```bash
npm run build
```

### Output Directory

```bash
.next
```

### Node Version

```
18.x
```

---

## Monitoring

### Vercel Analytics

Включите в Vercel Dashboard → Analytics

### Sentry (опционально)

1. Создайте аккаунт на [Sentry.io](https://sentry.io)
2. Добавьте SDK:
   ```bash
   npm install @sentry/nextjs
   ```
3. Настройте в `sentry.client.config.ts`

---

## CI/CD Pipeline

### GitHub Actions

Создайте `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Rollback

### Vercel Dashboard

1. Deployments → Select deployment
2. Click "..." → Promote to Production

### CLI

```bash
vercel rollback
```

---

## Environment переменные

### Development

`.env.local`:
```
DATABASE_URL=postgresql://localhost:5432/word_search
BETTER_AUTH_SECRET=dev-secret-32-chars-min
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production

Vercel Environment Variables:
```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=production-secret-32-chars
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Troubleshooting

### Ошибка: "Cannot find module"

```bash
# Убедитесь, что все зависимости установлены
npm install

# Очистите кэш
rm -rf .next node_modules
npm install
npm run build
```

### Ошибка: "Database connection failed"

- Проверьте `DATABASE_URL`
- Убедитесь, что IP Vercel разрешён в БД
- Проверьте SSL настройки

### Ошибка: "OAuth callback failed"

- Проверьте redirect URIs в OAuth провайдере
- Убедитесь, что совпадает с `NEXT_PUBLIC_APP_URL`

---

## Performance optimization

### Vercel Edge Functions

Для максимальной скорости:

```typescript
// next.config.js
module.exports = {
  experimental: {
    edgeMiddleware: true,
  },
};
```

### Image optimization

Используйте `next/image`:

```tsx
import Image from 'next/image';

<Image src="/avatar.png" alt="Avatar" width={100} height={100} />
```

### Caching

```typescript
// В роутерах
export const runtime = 'edge';
export const revalidate = 3600; // 1 час
```

---

## Backup и восстановление

### База данных

**Neon:**
```bash
# Создайте бэкап
pg_dump -h host -U user database > backup.sql

# Восстановите
psql -h host -U user database < backup.sql
```

### Vercel Deployments

Автоматические бэкапы при каждом деплое.

---

## Security best practices

1. **Secrets** — никогда не коммитьте в Git
2. **HTTPS** — только HTTPS в production
3. **CSP** — Content Security Policy headers
4. **Rate limiting** — ограничьте API запросы
5. **CORS** — настройте правильные origins
