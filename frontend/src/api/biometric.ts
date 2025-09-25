import { StoredCredential } from '../types/webauthn'
import {
    generateChallenge,
    generateUserId,
    arrayBufferToBase64,
    base64ToArrayBuffer,
    isWebAuthnSupported,
    isPlatformAuthenticatorAvailable
} from '../utils/webauthn'

const STORAGE_KEY = 'biometric_credentials'

/**
 * Сохраняет учетные данные в localStorage
 */
const saveCredentials = (credentials: StoredCredential[]): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
    } catch (error) {
        console.error('Ошибка сохранения учетных данных:', error)
    }
}

/**
 * Загружает учетные данные из localStorage
 */
const loadCredentials = (): StoredCredential[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch (error) {
        console.error('Ошибка загрузки учетных данных:', error)
        return []
    }
}

/**
 * Проверяет, зарегистрированы ли биометрические учетные данные
 */
export const hasBiometricCredentials = (): boolean => {
    const credentials = loadCredentials()
    return credentials.length > 0
}

/**
 * Регистрирует новые биометрические учетные данные
 */
export const registerBiometric = async (username: string = 'user'): Promise<boolean> => {
    if (!isWebAuthnSupported()) {
        throw new Error('WebAuthn не поддерживается')
    }

    if (!(await isPlatformAuthenticatorAvailable())) {
        throw new Error('Платформенный аутентификатор недоступен')
    }

    try {
        const challenge = generateChallenge()
        const userId = generateUserId()

        const registrationOptions: PublicKeyCredentialCreationOptions = {
            challenge,
            rp: {
                name: 'My Passwords',
                id: window.location.hostname
            },
            user: {
                id: userId,
                name: username,
                displayName: username
            },
            pubKeyCredParams: [
                { type: 'public-key', alg: -7 },  // ES256
                { type: 'public-key', alg: -257 } // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required',
                requireResidentKey: false
            },
            timeout: 60000,
            attestation: 'none'
        }

        const credential = await navigator.credentials.create({
            publicKey: registrationOptions
        }) as PublicKeyCredential

        if (!credential) {
            throw new Error('Не удалось создать учетные данные')
        }

        const response = credential.response as AuthenticatorAttestationResponse
        
        // Сохраняем ID учетных данных и метаданные
        const storedCredential: StoredCredential = {
            id: credential.id,
            publicKey: arrayBufferToBase64(credential.rawId), // Используем rawId вместо publicKey
            counter: 0,
            createdAt: new Date().toISOString()
        }

        const existingCredentials = loadCredentials()
        const updatedCredentials = [...existingCredentials, storedCredential]
        saveCredentials(updatedCredentials)

        return true
    } catch (error) {
        console.error('Ошибка регистрации биометрических данных:', error)
        throw error
    }
}

/**
 * Аутентификация с помощью биометрических данных
 */
export const authenticateWithBiometric = async (): Promise<boolean> => {
    if (!isWebAuthnSupported()) {
        throw new Error('WebAuthn не поддерживается')
    }

    if (!(await isPlatformAuthenticatorAvailable())) {
        throw new Error('Платформенный аутентификатор недоступен')
    }

    const credentials = loadCredentials()
    if (credentials.length === 0) {
        throw new Error('Биометрические учетные данные не найдены')
    }

    try {
        const challenge = generateChallenge()

        const authenticationOptions: PublicKeyCredentialRequestOptions = {
            challenge,
            allowCredentials: credentials.map(cred => ({
                type: 'public-key' as const,
                id: base64ToArrayBuffer(cred.publicKey) // Используем сохраненный publicKey как id
            })),
            timeout: 60000,
            userVerification: 'required'
        }

        const assertion = await navigator.credentials.get({
            publicKey: authenticationOptions
        }) as PublicKeyCredential

        if (!assertion) {
            throw new Error('Аутентификация не удалась')
        }

        // В реальном приложении здесь должна быть проверка подписи на сервере
        // Для демонстрации просто проверяем, что assertion получен
        return true
    } catch (error) {
        console.error('Ошибка биометрической аутентификации:', error)
        throw error
    }
}

/**
 * Удаляет все биометрические учетные данные
 */
export const clearBiometricCredentials = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
        console.error('Ошибка удаления учетных данных:', error)
    }
}

/**
 * Получает информацию о зарегистрированных учетных данных
 */
export const getBiometricCredentialsInfo = (): { count: number; lastCreated?: string } => {
    const credentials = loadCredentials()
    const lastCreated = credentials.length > 0 
        ? credentials[credentials.length - 1].createdAt 
        : undefined

    return {
        count: credentials.length,
        lastCreated
    }
}