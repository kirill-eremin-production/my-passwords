import React from 'react'

import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute'

import { AuthPage } from './pages/AuthPage/AuthPage'
import { CreateNewPassword } from './pages/CreateNewPassword/CreateNewPassword'
import { List } from './pages/List/List'
import { LoadingPage } from './pages/LoadingPage/LoadingPage'
import { MasterPassword } from './pages/MasterPassword/MasterPassword'
import { SelectedPassword } from './pages/SelectedPassword/SelectedPassword'

import { useAuthStore } from './stores/authStore'
import { usePasswordStore } from './stores/passwordStore'

import styles from './App.module.css'

function App() {
    const { isAuthenticated, isLoading, loadingMessage } = useAuthStore()
    const { isMasterPasswordSet } = usePasswordStore()

    if (isLoading) {
        return (
            <div className={styles.root}>
                <LoadingPage message={loadingMessage} />
            </div>
        )
    }

    return (
        <div className={styles.root}>
            <Routes>
                {/* Публичные маршруты */}
                <Route
                    path="/auth"
                    element={
                        isAuthenticated ? (
                            <Navigate
                                to={
                                    isMasterPasswordSet
                                        ? '/passwords'
                                        : '/master-password'
                                }
                                replace
                            />
                        ) : (
                            <AuthPage />
                        )
                    }
                />

                {/* Защищенные маршруты */}
                <Route
                    path="/master-password"
                    element={
                        <ProtectedRoute>
                            {isMasterPasswordSet ? (
                                <Navigate to="/passwords" replace />
                            ) : (
                                <MasterPassword />
                            )}
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/passwords"
                    element={
                        <ProtectedRoute requireMasterPassword>
                            <List />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/passwords/new"
                    element={
                        <ProtectedRoute requireMasterPassword>
                            <CreateNewPassword />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/passwords/:id"
                    element={
                        <ProtectedRoute requireMasterPassword>
                            <SelectedPassword />
                        </ProtectedRoute>
                    }
                />

                {/* Редирект по умолчанию */}
                <Route
                    path="/"
                    element={
                        <Navigate
                            to={
                                !isAuthenticated
                                    ? '/auth'
                                    : !isMasterPasswordSet
                                      ? '/master-password'
                                      : '/passwords'
                            }
                            replace
                        />
                    }
                />

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    )
}

export default App
