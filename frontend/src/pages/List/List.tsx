import { FC } from 'react'

import { Passwords } from '../../types/passwords'

import { Logo } from '../../components/Logo/Logo'
import { Button } from '../../components/Button/Button'
import { PasswordsList } from '../../components/PasswordsList/PasswordsList'
import { Text } from '../../components/Text/Text'

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
            <Logo />
            <Text size="title36">Ваши секреты</Text>
            <PasswordsList
                onSelectListItem={onSelectPasswordFromList}
                passwords={passwords}
            />
            <Button onClick={onGoToCreateNewPasswordPage} type="main">
                Записать новый секрет
            </Button>
        </div>
    )
}
