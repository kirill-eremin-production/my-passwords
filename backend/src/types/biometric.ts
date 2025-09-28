export interface BiometricCredential {
    id: string
    publicKey: string
    counter: number
    createdAt: string
    sessionId: string
    userAgent?: string
}

export interface BiometricRegistrationRequest {
    credentialId: string
    publicKey: string
    authenticatorData: string
    clientDataJSON: string
    attestationObject?: string
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
}

export interface WebAuthnChallenge {
    challenge: string
    sessionId: string
    createdAt: number
}
