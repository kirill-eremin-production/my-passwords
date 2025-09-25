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
    encryptMasterPasswordLocally,
    decryptMasterPasswordLocally
} from '../encryption/keyDerivation'
import { secureStorage } from '../utils/secureStorage'

const STORAGE_KEY = 'biometric_credentials'
const MASTER_PASSWORD_STORAGE_KEY = 'biometric_master_passwords'

/**
 * Сохраняет учетные данные в безопасное хранилище
 */
const saveCredentials = async (credentials: StoredCredential[]): Promise<void> => {
    try {
        await secureStorage.storeEncryptedData(STORAGE_KEY, JSON.stringify(credentials))
    } catch (error) {
        console.error('Ошибка сохранения учетных данных:', error)
        throw error
    }
}

/**
 * Сохраняет зашифрованные мастер-пароли в безопасное хранилище
 */
const saveMasterPasswords = async (masterPasswords: Record<string, string>): Promise<void> => {
    try {
        await secureStorage.storeEncryptedData(MASTER_PASSWORD_STORAGE_KEY, JSON.stringify(masterPasswords))
    } catch (error) {
        console.error('Ошибка сохранения зашифрованных мастер-паролей:', error)
        throw error
    }
}

/**
 * Загружает зашифрованные мастер-пароли из безопасного хранилища
 */
const loadMasterPasswords = async (): Promise<Record<string, string>> => {
    try {
        const stored = await secureStorage.getEncryptedData(MASTER_PASSWORD_STORAGE_KEY)
        return stored ? JSON.parse(stored) : {}
    } catch (error) {
        console.error('Ошибка загрузки зашифрованных мастер-паролей:', error)
        return {}
    }
}

/**
 * Загружает учетные данные из безопасного хранилища
 */
const loadCredentials = async (): Promise<StoredCredential[]> => {
    try {
        const stored = await secureStorage.getEncryptedData(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch (error) {
        console.error('Ошибка загрузки учетных данных:', error)
        return []
    }
}

/**
 * Проверяет, зарегистрированы ли биометрические учетные данные
 */
export const hasBiometricCredentials = async (): Promise<boolean> => {
    const credentials = await loadCredentials()
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

        const existingCredentials = await loadCredentials()
        const updatedCredentials = [...existingCredentials, storedCredential]
        await saveCredentials(updatedCredentials)

        // Если мастер-пароль передан, сохраняем его локально в зашифрованном виде
        if (masterPassword) {
            const encryptedMasterPassword = encryptMasterPasswordLocally(masterPassword, credential.id)
            
            // Сохраняем зашифрованный мастер-пароль в безопасное хранилище
            const masterPasswords = await loadMasterPasswords()
            masterPasswords[credential.id] = encryptedMasterPassword
            await saveMasterPasswords(masterPasswords)
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

    const credentials = await loadCredentials()
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

        // Получаем мастер-пароль из безопасного хранения
        const masterPasswords = await loadMasterPasswords()
        const encryptedMasterPassword = masterPasswords[assertion.id]
        
        if (!encryptedMasterPassword) {
            throw new Error('Мастер-пароль не найден для данной биометрической записи')
        }

        // Расшифровываем мастер-пароль локально
        const masterPassword = decryptMasterPasswordLocally(encryptedMasterPassword, assertion.id)

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
export const clearBiometricCredentials = async (): Promise<void> => {
    try {
        await secureStorage.removeData(STORAGE_KEY)
        await secureStorage.removeData(MASTER_PASSWORD_STORAGE_KEY)
    } catch (error) {
        console.error('Ошибка удаления учетных данных:', error)
        throw error
    }
}

/**
 * Получает информацию о зарегистрированных учетных данных
 */
export const getBiometricCredentialsInfo = async (): Promise<{ count: number; lastCreated?: string }> => {
    const credentials = await loadCredentials()
    const lastCreated = credentials.length > 0
        ? credentials[credentials.length - 1].createdAt
        : undefined

    return {
        count: credentials.length,
        lastCreated
    }
}