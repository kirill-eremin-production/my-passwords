import { Navigate } from 'react-router-dom'

import { useAuthStore } from '../../stores/authStore'
import { usePasswordStore } from '../../stores/passwordStore'

interface ProtectedRouteProps {
    children: React.ReactNode
    requireMasterPassword?: boolean
}

export const ProtectedRoute = ({
    children,
    requireMasterPassword = false,
}: ProtectedRouteProps) => {
    const { isAuthenticated } = useAuthStore()
    const { isMasterPasswordSet } = usePasswordStore()

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />
    }

    if (requireMasterPassword && !isMasterPasswordSet) {
        return <Navigate to="/master-password" replace />
    }

    return <>{children}</>
}
