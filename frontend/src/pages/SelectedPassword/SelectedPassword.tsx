import { FC } from 'react'
import { Password, Passwords } from '../../types/passwords'
import { Button } from '../../components/Button/Button'
import { PasswordForm } from '../../components/PasswordForm/PasswordForm'
import { Logo } from '../../components/Logo/Logo'

export interface SelectedPasswordProps {
    passwords: Passwords
    selectedPasswordId: number
    onClose: () => void
    onSave: (password: Password) => void
    onDelete: () => void
}

export const SelectedPassword: FC<SelectedPasswordProps> = ({
    passwords,
    selectedPasswordId,
    onClose,
    onSave,
    onDelete,
}) => {
    const onDeleteClick = () => {
        onDelete()
        onClose()
    }

    const onSaveClick = (password: Password) => {
        onSave(password)
        onClose()
    }

    return (
        <div>
            <Logo />
            <PasswordForm
                password={passwords[selectedPasswordId]}
                onSubmit={onSaveClick}
            />
            <Button theme="second" onClick={onDeleteClick}>
                Удалить
            </Button>
            <Button theme="second" onClick={onClose}>
                Назад
            </Button>
        </div>
    )
}
