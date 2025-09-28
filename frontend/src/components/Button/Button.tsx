import {
    ButtonHTMLAttributes,
    FC,
    MouseEventHandler,
    PropsWithChildren,
} from 'react'

import cn from 'classnames'

import styles from './Button.module.css'

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
        PropsWithChildren {
    theme?: 'main' | 'second'
    onClick?: MouseEventHandler
    isLoading?: boolean
    fullWidth?: boolean
}

export const Button: FC<ButtonProps> = ({
    type = 'button',
    children,
    theme = 'main',
    onClick = () => null,
    fullWidth = false,
    isLoading,
}) => {
    const styleClassName = `theme_${theme}`

    const classNames = cn(styles.root, styles[styleClassName], {
        [styles.disabled]: isLoading,
        [styles.fullWidth]: fullWidth,
    })

    return (
        <button
            type={type}
            onClick={onClick}
            className={classNames}
            disabled={isLoading}
        >
            {isLoading ? <div className={styles.loader} /> : children}
        </button>
    )
}
