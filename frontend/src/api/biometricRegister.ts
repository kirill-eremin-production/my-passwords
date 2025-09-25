interface BiometricRegistrationData {
  credentialId: string
  publicKey: string
  authenticatorData: string
  clientDataJSON: string
  attestationObject?: string
}

interface BiometricRegistrationResponse {
  success: boolean
  message: string
}

export const registerBiometric = async (data: BiometricRegistrationData): Promise<BiometricRegistrationResponse | number> => {
  try {
    const response = await fetch('/api/biometric/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    })

    if (!response.ok) {
      return response.status
    }

    const result: BiometricRegistrationResponse = await response.json()
    return result
  } catch (error) {
    console.error('Ошибка регистрации биометрии:', error)
    return 500
  }
}