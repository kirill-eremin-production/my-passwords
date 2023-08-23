import { FC } from 'react'

import styles from './Input.module.css'

export interface InputProps {
    name: string
    label: string
    placeholder?: string
    type?: string
    defaultValue?: string | number
    autoFocus?: boolean
}

export const Input: FC<InputProps> = ({
    label,
    type = 'text',
    name,
    placeholder,
    defaultValue,
    autoFocus,
}) => {
    return (
        <div className={styles.root}>
            <label className={styles.label}>{label}</label>
            <input
                autoFocus={autoFocus}
                type={type}
                className={styles.input}
                name={name}
                placeholder={placeholder}
                defaultValue={defaultValue}
            />
        </div>
    )
}
