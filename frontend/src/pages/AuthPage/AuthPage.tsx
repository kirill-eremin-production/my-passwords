import { FC, FormEventHandler, useState, useEffect } from 'react'
import { sendAuthCode } from '../../api/sendAuthCode'
import { toStringOrUndefined } from '../../utils/toStringOrUndefined'
import { Input } from '../../components/Input/Input'
import { Button } from '../../components/Button/Button'
import { Logo } from '../../components/Logo/Logo'
import { Text } from '../../components/Text/Text'
import { SendTelegramAuthCodeButton } from '../../features/SendTelegramAuthCode'
import { BiometricButton } from '../../components/BiometricButton'
import { hasBiometricCredentials } from '../../api/biometric'

import styles from './AuthPage.module.css'

export interface AuthPageProps {
    setIsAuthPage: (value: boolean) => void
    setMasterPassword: (value: string | null) => void
}

export const AuthPage: FC<AuthPageProps> = ({
    setIsAuthPage,
    setMasterPassword,
}) => {
    const [isError, setIsError] = useState<boolean>(false)
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

        const sessionCode = toStringOrUndefined(formData.get('sessionCode'))

        if (!sessionCode) {
            return
        }

        sendAuthCode({
            data: { code: sessionCode },
            callback: (isCorrectCode) => {
                if (!isCorrectCode) {
                    setIsError(true)
                    return
                }

                setIsAuthPage(false)
            },
        })
    }

    const handleBiometricSuccess = (masterPassword?: string) => {
        if (masterPassword) {
            // Биометрическая аутентификация - устанавливаем мастер-пароль и переходим дальше
            setMasterPassword(masterPassword)
        }
        setIsAuthPage(false)
    }

    const handleBiometricError = (error: string) => {
        setBiometricError(error)
        // Автоматически очищаем ошибку через 5 секунд
        setTimeout(() => setBiometricError(''), 5000)
    }

    if (isError) {
        return (
            <>
                <Logo />
                <Text size="title48">Ошибка</Text>
                <Text>Произошла ошибка. Пожалуйста, попробуйте еще раз.</Text>
                <Button fullWidth onClick={() => window.location.reload()}>
                    Назад
                </Button>
            </>
        )
    }

    return (
        <div className={styles.root}>
            <form onSubmit={onFormSubmit}>
                <div className={styles.header}>
                    <Logo />
                    <Text size="title48">Авторизация</Text>
                    <Text>Пожалуйста, укажите код доступа</Text>
                </div>

                <div className={styles.controls}>
                    <Input
                        autoFocus
                        name="sessionCode"
                        label="Code"
                        type="text"
                    />
                    <Button fullWidth type="submit">
                        Отправить
                    </Button>
                </div>
            </form>

            {hasCredentials && (
                <BiometricButton
                    onSuccess={handleBiometricSuccess}
                    onError={handleBiometricError}
                />
            )}

            {biometricError && (
                <div className={styles.biometricError}>
                    <Text>{biometricError}</Text>
                </div>
            )}

            <SendTelegramAuthCodeButton />
        </div>
    )
}
