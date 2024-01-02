import { FC } from 'react'

import { Passwords } from '../../types/passwords'

import { Logo } from '../../components/Logo/Logo'
import { Button } from '../../components/Button/Button'
import { PasswordsList } from '../../components/PasswordsList/PasswordsList'
import { Text } from '../../components/Text/Text'

import styles from './List.module.css'

export interface PasswordsListProps {
    passwords: Passwords
    onSelectPasswordFromList: (id: number) => void
    onGoToCreateNewPasswordPage: () => void
}

export const List: FC<PasswordsListProps> = ({
    passwords,
    onSelectPasswordFromList,
    onGoToCreateNewPasswordPage,
}) => {
    return (
        <div>
            <div className={styles.header}>
                <Logo />
                <Text size="title36">Ваши секреты</Text>
            </div>

            <div className={styles.list}>
                <PasswordsList
                    onSelectListItem={onSelectPasswordFromList}
                    passwords={passwords}
                />
                <Button
                    fullWidth
                    onClick={onGoToCreateNewPasswordPage}
                    theme="main"
                >
                    Записать новый секрет
                </Button>
            </div>
        </div>
    )
}
