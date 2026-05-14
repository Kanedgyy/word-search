# Настройка OAuth провайдеров (GitHub и Google)

## 📋 Предварительные требования

Для работы OAuth вам нужно получить клиентские ID и секреты у соответствующих провайдеров.

---

## 🔷 GitHub OAuth

### Шаг 1: Создайте OAuth App

1. Перейдите на [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/applications/new)
2. Заполните форму:
   - **Application name**: `Филворд (локально)` или `Филворд (продакшн)`
   - **Homepage URL**: `http://localhost:3000` (локально) или `https://your-domain.com` (продакшн)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github` (локально)
     или `https://your-domain.com/api/auth/callback/github` (продакшн)

### Шаг 2: Получите credentials

После создания приложения вы получите:
- **Client ID** (например: `v1a2b3c4d5e6f7g8h9i0`)
- **Client Secret** (нажмите "Generate a new client secret")

### Шаг 3: Добавьте в `.env.local`

```env
GITHUB_CLIENT_ID=ваш-client-id
GITHUB_CLIENT_SECRET=ваш-client-secret
```

---

## 🔴 Google OAuth

### Шаг 1: Создайте проект в Google Cloud

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Перейдите в **APIs & Services → Credentials**

### Шаг 2: Настройте OAuth consent screen

1. Перейдите в **OAuth consent screen**
2. Выберите **External** (для публичного использования) или **Internal** (только для вашей организации)
3. Заполните:
   - **App name**: `Филворд`
   - **User support email**: ваш email
   - **Developer contact email**: ваш email
4. Нажмите **Save and Continue**

### Шаг 3: Создайте OAuth 2.0 Client ID

1. Перейдите в **Credentials → Create Credentials → OAuth 2.0 Client ID**
2. Выберите **Web application**
3. Добавьте **Authorized JavaScript origins**:
   - `http://localhost:3000` (локально)
   - `https://your-domain.com` (продакшн)
4. Добавьте **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (локально)
   - `https://your-domain.com/api/auth/callback/google` (продакшн)

### Шаг 4: Получите credentials

После создания вы получите:
- **Client ID** (например: `123456789-abcdefg.apps.googleusercontent.com`)
- **Client Secret** (например: `GOCSPX-xxxxxxxxx`)

### Шаг 5: Добавьте в `.env.local`

```env
GOOGLE_CLIENT_ID=ваш-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ваш-client-secret
```

---

## 📝 Полный пример `.env.local`

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Better-auth
BETTER_AUTH_SECRET=32-chars-minimum-random-string

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# WebSocket
WS_PORT=3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_WS_ENABLED=false

# GitHub OAuth
GITHUB_CLIENT_ID=v1a2b3c4d5e6f7g8h9i0
GITHUB_CLIENT_SECRET=ghcs_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxx
```

---

## ✅ Проверка

После настройки переменных окружения:

1. Перезапустите сервер разработки:
   ```bash
   npm run dev
   ```

2. Откройте `http://localhost:3000/auth/login`

3. Вы должны увидеть кнопки:
   - **"Войти через GitHub"**
   - **"Войти через Google"**

4. Нажмите на кнопку и попробуйте войти

---

## 🔧 Production deployment

Для продакшн окружения (Vercel, Railway и др.):

### Vercel

1. Перейдите в **Project Settings → Environment Variables**
2. Добавьте все переменные из `.env.local`
3. **Callback URL** должен быть: `https://your-project.vercel.app/api/auth/callback/{provider}`

### Railway

1. Перейдите в **Variables**
2. Добавьте все переменные окружения
3. **Callback URL** должен быть: `https://your-app.railway.app/api/auth/callback/{provider}`

---

## 🐛 Troubleshooting

### Ошибка: "Redirect URI not allowed"

Проверьте, что **Callback URL** в настройках OAuth приложения точно совпадает с:
- `http://localhost:3000/api/auth/callback/github`
- `http://localhost:3000/api/auth/callback/google`

### Ошибка: "Invalid client_id"

Убедитесь, что скопировали **Client ID** без пробелов и переносов строк.

### Ошибка: "Redirect URI mismatch"

Проверьте, что в `.env.local` `NEXT_PUBLIC_APP_URL` совпадает с доменом в OAuth настройках.

---

## 📚 Ресурсы

- [Better Auth Documentation](https://better-auth.com/)
- [GitHub OAuth Apps](https://github.com/settings/applications/new)
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
