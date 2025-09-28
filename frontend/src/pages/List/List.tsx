import { FC, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Logo } from '../../components/Logo/Logo'
import { Button } from '../../components/Button/Button'
import { PasswordsList } from '../../components/PasswordsList/PasswordsList'
import { Text } from '../../components/Text/Text'
import { BiometricButton } from '../../components/BiometricButton'
import { hasBiometricCredentials } from '../../api/biometric'
import { usePasswordStore } from '../../stores/passwordStore'

import styles from './List.module.css'

export const List: FC = () => {
    const navigate = useNavigate()
    const { passwords, masterPassword, loadPasswords } = usePasswordStore()
    const [biometricMessage, setBiometricMessage] = useState<string>('')
    const [showBiometricButton, setShowBiometricButton] = useState<boolean>(false)

    useEffect(() => {
        const checkBiometricCredentials = async () => {
            const hasCredentials = await hasBiometricCredentials()
            setShowBiometricButton(!hasCredentials)
        }
        
        checkBiometricCredentials()
        loadPasswords() // Загрузка паролей при монтировании компонента
    }, [loadPasswords])

    const handleBiometricSuccess = () => {
        setBiometricMessage('Биометрическая аутентификация успешно настроена!')
        setShowBiometricButton(false)
        setTimeout(() => setBiometricMessage(''), 3000)
    }

    const handleBiometricError = (error: string) => {
        setBiometricMessage(`Ошибка: ${error}`)
        setTimeout(() => setBiometricMessage(''), 5000)
    }
    return (
        <div>
            <div className={styles.header}>
                <Logo />
                <Text size="title36">Ваши секреты</Text>
            </div>

            <div className={styles.list}>
                <PasswordsList
                    onSelectListItem={(id: number) => navigate(`/passwords/${id}`)}
                    passwords={passwords}
                />
                <Button
                    fullWidth
                    onClick={() => navigate('/passwords/new')}
                    theme="main"
                >
                    Записать новый секрет
                </Button>

                {showBiometricButton && masterPassword && (
                    <div className={styles.biometricSection}>
                        <Text>Настройте биометрическую аутентификацию для быстрого входа:</Text>
                        <BiometricButton
                            onSuccess={handleBiometricSuccess}
                            onError={handleBiometricError}
                            masterPassword={masterPassword}
                        />
                    </div>
                )}

                {biometricMessage && (
                    <div className={styles.biometricMessage}>
                        <Text>{biometricMessage}</Text>
                    </div>
                )}
            </div>
        </div>
    )
}
