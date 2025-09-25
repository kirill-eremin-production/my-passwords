import { StoredCredential } from '../types/webauthn'
import {
    generateChallenge,
    generateUserId,
    arrayBufferToBase64,
    base64ToArrayBuffer,
    isWebAuthnSupported,
    isPlatformAuthenticatorAvailable
} from '../utils/webauthn'
import { registerBiometric as registerBiometricAPI } from './biometricRegister'
import { authenticateWithBiometric as authenticateBiometricAPI } from './biometricAuthenticate'
import {
    generateBiometricStorageKey,
    encryptMasterPasswordLocally,
    decryptMasterPasswordLocally
} from '../encryption/keyDerivation'

const STORAGE_KEY = 'biometric_credentials'
const MASTER_PASSWORD_STORAGE_KEY = 'biometric_master_passwords'

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
 * Сохраняет зашифрованные мастер-пароли в localStorage
 */
const saveMasterPasswords = (masterPasswords: Record<string, string>): void => {
    try {
        localStorage.setItem(MASTER_PASSWORD_STORAGE_KEY, JSON.stringify(masterPasswords))
    } catch (error) {
        console.error('Ошибка сохранения зашифрованных мастер-паролей:', error)
    }
}

/**
 * Загружает зашифрованные мастер-пароли из localStorage
 */
const loadMasterPasswords = (): Record<string, string> => {
    try {
        const stored = localStorage.getItem(MASTER_PASSWORD_STORAGE_KEY)
        return stored ? JSON.parse(stored) : {}
    } catch (error) {
        console.error('Ошибка загрузки зашифрованных мастер-паролей:', error)
        return {}
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
 * Регистрирует новые биометрические учетные данные с мастер-паролем
 */
export const registerBiometric = async (username: string = 'user', masterPassword?: string): Promise<boolean> => {
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
        
        // Сохраняем метаданные учетных данных локально
        const storedCredential: StoredCredential = {
            id: credential.id,
            publicKey: arrayBufferToBase64(credential.rawId),
            counter: 0,
            createdAt: new Date().toISOString()
        }

        const existingCredentials = loadCredentials()
        const updatedCredentials = [...existingCredentials, storedCredential]
        saveCredentials(updatedCredentials)

        // Если мастер-пароль передан, сохраняем его локально в зашифрованном виде
        if (masterPassword) {
            const storageKey = generateBiometricStorageKey(credential.id)
            const encryptedMasterPassword = encryptMasterPasswordLocally(masterPassword, storageKey)
            
            // Сохраняем зашифрованный мастер-пароль в localStorage
            const masterPasswords = loadMasterPasswords()
            masterPasswords[credential.id] = encryptedMasterPassword
            saveMasterPasswords(masterPasswords)
        }

        // Отправляем только метаданные на сервер (БЕЗ мастер-пароля!)
        const registrationData = {
            credentialId: credential.id,
            publicKey: arrayBufferToBase64(credential.rawId),
            authenticatorData: arrayBufferToBase64(response.getAuthenticatorData()),
            clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
            attestationObject: arrayBufferToBase64(response.attestationObject)
            // masterPassword УДАЛЕН для безопасности!
        }

        const result = await registerBiometricAPI(registrationData)
        
        if (typeof result === 'number') {
            throw new Error(`Ошибка регистрации на сервере: ${result}`)
        }

        if (!result.success) {
            throw new Error(result.message || 'Ошибка регистрации биометрии')
        }

        return true
    } catch (error) {
        console.error('Ошибка регистрации биометрических данных:', error)
        throw error
    }
}

/**
 * Аутентификация с помощью биометрических данных
 * Получает мастер-пароль из локального хранения (БЕЗ сервера!)
 */
export const authenticateWithBiometric = async (): Promise<{ success: boolean; masterPassword?: string }> => {
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

        // Получаем мастер-пароль из локального хранения
        const masterPasswords = loadMasterPasswords()
        const encryptedMasterPassword = masterPasswords[assertion.id]
        
        if (!encryptedMasterPassword) {
            throw new Error('Мастер-пароль не найден для данной биометрической записи')
        }

        // Расшифровываем мастер-пароль локально
        const storageKey = generateBiometricStorageKey(assertion.id)
        const masterPassword = decryptMasterPasswordLocally(encryptedMasterPassword, storageKey)

        // Приводим тип response к правильному
        const response = assertion.response as AuthenticatorAssertionResponse

        // Отправляем только метаданные на сервер для проверки сессии (БЕЗ мастер-пароля!)
        const authenticationData = {
            credentialId: assertion.id,
            authenticatorData: arrayBufferToBase64(response.authenticatorData),
            clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
            signature: arrayBufferToBase64(response.signature),
            userHandle: response.userHandle ? arrayBufferToBase64(response.userHandle) : undefined
        }

        const result = await authenticateBiometricAPI(authenticationData)
        
        if (typeof result === 'number') {
            throw new Error(`Ошибка аутентификации на сервере: ${result}`)
        }

        if (!result.success) {
            throw new Error(result.message || 'Ошибка биометрической аутентификации')
        }

        return {
            success: true,
            masterPassword: masterPassword // Получено локально, не с сервера!
        }
    } catch (error) {
        console.error('Ошибка биометрической аутентификации:', error)
        throw error
    }
}

/**
 * Удаляет все биометрические учетные данные и зашифрованные мастер-пароли
 */
export const clearBiometricCredentials = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(MASTER_PASSWORD_STORAGE_KEY)
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