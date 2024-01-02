import { FC, FormEventHandler } from 'react'
import { Password } from '../../types/passwords'
import { Input } from '../Input/Input'
import { Button } from '../Button/Button'
import { toStringOrUndefined } from '../../utils/toStringOrUndefined'
import { CopyButton } from '../CopyButton/CopyButton'

import styles from './PasswordForm.module.css'

export interface PasswordFormProps {
    password: Password
    onSubmit: (password: Password) => void
}

export const PasswordForm: FC<PasswordFormProps> = ({ password, onSubmit }) => {
    const { title, password: passwordValue, login } = password

    const onFormSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault()

        const form = event.currentTarget
        const formData = new FormData(form)

        const inputTitle = toStringOrUndefined(formData.get('title'))
        const inputLogin = toStringOrUndefined(formData.get('login'))
        const inputPassword = toStringOrUndefined(formData.get('password'))

        const modifiedPassword: Password = {
            title: inputTitle,
            login: inputLogin,
            password: inputPassword,
        }

        onSubmit(modifiedPassword)
    }

    return (
        <form className={styles.form} onSubmit={onFormSubmit}>
            <div className={styles.row}>
                <Input
                    name="title"
                    label="Название"
                    type="text"
                    defaultValue={title}
                />
                <CopyButton text={String(title)} />
            </div>

            <div className={styles.row}>
                <Input
                    name="login"
                    label="Логин"
                    type="text"
                    defaultValue={login}
                />
                <CopyButton text={String(login)} />
            </div>

            <div className={styles.row}>
                <Input
                    name="password"
                    label="Пароль"
                    type="text"
                    defaultValue={passwordValue}
                />
                <CopyButton text={String(passwordValue)} />
            </div>

            <Button fullWidth type="submit">
                Сохранить
            </Button>
        </form>
    )
}
