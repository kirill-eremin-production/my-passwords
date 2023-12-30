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
}

export const Button: FC<ButtonProps> = ({
    type,
    children,
    theme = 'main',
    onClick = () => null,
    isLoading,
}) => {
    const styleClassName = `theme_${theme}`

    const classNames = cn(styles.root, styles[styleClassName], {
        [styles.disabled]: isLoading,
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
