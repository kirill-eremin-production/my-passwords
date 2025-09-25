# 🚨 ЧЕКЛИСТ ИСПРАВЛЕНИЯ УЯЗВИМОСТЕЙ MY-PASSWORDS

**Статус:** АКТИВНЫЕ ЗАДАЧИ  
**Обновлено:** 25.09.2024  

---

## 🔴 КРИТИЧЕСКИЙ ПРИОРИТЕТ (НЕМЕДЛЕННО)

### ✅ Биометрическая аутентификация - ПОЛНАЯ КОМПРОМЕТАЦИЯ
**Файл:** `backend/src/handlers/biometric/authenticate.ts`  
**Задача:** Добавить полную проверку WebAuthn  
**Статус:** ❌ НЕ ИСПРАВЛЕНО  

**Действия:**
- [ ] Добавить проверку cryptographic signature
- [ ] Валидация challenge из clientDataJSON  
- [ ] Проверка origin в clientDataJSON
- [ ] Counter проверка для replay protection
- [ ] Обновление counter после успешной аутентификации

**Код для исправления:**
```javascript
// Добавить в authenticate.ts перед строкой 40:
const isValidSignature = await verifyWebAuthnSignature({
    signature: authData.signature,
    publicKey: credential.publicKey,
    challenge: storedChallenge,
    clientDataJSON: authData.clientDataJSON,
    authenticatorData: authData.authenticatorData
});

if (!isValidSignature) {
    res.status(403).json({ error: "Неверная подпись WebAuthn" });
    return;
}
```

---

## 🟠 ВЫСОКИЙ ПРИОРИТЕТ (В ТЕЧЕНИЕ НЕДЕЛИ)

### ✅ Слабое XOR шифрование мастер-пароля
**Файл:** `frontend/src/encryption/keyDerivation.ts`  
**Задача:** Заменить XOR на AES-GCM  
**Статус:** ❌ НЕ ИСПРАВЛЕНО  

**Действия:**
- [ ] Заменить функции `encryptMasterPasswordLocally` и `decryptMasterPasswordLocally`
- [ ] Использовать AES-GCM с случайной солью
- [ ] Добавить PBKDF2 с 100,000 итераций

### ✅ Небезопасное localStorage хранение
**Файл:** `frontend/src/api/biometric.ts`  
**Задача:** Заменить localStorage на IndexedDB  
**Статус:** ❌ НЕ ИСПРАВЛЕНО  

**Действия:**
- [ ] Создать класс SecureStorage с IndexedDB
- [ ] Добавить дополнительное шифрование через Web Crypto API
- [ ] Заменить все вызовы localStorage

### ✅ Отсутствие соли в AES
**Файл:** `frontend/src/encryption/toEncrypt.ts`  
**Задача:** Добавить случайную соль  
**Статус:** ❌ НЕ ИСПРАВЛЕНО  

**Действия:**
- [ ] Генерация случайной соли для каждого шифрования
- [ ] Использование PBKDF2 для деривации ключа
- [ ] Добавление IV для AES

### ✅ Отключить Telegram backup
**Файл:** `backend/src/handlers/passwords/post.ts`  
**Задача:** Убрать отправку данных в Telegram  
**Статус:** ❌ НЕ ИСПРАВЛЕНО  

**Действия:**
- [ ] Добавить переменную окружения ENABLE_TELEGRAM_BACKUP=false
- [ ] Условная отправка только в dev режиме
- [ ] Документировать риски Telegram backup

---

## 🟡 СРЕДНИЙ ПРИОРИТЕТ (В ТЕЧЕНИЕ МЕСЯЦА)

### ✅ Слабый генератор sessionId
**Файл:** `backend/src/middlewares/authorization/utils.ts`  
**Статус:** ❌ НЕ ИСПРАВЛЕНО  

**Действия:**
- [ ] Заменить Math.random() на crypto.randomBytes()
- [ ] Использовать 32 байта для генерации
- [ ] Добавить timestamp для уникальности

### ✅ Небезопасное файловое хранилище
**Файлы:** `backend/src/store.ts`, `backend/src/biometricStore.ts`  
**Статус:** ❌ НЕ ИСПРАВЛЕНО  

**Действия:**
- [ ] Создать класс EncryptedFileStore
- [ ] Шифрование файлов AES-256-CBC
- [ ] Установить права доступа 0o600
- [ ] Переменная окружения для ключа шифрования

### ✅ Rate limiting
**Файлы:** Все API endpoints  
**Статус:** ❌ НЕ ИСПРАВЛЕНО  

**Действия:**
- [ ] Установить express-rate-limit
- [ ] 5 запросов кодов за 15 минут
- [ ] 10 биометрических попыток за минуту
- [ ] Логирование подозрительной активности

### ✅ CSRF protection
**Файлы:** Все формы и API  
**Статус:** ❌ НЕ ИСПРАВЛЕНО  

**Действия:**
- [ ] Добавить CSRF токены
- [ ] Secure cookies (httpOnly, secure, sameSite)
- [ ] Content Security Policy headers

---

## 📋 СТАТУС ВЫПОЛНЕНИЯ

### Общий прогресс: 0/8 задач выполнено (0%)

**Критический риск:** 1/1 ❌  
**Высокий риск:** 0/4 ❌  
**Средний риск:** 0/3 ❌  

---

## 🔧 БЫСТРЫЕ КОМАНДЫ ДЛЯ РАЗРАБОТЧИКА

### Установка зависимостей:
```bash
# Backend
npm install express-rate-limit helmet cors

# Frontend  
npm install @types/crypto-js
```

### Переменные окружения (.env):
```bash
# Добавить в backend/.env
FILE_ENCRYPTION_KEY=your-secure-encryption-key-here
ENABLE_TELEGRAM_BACKUP=false
NODE_ENV=production
```

### Проверка исправлений:
```bash
# Запуск тестов безопасности
npm run test:security

# Проверка WebAuthn
curl -X POST localhost:3000/api/biometric/authenticate \
  -H "Content-Type: application/json" \
  -d '{"data":{"credentialId":"test","signature":"invalid"}}'
```

---

## ⚠️ КРИТИЧЕСКИЕ НАПОМИНАНИЯ

1. **НЕ ДЕПЛОИТЬ** пока не исправлена биометрическая аутентификация
2. **ОТКЛЮЧИТЬ TELEGRAM** backup в production немедленно  
3. **СОЗДАТЬ BACKUP** базы данных перед изменениями
4. **ПРОТЕСТИРОВАТЬ** каждое исправление в dev окружении
5. **ПРОВЕСТИ ПОВТОРНЫЙ АУДИТ** после исправлений

---

## 📞 КОНТАКТЫ

**Вопросы по исправлениям:** Kilo Code  
**Полный отчет:** `memory-bank/security-audit-report.md`  
**Дата следующей проверки:** После исправления критических уязвимостей