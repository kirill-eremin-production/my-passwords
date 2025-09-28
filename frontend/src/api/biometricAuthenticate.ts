interface BiometricAuthenticationData {
    credentialId: string
    authenticatorData: string
    clientDataJSON: string
    signature: string
    userHandle?: string
}

interface BiometricAuthenticationResponse {
    success: boolean
    sessionId: string
    valid: boolean
    message: string
}

export const authenticateWithBiometric = async (
    data: BiometricAuthenticationData
): Promise<BiometricAuthenticationResponse | number> => {
    try {
        const response = await fetch('/api/biometric/authenticate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data }),
        })

        if (!response.ok) {
            return response.status
        }

        const result: BiometricAuthenticationResponse = await response.json()
        return result
    } catch (error) {
        console.error('Ошибка биометрической аутентификации:', error)
        return 500
    }
}
