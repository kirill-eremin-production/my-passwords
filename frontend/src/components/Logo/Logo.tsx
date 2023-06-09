import { FC } from 'react'

import logo from './assets/logo.svg'

import styles from './Logo.module.css'

export const Logo: FC = () => {
    return <img className={styles.root} src={logo}></img>
}
