import { useEffect, useState } from 'react'

import { fetchPasswords } from '../api/fetchPasswords'
import { postPasswords } from '../api/postPasswords'
import { Password, Passwords } from '../types/passwords'
import { toEncrypt } from '../encryption/toEncrypt'
import { toDecrypt } from '../encryption/toDecrypt'

export interface UsePasswordsCallbacks {
    setIsLoading: (value: boolean) => void
    setLoadingMessage: (value: string) => void
    setIsAuthPage: (value: boolean) => void
}

export function usePasswords(callbacks: UsePasswordsCallbacks): {
    passwords: Passwords
    setPasswords: (passwords: Passwords) => void
    addPassword: (password: Password) => void
    updatePassword: (id: number, password: Password) => void
    deletePassword: (id: number) => void
    selectedPasswordId: number | null
    isMasterPassword: boolean
    setMasterPassword: (value: string | null) => void
    setSelectedPasswordId: (id: number | null) => void
    masterPassword: string | null
} {
    const { setIsLoading, setIsAuthPage } = callbacks

    const [passwords, setPasswordsState] = useState<Passwords>([])
    const [masterPassword, setMasterPassword] = useState<string | null>(null)
    const [selectedPasswordId, setSelectedPasswordId] = useState<number | null>(
        null
    )

    useEffect(() => {
        ;(async () => {
            const result = await fetchPasswords()
            setIsLoading(false)

            if (result === 401 || result === 403) {
                setIsAuthPage(true)
                return
            }

            if (typeof result === 'string') {
                setIsAuthPage(false)

                if (masterPassword) {
                    setPasswordsState(
                        JSON.parse(toDecrypt(result, masterPassword))
                    )
                }
            }
        })()
    }, [masterPassword])

    const setPasswords = (passwords: Passwords) => {
        if (!masterPassword) {
            return
        }

        postPasswords({
            data: toEncrypt(JSON.stringify(passwords), masterPassword),
            callback: () => setPasswordsState(passwords),
        })
    }

    const addPassword = (password: Password) => {
        const modifiedPasswords = JSON.parse(JSON.stringify(passwords))
        modifiedPasswords.push(password)

        setPasswords(modifiedPasswords)
    }

    const updatePassword = (id: number, password: Password) => {
        const modifiedPasswords = JSON.parse(JSON.stringify(passwords))
        modifiedPasswords[id] = password

        setPasswords(modifiedPasswords)
    }

    const deletePassword = (id: number) => {
        const modifiedPasswords = JSON.parse(JSON.stringify(passwords))
        modifiedPasswords.splice(id, 1)

        setPasswords(modifiedPasswords)
    }

    return {
        passwords,
        setPasswords,
        addPassword,
        updatePassword,
        deletePassword,
        selectedPasswordId,
        isMasterPassword: Boolean(masterPassword),
        setMasterPassword,
        setSelectedPasswordId,
        masterPassword,
    }
}
