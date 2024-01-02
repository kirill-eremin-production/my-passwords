import { FC } from 'react'
import { Passwords } from '../../types/passwords'
import { Button } from '../Button/Button'

export interface PasswordsListProps {
    passwords: Passwords
    onSelectListItem: (id: number) => void
}

export const PasswordsList: FC<PasswordsListProps> = ({
    passwords,
    onSelectListItem,
}) => {
    return (
        <>
            {passwords.map(({ title }, id) => {
                return (
                    <Button
                        key={`${title}-${id}`}
                        fullWidth
                        onClick={() => onSelectListItem(id)}
                        theme="second"
                    >
                        {title}
                    </Button>
                )
            })}
        </>
    )
}
