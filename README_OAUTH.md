# Настройка OAuth (GitHub и Google)

## 🚀 Быстрый старт

### 1. Создайте OAuth приложения

#### GitHub OAuth
1. Перейдите: https://github.com/settings/applications/new
2. Заполните:
   - Application name: `Филворд`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Скопируйте **Client ID** и **Client Secret**

#### Google OAuth
1. Перейдите: https://console.cloud.google.com/apis/credentials
2. Создайте OAuth 2.0 Client ID
3. Добавьте redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Скопируйте **Client ID** и **Client Secret**

### 2. Добавьте в `.env.local`

```env
# GitHub OAuth
GITHUB_CLIENT_ID=ваш-client-id
GITHUB_CLIENT_SECRET=ваш-client-secret

# Google OAuth
GOOGLE_CLIENT_ID=ваш-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ваш-client-secret
```

### 3. Перезапустите сервер

```bash
npm run dev
```

### 4. Проверьте

Откройте `http://localhost:3000/auth/login` - должны появиться кнопки:
- "Войти через GitHub"
- "Войти через Google"

---

## 📋 Полная инструкция

Подробная инструкция с пошаговыми скриншотами: [docs/OAUTH_SETUP.md](./OAUTH_SETUP.md)

---

## 🔧 Как это работает

Better Auth автоматически обрабатывает OAuth:

1. Пользователь нажимает "Войти через GitHub/Google"
2. Перенаправляется на `/api/auth/sign-in/{provider}`
3. Better Auth перенаправляет на страницу провайдера
4. После авторизации возвращается на `/api/auth/callback/{provider}`
5. Better Auth создаёт/обновляет пользователя в БД
6. Перенаправляет на главную страницу

---

## ✅ Что уже настроено

- ✅ Better Auth с GitHub и Google провайдерами
- ✅ API endpoints (`/api/auth/sign-in/github`, `/api/auth/sign-in/google`)
- ✅ Callback endpoints (`/api/auth/callback/github`, `/api/auth/callback/google`)
- ✅ Кнопки на странице входа (`/auth/login`)
- ✅ Автоматическое создание пользователя в БД

---

## ❓ Частые проблемы

### Ошибка "Redirect URI mismatch"
Проверьте, что в OAuth приложении указан точный callback URL:
- GitHub: `http://localhost:3000/api/auth/callback/github`
- Google: `http://localhost:3000/api/auth/callback/google`

### Ошибка "Invalid client_id"
Убедитесь, что скопировали Client ID без пробелов в `.env.local`

### OAuth не работает после перезапуска
Проверьте, что переменные окружения в `.env.local` загружены:
```bash
# Перезапустите сервер с новыми переменными
npm run dev
```

---

## 🎯 Production deployment

Для продакшн замените `localhost:3000` на ваш домен:
- Homepage URL: `https://your-domain.com`
- Callback URL: `https://your-domain.com/api/auth/callback/github`

И добавьте в `.env`:
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```
