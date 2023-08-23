import { FC, FormEventHandler, useEffect, useState } from 'react'
import { checkAuthorization } from '../../api/checkAuthorization'
import { sendAuthCode } from '../../api/sendAuthCode'
import { toStringOrUndefined } from '../../utils/toStringOrUndefined'
import { Input } from '../../components/Input/Input'
import { Button } from '../../components/Button/Button'
import { Logo } from '../../components/Logo/Logo'
import { Text } from '../../components/Text/Text'

export interface AuthPageProps {
    setIsAuthPage: (value: boolean) => void
}

export const AuthPage: FC<AuthPageProps> = ({ setIsAuthPage }) => {
    const [isError, setIsError] = useState<boolean>(false)

    useEffect(() => {
        checkAuthorization({ callback: (value) => setIsAuthPage(!value) })
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

                checkAuthorization({
                    callback: (value) => setIsAuthPage(!value),
                })
            },
        })
    }

    if (isError) {
        return (
            <>
                <Logo />
                <Text size="title48">Ошибка</Text>
                <Text>Произошла ошибка. Пожалуйста, попробуйте еще раз.</Text>
                <Button onClick={() => window.location.reload()}>Назад</Button>
            </>
        )
    }

    return (
        <form onSubmit={onFormSubmit}>
            <Logo />
            <Text size="title48">Авторизация</Text>
            <Text>Пожалуйста, укажите код доступа</Text>
            <Input autoFocus name="sessionCode" label="Code" type="text" />
            <Button type="submit">Отправить</Button>
        </form>
    )
}
