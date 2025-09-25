import { FC, useState } from 'react'

import { Passwords } from '../../types/passwords'

import { Logo } from '../../components/Logo/Logo'
import { Button } from '../../components/Button/Button'
import { PasswordsList } from '../../components/PasswordsList/PasswordsList'
import { Text } from '../../components/Text/Text'
import { BiometricButton } from '../../components/BiometricButton'
import { hasBiometricCredentials } from '../../api/biometric'

import styles from './List.module.css'

export interface PasswordsListProps {
    passwords: Passwords
    onSelectPasswordFromList: (id: number) => void
    onGoToCreateNewPasswordPage: () => void
    masterPassword?: string | null
}

export const List: FC<PasswordsListProps> = ({
    passwords,
    onSelectPasswordFromList,
    onGoToCreateNewPasswordPage,
    masterPassword,
}) => {
    const [biometricMessage, setBiometricMessage] = useState<string>('')
    const [showBiometricButton, setShowBiometricButton] = useState<boolean>(!hasBiometricCredentials())

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
                    onSelectListItem={onSelectPasswordFromList}
                    passwords={passwords}
                />
                <Button
                    fullWidth
                    onClick={onGoToCreateNewPasswordPage}
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
