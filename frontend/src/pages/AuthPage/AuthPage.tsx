import { FC, FormEventHandler, useState } from 'react'
import { sendAuthCode } from '../../api/sendAuthCode'
import { toStringOrUndefined } from '../../utils/toStringOrUndefined'
import { Input } from '../../components/Input/Input'
import { Button } from '../../components/Button/Button'
import { Logo } from '../../components/Logo/Logo'
import { Text } from '../../components/Text/Text'
import { getAuthCode } from '../../api/getAuthCode'

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

    const onGetCodeButtonClick = () => {
        getAuthCode()
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
        <>
            <form onSubmit={onFormSubmit}>
                <Logo />
                <Text size="title48">Авторизация</Text>
                <Text>Пожалуйста, укажите код доступа</Text>
                <Input autoFocus name="sessionCode" label="Code" type="text" />
                <Button type="submit">Отправить</Button>
            </form>
            <Button onClick={onGetCodeButtonClick}>Получить код</Button>
        </>
    )
}
