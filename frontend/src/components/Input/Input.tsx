import { FC } from 'react'

import styles from './Input.module.css'

export interface InputProps {
    name: string
    label: string
    placeholder?: string
    type?: string
    defaultValue?: string | number
}

export const Input: FC<InputProps> = ({
    label,
    type = 'text',
    name,
    placeholder,
    defaultValue,
}) => {
    return (
        <div className={styles.root}>
            <label className={styles.label}>{label}</label>
            <input
                type={type}
                className={styles.input}
                name={name}
                placeholder={placeholder}
                defaultValue={defaultValue}
            />
        </div>
    )
}
