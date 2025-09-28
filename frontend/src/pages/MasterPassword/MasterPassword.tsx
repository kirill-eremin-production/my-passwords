import { FC, FormEventHandler, useEffect, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { hasBiometricCredentials } from '../../api/biometric'

import { BiometricButton } from '../../components/BiometricButton'
import { Button } from '../../components/Button/Button'
import { Input } from '../../components/Input/Input'
import { Logo } from '../../components/Logo/Logo'
import { Text } from '../../components/Text/Text'

import { usePasswordStore } from '../../stores/passwordStore'

import styles from './MasterPassword.module.css'

export const MasterPassword: FC = () => {
    const navigate = useNavigate()
    const { setMasterPassword } = usePasswordStore()
    const [biometricError, setBiometricError] = useState<string>('')
    const [hasCredentials, setHasCredentials] = useState<boolean>(false)

    useEffect(() => {
        const checkBiometricCredentials = async () => {
            const credentials = await hasBiometricCredentials()
            setHasCredentials(credentials)
        }

        checkBiometricCredentials()
    }, [])
    const onFormSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault()

        const form = event.currentTarget
        const formData = new FormData(form)
        const inputMasterPassword = formData.get('masterPassword')

        if (typeof inputMasterPassword === 'string') {
            setMasterPassword(inputMasterPassword)
            navigate('/passwords')
            return
        }

        alert('Не удалось применить Мастер-пароль')
    }

    const handleBiometricSuccess = (masterPassword?: string) => {
        if (masterPassword) {
            setMasterPassword(masterPassword)
            navigate('/passwords')
        } else {
            setBiometricError(
                'Не удалось получить мастер-пароль из биометрических данных'
            )
            setTimeout(() => setBiometricError(''), 5000)
        }
    }

    const handleBiometricError = (error: string) => {
        setBiometricError(error)
        setTimeout(() => setBiometricError(''), 5000)
    }

    return (
        <form onSubmit={onFormSubmit}>
            <div className={styles.header}>
                <Logo />
                <Text size="title48">Авторизация</Text>
                <Text>
                    Пожалуйста, укажите мастер-пароль от вашей коллекции
                    секретов
                </Text>
            </div>

            <div className={styles.controls}>
                <Input
                    autoFocus
                    label="Мастер-пароль"
                    name="masterPassword"
                    type="password"
                />
                <Button fullWidth type="submit">
                    Использовать
                </Button>
            </div>

            {hasCredentials && (
                <div className={styles.biometricSection}>
                    <BiometricButton
                        onSuccess={handleBiometricSuccess}
                        onError={handleBiometricError}
                    />
                </div>
            )}

            {biometricError && (
                <div className={styles.biometricError}>
                    <Text>{biometricError}</Text>
                </div>
            )}
        </form>
    )
}
