import { FC } from 'react'

import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '../../components/Button/Button'
import { Logo } from '../../components/Logo/Logo'
import { PasswordForm } from '../../components/PasswordForm/PasswordForm'
import { Text } from '../../components/Text/Text'

import { usePasswordStore } from '../../stores/passwordStore'

import { Password } from '../../types/passwords'

import styles from './SelectedPassword.module.css'

export const SelectedPassword: FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { passwords, updatePassword, deletePassword } = usePasswordStore()

    const passwordIndex = id ? parseInt(id, 10) : -1
    const password = passwords[passwordIndex]

    if (!password || passwordIndex < 0) {
        return (
            <div>
                <div className={styles.header}>
                    <Logo />
                    <Text size="title36">Ошибка</Text>
                </div>
                <div className={styles.controls}>
                    <Text>Пароль не найден</Text>
                    <Button fullWidth onClick={() => navigate('/passwords')}>
                        Назад к списку
                    </Button>
                </div>
            </div>
        )
    }
    const onDeleteClick = async () => {
        try {
            await deletePassword(passwordIndex)
            navigate('/passwords')
        } catch (error) {
            console.error('Failed to delete password:', error)
            alert('Ошибка при удалении пароля')
        }
    }

    const onSaveClick = async (updatedPassword: Password) => {
        try {
            await updatePassword(passwordIndex, updatedPassword)
            navigate('/passwords')
        } catch (error) {
            console.error('Failed to update password:', error)
            alert('Ошибка при сохранении пароля')
        }
    }

    return (
        <div>
            <div className={styles.header}>
                <Logo />
                <Text size="title36">Секрет</Text>
            </div>

            <div className={styles.controls}>
                <PasswordForm password={password} onSubmit={onSaveClick} />
                <Button fullWidth theme="second" onClick={onDeleteClick}>
                    Удалить
                </Button>
                <Button
                    fullWidth
                    theme="second"
                    onClick={() => navigate('/passwords')}
                >
                    Назад
                </Button>
            </div>
        </div>
    )
}
