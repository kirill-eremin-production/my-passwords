import { AES, HmacSHA256, PBKDF2, SHA256, enc, lib, mode, pad } from 'crypto-js'

/**
 * Интерфейс для результата валидации мастер-пароля
 */
export interface PasswordValidationResult {
    isValid: boolean
    errors: string[]
    strength: 'weak' | 'medium' | 'strong' | 'very-strong'
    score: number // 0-100
}

/**
 * Валидирует мастер-пароль на соответствие требованиям безопасности
 */
export function validateMasterPassword(
    password: string
): PasswordValidationResult {
    const errors: string[] = []
    let score = 0

    // Проверка минимальной длины
    if (password.length < 8) {
        errors.push('Пароль должен содержать минимум 8 символов')
    } else if (password.length >= 12) {
        score += 25 // Бонус за длину 12+
    } else if (password.length >= 10) {
        score += 15 // Бонус за длину 10+
    } else {
        score += 5 // Минимальный бонус за длину 8+
    }

    // Проверка сложности
    const hasLowerCase = /[a-z]/.test(password)
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
        password
    )

    if (!hasLowerCase) errors.push('Пароль должен содержать строчные буквы')
    if (!hasUpperCase) errors.push('Пароль должен содержать заглавные буквы')
    if (!hasNumbers) errors.push('Пароль должен содержать цифры')
    if (!hasSpecialChars)
        errors.push('Пароль должен содержать специальные символы')

    // Подсчет баллов за разнообразие символов
    const charTypes = [
        hasLowerCase,
        hasUpperCase,
        hasNumbers,
        hasSpecialChars,
    ].filter(Boolean).length
    score += charTypes * 10

    // Проверка на простые паттерны
    if (/(.)\1{2,}/.test(password)) {
        errors.push('Пароль не должен содержать повторяющиеся символы подряд')
        score -= 10
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
        errors.push('Пароль содержит очевидные последовательности')
        score -= 20
    }

    // Проверка энтропии (разнообразие символов)
    const uniqueChars = new Set(password).size
    const entropyBonus = Math.min(uniqueChars * 2, 30)
    score += entropyBonus

    // Бонус за длину
    if (password.length > 16) {
        score += 10
    }

    // Ограничиваем score в пределах 0-100
    score = Math.max(0, Math.min(100, score))

    // Определяем силу пароля
    let strength: 'weak' | 'medium' | 'strong' | 'very-strong'
    if (score < 30) {
        strength = 'weak'
    } else if (score < 60) {
        strength = 'medium'
    } else if (score < 80) {
        strength = 'strong'
    } else {
        strength = 'very-strong'
    }

    const isValid = errors.length === 0 && score >= 50 // Минимальный порог для валидности

    return {
        isValid,
        errors,
        strength,
        score,
    }
}

/**
 * Проверяет, не является ли пароль слишком простым или скомпрометированным
 */
export function checkPasswordSecurity(password: string): {
    isSecure: boolean
    warnings: string[]
} {
    const warnings: string[] = []

    // Список часто используемых паролей (базовая проверка)
    const commonPasswords = [
        'password',
        '123456',
        '123456789',
        'qwerty',
        'abc123',
        'password123',
        'admin',
        'letmein',
        'welcome',
        '1234567890',
        'пароль',
        '123',
        'qwe123',
        'йцукен',
    ]

    if (
        commonPasswords.some((common) =>
            password.toLowerCase().includes(common)
        )
    ) {
        warnings.push('Пароль содержит часто используемые комбинации')
    }

    // Проверка на дату в пароле
    if (/19\d{2}|20\d{2}/.test(password)) {
        warnings.push('Избегайте использования дат в пароле')
    }

    // Проверка на персональную информацию (базовая)
    if (/name|имя|фамилия|birthday|день|месяц/.test(password.toLowerCase())) {
        warnings.push('Избегайте использования личной информации')
    }

    return {
        isSecure: warnings.length === 0,
        warnings,
    }
}

/**
 * Генерирует производный ключ из мастер-пароля для безопасного локального хранения
 * Использует PBKDF2-подобный подход с множественным хешированием
 */
export function deriveBiometricKey(
    masterPassword: string,
    credentialId: string
): string {
    // Создаем детерминированную соль на основе credentialId для стабильности ключа
    // (важно: одинаковый credentialId должен давать одинаковую соль)
    const salt = SHA256(credentialId + 'biometric-salt-v2-2024').toString()

    // Комбинируем мастер-пароль с солью
    let derivedKey = masterPassword + salt

    // Многократное хеширование для усиления безопасности (10000 итераций)
    for (let i = 0; i < 10000; i++) {
        derivedKey = SHA256(derivedKey).toString()
    }

    return derivedKey
}

/**
 * Генерирует ключ шифрования для хранения мастер-пароля
 * зашифрованным для биометрической аутентификации
 */
export function generateBiometricStorageKey(credentialId: string): string {
    // Создаем ключ шифрования на основе credential ID с улучшенной солью
    return SHA256(credentialId + 'storage-key-v2-2024').toString()
}

/**
 * Безопасно шифрует мастер-пароль для локального хранения
 * Использует AES-CBC с PBKDF2 и случайной солью
 */
export function encryptMasterPasswordLocally(
    masterPassword: string,
    credentialId: string
): string {
    try {
        // Генерация криптографически стойкой случайной соли (256 бит)
        const salt = lib.WordArray.random(256 / 8)

        // Деривация ключа с PBKDF2 (100,000 итераций) + улучшенная версионная соль
        const key = PBKDF2(credentialId + 'master-key-v2-2024', salt, {
            keySize: 256 / 32,
            iterations: 100000,
        })

        // Генерация случайного IV для AES-CBC (128 бит)
        const iv = lib.WordArray.random(128 / 8)

        // AES-CBC шифрование с PKCS7 padding
        const encrypted = AES.encrypt(masterPassword, key, {
            iv: iv,
            mode: mode.CBC,
            padding: pad.Pkcs7,
        })

        // Генерация HMAC для проверки целостности
        const hmacKey = PBKDF2(credentialId + 'hmac-key-v2-2024', salt, {
            keySize: 256 / 32,
            iterations: 100000,
        })
        const hmac = HmacSHA256(encrypted.toString(), hmacKey).toString()

        // Объединение всех компонентов с версионированием
        const combined = {
            version: '2.0', // Добавляем версию для будущих миграций
            salt: salt.toString(),
            iv: iv.toString(),
            encrypted: encrypted.toString(),
            hmac: hmac,
            timestamp: Date.now(), // Добавляем timestamp для отладки
        }

        return btoa(JSON.stringify(combined))
    } catch (error) {
        console.error('Ошибка шифрования мастер-пароля:', error)
        throw new Error('Не удалось зашифровать мастер-пароль')
    }
}

/**
 * Безопасно расшифровывает мастер-пароль из локального хранения
 * Поддерживает разные версии шифрования для обратной совместимости
 */
export function decryptMasterPasswordLocally(
    encryptedData: string,
    credentialId: string
): string {
    try {
        // Парсинг данных
        const combined = JSON.parse(atob(encryptedData))
        const salt = enc.Hex.parse(combined.salt)
        const iv = enc.Hex.parse(combined.iv)

        // Определяем версию для обратной совместимости
        const version = combined.version || '1.0'
        const keyPrefix =
            version === '2.0' ? 'master-key-v2-2024' : 'master-key-2024'
        const hmacPrefix =
            version === '2.0' ? 'hmac-key-v2-2024' : 'hmac-key-2024'

        // Восстановление ключей с правильными параметрами для версии
        const key = PBKDF2(credentialId + keyPrefix, salt, {
            keySize: 256 / 32,
            iterations: 100000,
        })

        const hmacKey = PBKDF2(credentialId + hmacPrefix, salt, {
            keySize: 256 / 32,
            iterations: 100000,
        })

        // Проверка HMAC для проверки целостности
        const expectedHmac = HmacSHA256(combined.encrypted, hmacKey).toString()
        if (expectedHmac !== combined.hmac) {
            throw new Error(
                'Неверный HMAC - данные могли быть изменены или повреждены'
            )
        }

        // AES-CBC расшифрование
        const decrypted = AES.decrypt(combined.encrypted, key, {
            iv: iv,
            mode: mode.CBC,
            padding: pad.Pkcs7,
        })

        const decryptedText = decrypted.toString(enc.Utf8)

        if (!decryptedText) {
            throw new Error('Неверный ключ расшифровки или поврежденные данные')
        }

        return decryptedText
    } catch (error) {
        console.error('Ошибка расшифровки мастер-пароля:', error)
        throw new Error('Не удалось расшифровать мастер-пароль')
    }
}
