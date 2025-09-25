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
    onSuccess: () => void
    onError?: (error: string) => void
}

export const BiometricButton: FC<BiometricButtonProps> = ({
    onSuccess,
    onError
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
                setHasCredentials(hasBiometricCredentials())
                setBiometricType(getAppleBiometricType())
            }
        }
        
        checkSupport()
    }, [])

    const handleBiometricAuth = async () => {
        if (!isSupported) {
            onError?.('Биометрическая аутентификация не поддерживается')
            return
        }

        setIsLoading(true)

        try {
            if (hasCredentials) {
                // Аутентификация
                await authenticateWithBiometric()
                onSuccess()
            } else {
                // Первичная регистрация
                await registerBiometric()
                setHasCredentials(true)
                onSuccess()
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Ошибка биометрической аутентификации'
            onError?.(message)
        } finally {
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