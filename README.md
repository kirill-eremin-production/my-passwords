# My Passwords - Инструкция по локальному запуску

Приложение для безопасного хранения паролей с поддержкой биометрической аутентификации и Telegram интеграции.

## Архитектура проекта

```
my-passwords/
├── backend/          # Backend API (Node.js + Express + TypeScript)
├── frontend/         # Frontend приложение (React + TypeScript)
├── nginx/           # Конфигурация nginx
├── ssl/             # SSL сертификаты для development
├── dev.sh           # Скрипт для запуска в development режиме
└── build.sh         # Скрипт для сборки проекта
```

## Системные требования

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **bash** (для запуска скриптов)
- **netcat** (`nc`) - для проверки доступности портов

## Установка зависимостей

```bash
# Установка зависимостей для backend
cd backend
npm install

# Установка зависимостей для frontend
cd ../frontend
npm install

# Возврат в корневую директорию
cd ..
```

## Настройка переменных окружения

### Backend (.env файл)

Создайте файл `backend/.env` на основе `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Обязательные переменные в `backend/.env`:

```env
# Telegram настройки (обязательные)
TELEGRAM_BOT_SECRET=YOUR_BOT_TOKEN_HERE
TELEGRAM_USER_ID=YOUR_TELEGRAM_USER_ID_HERE

# Безопасность: Контроль Telegram backup
ENABLE_TELEGRAM_BACKUP=false

# Безопасность: Шифрование файлового хранилища
FILE_ENCRYPTION_KEY=your-secure-encryption-key-change-this-in-production

# Окружение
NODE_ENV=development

# WebAuthn настройки
WEBAUTHN_RP_ID=localhost
PRODUCTION_ORIGIN=https://passwords.keremin.ru
DEV_ORIGIN=https://local.passwords.keremin.ru:3000
```

**Важно:**

- `TELEGRAM_BOT_SECRET` - токен Telegram бота (получить у [@BotFather](https://t.me/botfather))
- `TELEGRAM_USER_ID` - ваш Telegram user ID (можно узнать у [@userinfobot](https://t.me/userinfobot))
- `FILE_ENCRYPTION_KEY` - замените на случайную строку длиной минимум 32 символа

### Frontend (.env файл)

Frontend уже содержит настроенный файл `frontend/.env`:

```env
HOST=local.passwords.keremin.ru
PORT=3000
HTTPS=true
SSL_CRT_FILE=ssl/local.passwords.keremin.ru.crt
SSL_KEY_FILE=ssl/local.passwords.keremin.ru.key
DANGEROUSLY_DISABLE_HOST_CHECK=true
WDS_SOCKET_HOST=local.passwords.keremin.ru
WDS_SOCKET_PORT=3000
WDS_SOCKET_PROTOCOL=wss
```

**Примечание:** Frontend настроен на работу с HTTPS и использует SSL сертификаты из папки `frontend/ssl/`.

## Настройка SSL сертификатов

Приложение использует HTTPS в development режиме. SSL сертификаты уже предоставлены в папке `frontend/ssl/`:

- `frontend/ssl/local.passwords.keremin.ru.crt`
- `frontend/ssl/local.passwords.keremin.ru.key`

### Добавление домена в hosts (опционально)

Для корректной работы WebAuthn рекомендуется добавить домен в файл hosts:

```bash
# Linux/macOS
sudo echo "127.0.0.1 local.passwords.keremin.ru" >> /etc/hosts

# Windows (запустить как администратор)
echo 127.0.0.1 local.passwords.keremin.ru >> C:\Windows\System32\drivers\etc\hosts
```

## Запуск приложения

### Быстрый запуск (рекомендуется)

Используйте готовый скрипт для запуска в development режиме:

```bash
./dev.sh
```

Этот скрипт:

1. Останавливает все запущенные Node.js процессы
2. Запускает backend в development режиме (порт 60125)
3. Ждет готовности backend
4. Запускает frontend (порт 3000)

### Ручной запуск

#### 1. Запуск Backend

```bash
cd backend
npm run dev
```

Backend будет доступен на `http://localhost:60125`

#### 2. Запуск Frontend (в новом терминале)

```bash
cd frontend
npm run start
```

Frontend будет доступен на `https://local.passwords.keremin.ru:3000`

## Порты и URL

- **Backend API:** `http://localhost:60125`
- **Frontend:** `https://local.passwords.keremin.ru:3000`
- **Proxy:** Frontend автоматически проксирует API запросы к backend

## Доступные команды

### Backend

```bash
cd backend

# Development режим (авто-перезапуск при изменениях)
npm run dev

# Сборка TypeScript
npm run build

# Запуск production версии
npm run start

# Тесты
npm run test
```

### Frontend

```bash
cd frontend

# Development режим
npm run start

# Сборка для production
npm run build

# Тесты
npm run test

# Форматирование кода
npm run prettier:fix
```

### Корневая директория

```bash
# Запуск development режима (backend + frontend)
./dev.sh

# Сборка всего проекта
./build.sh
```

## Структура данных

Приложение сохраняет данные локально:

- **Пароли:** зашифрованы и хранятся в файловой системе backend
- **Сессии:** хранятся в памяти backend (сбрасываются при перезапуске)
- **Биометрические данные:** WebAuthn credentials в файловой системе backend

## Безопасность

- ✅ **HTTPS** обязателен для WebAuthn
- ✅ **Шифрование** всех сохраняемых данных
- ✅ **WebAuthn** для биометрической аутентификации
- ✅ **Rate limiting** на API endpoints
- ✅ **CORS** настройки
- ✅ **Helmet** для безопасности headers

## Решение проблем

### Порт уже занят

```bash
# Найти процесс, использующий порт
lsof -ti:60125  # для backend
lsof -ti:3000   # для frontend

# Остановить процесс
kill -9 <PID>

# Или использовать dev.sh (автоматически останавливает процессы)
./dev.sh
```

### Проблемы с SSL сертификатами

Если браузер блокирует самоподписанный сертификат:

1. Откройте `https://local.passwords.keremin.ru:3000`
2. Нажмите "Advanced" → "Proceed to local.passwords.keremin.ru (unsafe)"
3. Или добавьте сертификат в доверенные

### WebAuthn не работает

- Убедитесь, что используется HTTPS
- Проверьте, что домен добавлен в hosts файл
- Убедитесь, что `WEBAUTHN_RP_ID` соответствует домену

### Telegram интеграция не работает

- Проверьте правильность `TELEGRAM_BOT_SECRET` и `TELEGRAM_USER_ID`
- Убедитесь, что бот создан и активен
- Проверьте, что `ENABLE_TELEGRAM_BACKUP=true` если нужна интеграция

## Разработка

### Добавление новых переменных окружения

1. Добавьте переменную в `backend/.env.example`
2. Обновите `backend/src/env.ts` если переменная обязательная
3. Обновите эту документацию

### Тестирование

```bash
# Backend тесты
cd backend && npm test

# Frontend тесты
cd frontend && npm test
```

## Production Deploy

Для production используйте Docker или соберите приложение:

```bash
./build.sh
```

Подробнее см. документацию в `doc/` директории.
