import { FC, useState, useRef } from 'react'
import { Copy, CopyCheck } from '@gravity-ui/icons'

import { Button } from '../Button/Button'

import styles from './CopyButton.module.css'

export interface CopyButtonProps {
    text: string
}

export const CopyButton: FC<CopyButtonProps> = ({ text }) => {
    const [isCopied, setIsCopied] = useState(false)
    const timer = useRef<number>()

    const copy = () => {
        window.clearTimeout(timer.current)

        window.navigator.clipboard.writeText(text)
        setIsCopied(true)

        timer.current = window.setTimeout(() => {
            setIsCopied(false)
        }, 500)
    }

    return (
        <div className={styles.root}>
            <Button theme="second" fullWidth onClick={copy}>
                {isCopied ? (
                    <CopyCheck className={styles.icon} />
                ) : (
                    <Copy className={styles.icon} />
                )}
            </Button>
        </div>
    )
}
