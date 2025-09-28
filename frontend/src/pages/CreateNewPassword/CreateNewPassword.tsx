import { FC } from 'react'

import { useNavigate } from 'react-router-dom'

import { Button } from '../../components/Button/Button'
import { Logo } from '../../components/Logo/Logo'
import { PasswordForm } from '../../components/PasswordForm/PasswordForm'
import { Text } from '../../components/Text/Text'

import { usePasswordStore } from '../../stores/passwordStore'

import { Password } from '../../types/passwords'

export const CreateNewPassword: FC = () => {
    const navigate = useNavigate()
    const { addPassword } = usePasswordStore()

    const onPasswordFormSubmit = async (password: Password) => {
        try {
            await addPassword(password)
            navigate('/passwords')
        } catch (error) {
            console.error('Failed to save password:', error)
            alert('Ошибка при сохранении пароля')
        }
    }

    return (
        <div>
            <Logo />
            <Text size="title36">Секрет</Text>
            <PasswordForm password={{}} onSubmit={onPasswordFormSubmit} />
            <Button
                fullWidth
                onClick={() => navigate('/passwords')}
                theme="second"
            >
                Назад
            </Button>
        </div>
    )
}
