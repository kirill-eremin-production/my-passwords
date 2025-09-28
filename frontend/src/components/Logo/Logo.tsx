import { FC } from 'react'

import styles from './Logo.module.css'
import logo from './assets/logo.svg'

export const Logo: FC = () => {
    return <img className={styles.root} src={logo}></img>
}
