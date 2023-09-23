import React, { useEffect, useState } from 'react'
import styles from './App.module.css'

import { MasterPassword } from './pages/MasterPassword/MasterPassword'
import { List } from './pages/List/List'

import { usePasswords } from './hooks/usePasswords'
import { SelectedPassword } from './pages/SelectedPassword/SelectedPassword'
import { CreateNewPassword } from './pages/CreateNewPassword/CreateNewPassword'
import { AuthPage } from './pages/AuthPage/AuthPage'
import { Password } from './types/passwords'
import { LoadingPage } from './pages/LoadingPage/LoadingPage'

function App() {
    const [isLoading, setIsLoading] = useState(true)
    const [loadingMessage, setLoadingMessage] = useState('')
    const [isCreateNewPasswordPage, setIsCreateNewPasswordPage] =
        useState<boolean>(false)
    const [isAuthPage, setIsAuthPage] = useState<boolean>(true)

    const {
        passwords,
        addPassword,
        updatePassword,
        deletePassword,
        isMasterPassword,
        selectedPasswordId,
        setMasterPassword,
        setSelectedPasswordId,
    } = usePasswords({ setIsLoading, setIsAuthPage, setLoadingMessage })

    const onCreateNewPasswordSave = (password: Password) => {
        addPassword(password)
    }

    const onSaveSelectedPassword = (password: Password) => {
        if (typeof selectedPasswordId !== 'number') {
            return
        }

        updatePassword(selectedPasswordId, password)
    }

    const onDeleteSelectedPassword = () => {
        if (typeof selectedPasswordId !== 'number') {
            return
        }

        deletePassword(selectedPasswordId)
    }

    let page = (
        <List
            onGoToCreateNewPasswordPage={() => setIsCreateNewPasswordPage(true)}
            onSelectPasswordFromList={setSelectedPasswordId}
            passwords={passwords || []}
        ></List>
    )

    if (!isMasterPassword) {
        page = <MasterPassword setMasterPassword={setMasterPassword} />
    }

    if (typeof selectedPasswordId === 'number') {
        page = (
            <SelectedPassword
                onDelete={onDeleteSelectedPassword}
                onClose={() => setSelectedPasswordId(null)}
                onSave={onSaveSelectedPassword}
                passwords={passwords}
                selectedPasswordId={selectedPasswordId}
            />
        )
    }

    if (isCreateNewPasswordPage) {
        page = (
            <CreateNewPassword
                onSave={onCreateNewPasswordSave}
                onGoBack={() => setIsCreateNewPasswordPage(false)}
            />
        )
    }

    if (isAuthPage) {
        page = <AuthPage setIsAuthPage={setIsAuthPage} />
    }

    if (isLoading) {
        page = <LoadingPage message={loadingMessage} />
    }

    return <div className={styles.root}>{page}</div>
}

export default App
