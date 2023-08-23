import { FC } from 'react'
import { PasswordForm } from '../../components/PasswordForm/PasswordForm'
import { Button } from '../../components/Button/Button'
import { Password } from '../../types/passwords'
import { Logo } from '../../components/Logo/Logo'
import { Text } from '../../components/Text/Text'

export interface CreateNewPasswordProps {
    onGoBack: () => void
    onSave: (password: Password) => void
}

export const CreateNewPassword: FC<CreateNewPasswordProps> = ({
    onGoBack,
    onSave,
}) => {
    const onPasswordFormSubmit = (password: Password) => {
        onSave(password)
        onGoBack()
    }

    return (
        <div>
            <Logo />
            <Text size="title36">Секрет</Text>
            <PasswordForm password={{}} onSubmit={onPasswordFormSubmit} />
            <Button onClick={onGoBack} theme="second">
                Назад
            </Button>
        </div>
    )
}
