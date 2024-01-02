import { FC, FormEventHandler, useState } from 'react'
import { sendAuthCode } from '../../api/sendAuthCode'
import { toStringOrUndefined } from '../../utils/toStringOrUndefined'
import { Input } from '../../components/Input/Input'
import { Button } from '../../components/Button/Button'
import { Logo } from '../../components/Logo/Logo'
import { Text } from '../../components/Text/Text'
import { SendTelegramAuthCodeButton } from '../../features/SendTelegramAuthCode'

import styles from './AuthPage.module.css'

export interface AuthPageProps {
    setIsAuthPage: (value: boolean) => void
}

export const AuthPage: FC<AuthPageProps> = ({ setIsAuthPage }) => {
    const [isError, setIsError] = useState<boolean>(false)

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

            <SendTelegramAuthCodeButton />
        </div>
    )
}
