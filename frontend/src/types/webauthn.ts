export interface BiometricCredential {
    id: string
    rawId: ArrayBuffer
    response: {
        clientDataJSON: ArrayBuffer
        authenticatorData: ArrayBuffer
        signature: ArrayBuffer
        userHandle?: ArrayBuffer
    }
    type: 'public-key'
}

export interface BiometricRegistrationOptions {
    challenge: Uint8Array
    rp: {
        name: string
        id: string
    }
    user: {
        id: Uint8Array
        name: string
        displayName: string
    }
    pubKeyCredParams: Array<{
        type: 'public-key'
        alg: number
    }>
    authenticatorSelection?: {
        authenticatorAttachment?: 'platform' | 'cross-platform'
        userVerification?: 'required' | 'preferred' | 'discouraged'
        requireResidentKey?: boolean
    }
    timeout?: number
    attestation?: 'none' | 'indirect' | 'direct'
}

export interface BiometricAuthenticationOptions {
    challenge: Uint8Array
    allowCredentials?: Array<{
        type: 'public-key'
        id: ArrayBuffer
    }>
    timeout?: number
    userVerification?: 'required' | 'preferred' | 'discouraged'
}

export interface StoredCredential {
    id: string
    publicKey: string
    counter: number
    createdAt: string
}
