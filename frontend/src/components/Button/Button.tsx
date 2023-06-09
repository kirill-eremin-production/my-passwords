import { FC, MouseEventHandler, PropsWithChildren } from 'react'
import cn from 'classnames'

import styles from './Button.module.css'

export interface ButtonProps {
    type?: string
    theme?: 'main' | 'second'
    onClick?: MouseEventHandler
}

export const Button: FC<PropsWithChildren<ButtonProps>> = ({
    children,
    theme = 'main',
    onClick = () => null,
}) => {
    const styleClassName = `theme_${theme}`

    return (
        <button
            onClick={onClick}
            className={cn(styles.root, styles[styleClassName])}
        >
            {children}
        </button>
    )
}
