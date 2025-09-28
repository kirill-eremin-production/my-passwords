import { StoredCredential } from '../types/webauthn'

import { secureStorage } from '../utils/secureStorage'
import {
    arrayBufferToBase64,
    base64ToArrayBuffer,
    generateChallenge,
    generateUserId,
    isPlatformAuthenticatorAvailable,
    isWebAuthnSupported,
} from '../utils/webauthn'

import {
    decryptMasterPasswordLocally,
    encryptMasterPasswordLocally,
} from '../encryption/keyDerivation'

import { authenticateWithBiometric as authenticateBiometricAPI } from './biometricAuthenticate'
import { registerBiometric as registerBiometricAPI } from './biometricRegister'
import { getBiometricChallenge } from './getBiometricChallenge'

const STORAGE_KEY = 'biometric_credentials'
const MASTER_PASSWORD_STORAGE_KEY = 'biometric_master_passwords'

/**
 * Сохраняет учетные данные в безопасное хранилище
 */
const saveCredentials = async (
    credentials: StoredCredential[]
): Promise<void> => {
    try {
        console.log('🔄 saveCredentials: начинаем сохранение credentials...')
        await secureStorage.storeEncryptedData(
            STORAGE_KEY,
            JSON.stringify(credentials)
        )
        console.log('✅ saveCredentials: успешно сохранено')
    } catch (error) {
        console.error(
            '❌ saveCredentials: ошибка сохранения учетных данных:',
            error
        )
        throw error
    }
}

/**
 * Сохраняет зашифрованные мастер-пароли в безопасное хранилище
 */
const saveMasterPasswords = async (
    masterPasswords: Record<string, string>
): Promise<void> => {
    try {
        console.log(
            '🔄 saveMasterPasswords: начинаем сохранение мастер-паролей...'
        )
        await secureStorage.storeEncryptedData(
            MASTER_PASSWORD_STORAGE_KEY,
            JSON.stringify(masterPasswords)
        )
        console.log('✅ saveMasterPasswords: успешно сохранено')
    } catch (error) {
        console.error(
            '❌ saveMasterPasswords: ошибка сохранения зашифрованных мастер-паролей:',
            error
        )
        throw error
    }
}

/**
 * Загружает зашифрованные мастер-пароли из безопасного хранилища
 */
const loadMasterPasswords = async (): Promise<Record<string, string>> => {
    try {
        const stored = await secureStorage.getEncryptedData(
            MASTER_PASSWORD_STORAGE_KEY
        )
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
        console.log('🔄 loadCredentials: загружаем credentials...')
        const stored = await secureStorage.getEncryptedData(STORAGE_KEY)
        const result = stored ? JSON.parse(stored) : []
        console.log('✅ loadCredentials: загружено:', result)
        return result
    } catch (error) {
        console.error(
            '❌ loadCredentials: ошибка загрузки учетных данных:',
            error
        )
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
export const registerBiometric = async (
    username: string = 'user',
    masterPassword?: string
): Promise<{ success: boolean; message?: string } | number> => {
    console.log('🚀 Старт регистрации биометрии')

    if (!isWebAuthnSupported()) {
        console.error('❌ WebAuthn не поддерживается')
        throw new Error('WebAuthn не поддерживается')
    }
    console.log('✅ WebAuthn поддерживается')

    const platformAuthAvailable = await isPlatformAuthenticatorAvailable()
    console.log(
        '🔍 Проверка платформенного аутентификатора:',
        platformAuthAvailable
    )

    if (!platformAuthAvailable) {
        console.error('❌ Платформенный аутентификатор недоступен')
        throw new Error('Платформенный аутентификатор недоступен')
    }
    console.log('✅ Платформенный аутентификатор доступен')

    try {
        console.log(
            '🔄 Начинаем регистрацию биометрии для пользователя:',
            username
        )

        const challenge = generateChallenge()
        const userId = generateUserId()

        console.log('✅ Сгенерированы challenge и userId')

        const registrationOptions: PublicKeyCredentialCreationOptions = {
            challenge,
            rp: {
                name: 'My Passwords',
                id: 'local.passwords.keremin.ru',
            },
            user: {
                id: userId,
                name: username,
                displayName: username,
            },
            pubKeyCredParams: [
                { type: 'public-key', alg: -7 }, // ES256
                { type: 'public-key', alg: -257 }, // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required',
                requireResidentKey: false,
            },
            timeout: 60000,
            attestation: 'none',
        }

        console.log('✅ Созданы параметры регистрации:', registrationOptions)
        console.log('🔄 Вызываем navigator.credentials.create()...')

        const credential = (await navigator.credentials.create({
            publicKey: registrationOptions,
        })) as PublicKeyCredential

        console.log('✅ Credential создан успешно:', credential)

        if (!credential) {
            console.error('❌ Credential не создан')
            throw new Error('Не удалось создать учетные данные')
        }

        console.log('🔄 Получаем response из credential...')
        const response = credential.response as AuthenticatorAttestationResponse
        console.log('✅ Response получен:', response)

        // Сохраняем метаданные учетных данных локально
        console.log('🔄 Создаем storedCredential...')
        const storedCredential: StoredCredential = {
            id: credential.id,
            publicKey: arrayBufferToBase64(credential.rawId),
            counter: 0,
            createdAt: new Date().toISOString(),
        }
        console.log('✅ storedCredential создан:', storedCredential)

        console.log('🔄 Загружаем существующие credentials...')
        const existingCredentials = await loadCredentials()
        console.log(
            '✅ Существующие credentials загружены:',
            existingCredentials
        )

        const updatedCredentials = [...existingCredentials, storedCredential]
        console.log('🔄 Сохраняем обновленные credentials...')
        await saveCredentials(updatedCredentials)
        console.log('✅ Credentials сохранены')

        // Если мастер-пароль передан, сохраняем его локально в зашифрованном виде
        if (masterPassword) {
            console.log('🔄 Шифруем и сохраняем мастер-пароль...')
            const encryptedMasterPassword = encryptMasterPasswordLocally(
                masterPassword,
                credential.id
            )
            console.log('✅ Мастер-пароль зашифрован')

            // Сохраняем зашифрованный мастер-пароль в безопасное хранилище
            const masterPasswords = await loadMasterPasswords()
            masterPasswords[credential.id] = encryptedMasterPassword
            await saveMasterPasswords(masterPasswords)
            console.log('✅ Зашифрованный мастер-пароль сохранен')
        }

        // Отправляем только метаданные на сервер (БЕЗ мастер-пароля!)
        console.log('🔄 Подготавливаем данные для отправки на сервер...')
        const registrationData = {
            credentialId: credential.id,
            publicKey: arrayBufferToBase64(credential.rawId),
            authenticatorData: arrayBufferToBase64(
                response.getAuthenticatorData()
            ),
            clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
            attestationObject: arrayBufferToBase64(response.attestationObject),
            // masterPassword УДАЛЕН для безопасности!
        }
        console.log('✅ Данные подготовлены:', registrationData)

        console.log('🔄 Отправляем запрос на сервер...')
        const result = await registerBiometricAPI(registrationData)
        console.log('✅ Ответ от сервера получен:', result)

        if (typeof result === 'number') {
            return result // Возвращаем код ошибки
        }

        if (!result.success) {
            return result // Возвращаем объект с ошибкой
        }

        console.log('🎉 Биометрия успешно зарегистрирована')
        return { success: true, message: 'Биометрия успешно зарегистрирована' }
    } catch (error) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА регистрации биометрии:', error)
        console.error('Детали ошибки:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        })
        throw error
    }
}

/**
 * Аутентификация с помощью биометрических данных
 * Получает мастер-пароль из локального хранения (БЕЗ сервера!)
 */
export const authenticateWithBiometric = async (): Promise<{
    success: boolean
    masterPassword?: string
}> => {
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
        console.log('🔄 Получаем challenge с сервера...')
        const challengeResponse = await getBiometricChallenge()

        if (typeof challengeResponse === 'number') {
            throw new Error(`Ошибка получения challenge: ${challengeResponse}`)
        }

        if (!challengeResponse.success) {
            throw new Error('Не удалось получить challenge с сервера')
        }

        console.log('✅ Challenge получен с сервера')
        const challenge = base64ToArrayBuffer(challengeResponse.challenge)

        const authenticationOptions: PublicKeyCredentialRequestOptions = {
            challenge,
            allowCredentials: credentials.map((cred) => ({
                type: 'public-key' as const,
                id: base64ToArrayBuffer(cred.publicKey), // Используем сохраненный publicKey как id
            })),
            timeout: 60000,
            userVerification: 'required',
        }

        console.log('🔄 Выполняем WebAuthn аутентификацию...')
        const assertion = (await navigator.credentials.get({
            publicKey: authenticationOptions,
        })) as PublicKeyCredential

        console.log('✅ WebAuthn аутентификация успешна')

        if (!assertion) {
            throw new Error('Аутентификация не удалась')
        }

        // Получаем мастер-пароль из безопасного хранения
        const masterPasswords = await loadMasterPasswords()
        const encryptedMasterPassword = masterPasswords[assertion.id]

        if (!encryptedMasterPassword) {
            throw new Error(
                'Мастер-пароль не найден для данной биометрической записи'
            )
        }

        // Расшифровываем мастер-пароль локально
        const masterPassword = decryptMasterPasswordLocally(
            encryptedMasterPassword,
            assertion.id
        )

        // Приводим тип response к правильному
        const response = assertion.response as AuthenticatorAssertionResponse

        // Отправляем только метаданные на сервер для проверки сессии (БЕЗ мастер-пароля!)
        const authenticationData = {
            credentialId: assertion.id,
            authenticatorData: arrayBufferToBase64(response.authenticatorData),
            clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
            signature: arrayBufferToBase64(response.signature),
            userHandle: response.userHandle
                ? arrayBufferToBase64(response.userHandle)
                : undefined,
        }

        const result = await authenticateBiometricAPI(authenticationData)

        if (typeof result === 'number') {
            throw new Error(`Ошибка аутентификации на сервере: ${result}`)
        }

        if (!result.success) {
            throw new Error(
                result.message || 'Ошибка биометрической аутентификации'
            )
        }

        return {
            success: true,
            masterPassword: masterPassword, // Получено локально, не с сервера!
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
export const getBiometricCredentialsInfo = async (): Promise<{
    count: number
    lastCreated?: string
}> => {
    const credentials = await loadCredentials()
    const lastCreated =
        credentials.length > 0
            ? credentials[credentials.length - 1].createdAt
            : undefined

    return {
        count: credentials.length,
        lastCreated,
    }
}
