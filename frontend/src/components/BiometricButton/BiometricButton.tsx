import { FC, useState, useEffect } from 'react'
import { Button } from '../Button/Button'
import {
    isBiometricSupported,
    getBiometricDisplayName,
    getAppleBiometricType,
    getCompatibilityInfo
} from '../../utils/webauthn'
import {
    hasBiometricCredentials,
    registerBiometric,
    authenticateWithBiometric
} from '../../api/biometric'

import styles from './BiometricButton.module.css'

export interface BiometricButtonProps {
    onSuccess: (masterPassword?: string) => void
    onError?: (error: string) => void
    masterPassword?: string // Для регистрации биометрии
}

export const BiometricButton: FC<BiometricButtonProps> = ({
    onSuccess,
    onError,
    masterPassword
}) => {
    const [isSupported, setIsSupported] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [hasCredentials, setHasCredentials] = useState(false)
    const [biometricType, setBiometricType] = useState<'touch-id' | 'face-id' | 'unknown'>('unknown')
    const [compatibilityInfo, setCompatibilityInfo] = useState<any>(null)
    const [showDetails, setShowDetails] = useState(false)

    useEffect(() => {
        const checkSupport = async () => {
            const supported = await isBiometricSupported()
            const compInfo = await getCompatibilityInfo()
            
            setIsSupported(supported)
            setCompatibilityInfo(compInfo)
            
            if (supported) {
                setHasCredentials(await hasBiometricCredentials())
                setBiometricType(getAppleBiometricType())
            }
        }
        
        checkSupport()
    }, [])

    const handleBiometricAuth = async () => {
        console.log('🎯 handleBiometricAuth вызван')
        console.log('Параметры:', { isSupported, hasCredentials, masterPassword: !!masterPassword })
        
        if (!isSupported) {
            console.log('❌ Биометрия не поддерживается')
            onError?.('Биометрическая аутентификация не поддерживается')
            return
        }

        console.log('🔄 Устанавливаем isLoading = true')
        setIsLoading(true)

        try {
            if (hasCredentials) {
                console.log('🔄 Режим аутентификации (есть учетные данные)')
                // Аутентификация - получаем мастер-пароль с сервера
                const result = await authenticateWithBiometric()
                if (result.success && result.masterPassword) {
                    onSuccess(result.masterPassword)
                } else {
                    onError?.('Не удалось получить мастер-пароль')
                }
            } else {
                console.log('🔄 Режим регистрации (нет учетных данных)')
                // Первичная регистрация - отправляем мастер-пароль на сервер
                if (!masterPassword) {
                    console.log('❌ Мастер-пароль не предоставлен')
                    onError?.('Мастер-пароль не предоставлен для регистрации биометрии')
                    return
                }
                
                console.log('🔄 Вызываем registerBiometric...')
                const result = await registerBiometric('user', masterPassword)
                console.log('✅ registerBiometric завершен, результат:', result)
                
                if (typeof result === 'number') {
                    // Обработка HTTP статус кодов
                    switch (result) {
                        case 403:
                            throw new Error('Требуется авторизация. Пожалуйста, войдите в систему заново.')
                        case 400:
                            throw new Error('Неверные данные для регистрации биометрии')
                        case 500:
                            throw new Error('Ошибка сервера при регистрации биометрии')
                        default:
                            throw new Error(`Ошибка регистрации биометрии (код: ${result})`)
                    }
                }
                
                if (!result.success) {
                    throw new Error(result.message || 'Не удалось зарегистрировать биометрию')
                }
                
                setHasCredentials(true)
                console.log('🎉 Регистрация завершена успешно')
                onSuccess()
            }
        } catch (error) {
            console.error('❌ ОШИБКА в handleBiometricAuth:', error)
            const message = error instanceof Error ? error.message : 'Ошибка биометрической аутентификации'
            onError?.(message)
        } finally {
            console.log('🔄 Устанавливаем isLoading = false')
            setIsLoading(false)
        }
    }

    const getBiometricIcon = () => {
        switch (biometricType) {
            case 'touch-id':
                return '👆' // Touch ID icon
            case 'face-id':
                return '😊' // Face ID icon
            default:
                return '🔐' // Generic biometric icon
        }
    }

    const getButtonText = () => {
        const displayName = getBiometricDisplayName()
        return hasCredentials 
            ? `Войти с ${displayName}` 
            : `Настроить ${displayName}`
    }

    if (!isSupported && !compatibilityInfo) {
        return null
    }

    if (!isSupported && compatibilityInfo) {
        return (
            <div className={styles.container}>
                <Button
                    fullWidth
                    theme="second"
                    onClick={() => setShowDetails(!showDetails)}
                    className={styles.unsupportedButton}
                >
                    <span className={styles.icon}>⚠️</span>
                    <span>Биометрия недоступна</span>
                </Button>
                
                {showDetails && (
                    <div className={styles.detailsPanel}>
                        <h4>Информация о совместимости:</h4>
                        <ul>
                            <li>Устройство: {compatibilityInfo.device}</li>
                            <li>Браузер: {compatibilityInfo.browser.name} {compatibilityInfo.browser.version || ''}</li>
                            <li>HTTPS: {compatibilityInfo.https ? '✅' : '❌'}</li>
                            <li>WebAuthn: {compatibilityInfo.webauthn ? '✅' : '❌'}</li>
                            <li>Биометрия: {compatibilityInfo.platformAuthenticator ? '✅' : '❌'}</li>
                        </ul>
                        
                        {compatibilityInfo.recommendations.length > 0 && (
                            <>
                                <h4>Рекомендации:</h4>
                                <ul>
                                    {compatibilityInfo.recommendations.map((rec: string, index: number) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <Button
                fullWidth
                theme="second"
                isLoading={isLoading}
                onClick={handleBiometricAuth}
                className={styles.biometricButton}
            >
                <span className={styles.icon}>{getBiometricIcon()}</span>
                <span>{getButtonText()}</span>
            </Button>
            
            {compatibilityInfo && (
                <div className={styles.supportInfo}>
                    <small>
                        {compatibilityInfo.browser.name} на {compatibilityInfo.device}
                        {!compatibilityInfo.browser.isSupported && ' (ограниченная поддержка)'}
                    </small>
                </div>
            )}
        </div>
    )
}