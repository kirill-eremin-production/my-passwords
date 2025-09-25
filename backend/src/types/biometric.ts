export interface BiometricCredential {
  id: string
  publicKey: string
  counter: number
  createdAt: string
  sessionId: string
  userAgent?: string
  encryptedMasterPassword: string // Зашифрованный мастер-пароль
}

export interface BiometricRegistrationRequest {
  credentialId: string
  publicKey: string
  authenticatorData: string
  clientDataJSON: string
  attestationObject?: string
  masterPassword: string // Мастер-пароль для шифрования
}

export interface BiometricAuthenticationRequest {
  credentialId: string
  authenticatorData: string
  clientDataJSON: string
  signature: string
  userHandle?: string
}

export interface BiometricAuthenticationResponse {
  sessionId: string
  valid: boolean
  masterPassword?: string // Расшифрованный мастер-пароль
}

export interface WebAuthnChallenge {
  challenge: string
  sessionId: string
  createdAt: number
}