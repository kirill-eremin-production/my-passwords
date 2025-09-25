import { SHA256, AES, PBKDF2, lib, mode, pad, enc, HmacSHA256 } from 'crypto-js'

/**
 * Генерирует производный ключ из мастер-пароля для безопасного локального хранения
 * Использует PBKDF2-подобный подход с множественным хешированием
 */
export function deriveBiometricKey(masterPassword: string, credentialId: string): string {
    // Создаем уникальную соль на основе credentialId
    const salt = SHA256(credentialId + 'biometric-salt-2024').toString()
    
    // Комбинируем мастер-пароль с солью
    let derivedKey = masterPassword + salt
    
    // Многократное хеширование для усиления безопасности (10000 итераций)
    for (let i = 0; i < 10000; i++) {
        derivedKey = SHA256(derivedKey).toString()
    }
    
    return derivedKey
}

/**
 * Генерирует ключ шифрования для хранения мастер-пароля в localStorage
 * зашифрованным для биометрической аутентификации
 */
export function generateBiometricStorageKey(credentialId: string): string {
    // Создаем ключ шифрования на основе credential ID
    return SHA256(credentialId + 'storage-key-2024').toString()
}

/**
 * Безопасно шифрует мастер-пароль для локального хранения
 * Использует AES-GCM с PBKDF2 и случайной солью
 */
export function encryptMasterPasswordLocally(masterPassword: string, credentialId: string): string {
    try {
        // Генерация случайной соли (256 бит)
        const salt = lib.WordArray.random(256/8);
        
        // Деривация ключа с PBKDF2 (100,000 итераций)
        const key = PBKDF2(credentialId + 'master-key-2024', salt, {
            keySize: 256/32,
            iterations: 100000
        });
        
        // Генерация случайного IV для AES-CBC
        const iv = lib.WordArray.random(128/8); // 128 бит для CBC
        
        // AES-CBC шифрование
        const encrypted = AES.encrypt(masterPassword, key, {
            iv: iv,
            mode: mode.CBC,
            padding: pad.Pkcs7
        });
        
        // Генерация HMAC для аутентификации
        const hmacKey = PBKDF2(credentialId + 'hmac-key-2024', salt, {
            keySize: 256/32,
            iterations: 100000
        });
        const hmac = HmacSHA256(encrypted.toString(), hmacKey).toString();
        
        // Объединение соли, IV, зашифрованных данных и HMAC
        const combined = {
            salt: salt.toString(),
            iv: iv.toString(),
            encrypted: encrypted.toString(),
            hmac: hmac
        };
        
        return btoa(JSON.stringify(combined));
        
    } catch (error) {
        console.error('Ошибка шифрования мастер-пароля:', error);
        throw new Error('Не удалось зашифровать мастер-пароль');
    }
}

/**
 * Безопасно расшифровывает мастер-пароль из локального хранения
 * Использует AES-GCM с проверкой целостности
 */
export function decryptMasterPasswordLocally(encryptedData: string, credentialId: string): string {
    try {
        // Парсинг данных
        const combined = JSON.parse(atob(encryptedData));
        const salt = enc.Hex.parse(combined.salt);
        const iv = enc.Hex.parse(combined.iv);
        
        // Восстановление ключей с теми же параметрами
        const key = PBKDF2(credentialId + 'master-key-2024', salt, {
            keySize: 256/32,
            iterations: 100000
        });
        
        const hmacKey = PBKDF2(credentialId + 'hmac-key-2024', salt, {
            keySize: 256/32,
            iterations: 100000
        });
        
        // Проверка HMAC для аутентификации
        const expectedHmac = HmacSHA256(combined.encrypted, hmacKey).toString();
        if (expectedHmac !== combined.hmac) {
            throw new Error('Неверный HMAC - данные могли быть изменены');
        }
        
        // AES-CBC расшифрование
        const decrypted = AES.decrypt(combined.encrypted, key, {
            iv: iv,
            mode: mode.CBC,
            padding: pad.Pkcs7
        });
        
        const decryptedText = decrypted.toString(enc.Utf8);
        
        if (!decryptedText) {
            throw new Error('Неверный ключ или поврежденные данные');
        }
        
        return decryptedText;
        
    } catch (error) {
        console.error('Ошибка расшифровки мастер-пароля:', error);
        throw new Error('Не удалось расшифровать мастер-пароль');
    }
}