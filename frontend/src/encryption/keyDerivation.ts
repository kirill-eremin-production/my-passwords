import { SHA256 } from 'crypto-js'

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
 * Шифрует мастер-пароль для локального хранения
 */
export function encryptMasterPasswordLocally(masterPassword: string, storageKey: string): string {
    // Простое XOR шифрование с Base64 кодированием для локального хранения
    const encrypted = Array.from(masterPassword)
        .map((char, i) => String.fromCharCode(
            char.charCodeAt(0) ^ storageKey.charCodeAt(i % storageKey.length)
        ))
        .join('')
    
    return btoa(encrypted)
}

/**
 * Расшифровывает мастер-пароль из локального хранения
 */
export function decryptMasterPasswordLocally(encryptedPassword: string, storageKey: string): string {
    try {
        const encrypted = atob(encryptedPassword)
        
        return Array.from(encrypted)
            .map((char, i) => String.fromCharCode(
                char.charCodeAt(0) ^ storageKey.charCodeAt(i % storageKey.length)
            ))
            .join('')
    } catch (error) {
        throw new Error('Не удалось расшифровать мастер-пароль')
    }
}