import { FC, PropsWithChildren } from 'react'
import cn from 'classnames'

import styles from './Text.module.css'

export interface ButtonProps {
    size?: 'title48' | 'title36' | 'regular'
}

export const Text: FC<PropsWithChildren<ButtonProps>> = ({
    children,
    size = 'regular',
}) => {
    const sizeClassName = `size_${size}`

    return <p className={cn(styles.root, styles[sizeClassName])}>{children}</p>
}
