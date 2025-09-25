interface BiometricChallengeResponse {
  success: boolean
  challenge: string
}

export const getBiometricChallenge = async (): Promise<BiometricChallengeResponse | number> => {
  try {
    const response = await fetch('/api/biometric/challenge', {
      method: 'GET',
    })

    if (!response.ok) {
      return response.status
    }

    const result: BiometricChallengeResponse = await response.json()
    return result
  } catch (error) {
    console.error('Ошибка получения биометрического challenge:', error)
    return 500
  }
}