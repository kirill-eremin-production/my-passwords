import { FC, FormEventHandler, useEffect } from 'react'
import { checkAuthorization } from '../../api/checkAuthorization'
import { sendAuthCode } from '../../api/sendAuthCode'
import { toStringOrUndefined } from '../../utils/toStringOrUndefined'
import { Input } from '../../components/Input/Input'
import { Button } from '../../components/Button/Button'

export interface AuthPageProps {
    setIsAuthPage: (value: boolean) => void
}

export const AuthPage: FC<AuthPageProps> = ({ setIsAuthPage }) => {
    useEffect(() => {
        checkAuthorization({ callback: (value) => setIsAuthPage(!value) })
    }, [])

    const onFormSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault()

        const form = event.currentTarget
        const formData = new FormData(form)

        const sessionCode = toStringOrUndefined(formData.get('sessionCode'))

        sendAuthCode({
            data: { code: sessionCode },
            callback: () => {
                checkAuthorization({
                    callback: (value) => setIsAuthPage(!value),
                })
            },
        })
    }

    return (
        <form onSubmit={onFormSubmit}>
            <Input name="sessionCode" label="Code" type="text" />
            <Button type="submit">Отправить</Button>
        </form>
    )
}
