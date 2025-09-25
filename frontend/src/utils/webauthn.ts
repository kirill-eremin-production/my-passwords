/**
 * Утилиты для работы с WebAuthn API и биометрической аутентификацией
 */

/**
 * Проверяет поддержку WebAuthn API в браузере
 */
export const isWebAuthnSupported = (): boolean => {
    return !!(
        typeof window !== 'undefined' &&
        window.navigator &&
        window.navigator.credentials &&
        window.PublicKeyCredential &&
        typeof window.navigator.credentials.create === 'function' &&
        typeof window.navigator.credentials.get === 'function'
    )
}

/**
 * Проверяет доступность платформенного аутентификатора (Touch ID, Face ID)
 */
export const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
    if (!isWebAuthnSupported()) {
        return false
    }

    try {
        return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch (error) {
        console.warn('Ошибка при проверке доступности платформенного аутентификатора:', error)
        return false
    }
}

/**
 * Проверяет поддержку условной медиации (Conditional UI)
 */
export const isConditionalMediationSupported = async (): Promise<boolean> => {
    if (!isWebAuthnSupported()) {
        return false
    }

    try {
        // Проверяем наличие метода перед вызовом
        const PublicKeyCredential = window.PublicKeyCredential as any
        if (typeof PublicKeyCredential.isConditionalMediationAvailable === 'function') {
            return await PublicKeyCredential.isConditionalMediationAvailable()
        }
        return false
    } catch (error) {
        console.warn('Ошибка при проверке поддержки условной медиации:', error)
        return false
    }
}

/**
 * Генерирует случайный challenge для WebAuthn
 */
export const generateChallenge = (): ArrayBuffer => {
    return window.crypto.getRandomValues(new Uint8Array(32)).buffer
}

/**
 * Генерирует уникальный ID пользователя
 */
export const generateUserId = (): ArrayBuffer => {
    return window.crypto.getRandomValues(new Uint8Array(64)).buffer
}

/**
 * Конвертирует ArrayBuffer в base64 строку
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
}

/**
 * Конвертирует base64 строку в ArrayBuffer
 */
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
}

/**
 * Проверяет, является ли устройство iOS
 */
export const isIOSDevice = (): boolean => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * Проверяет, является ли устройство macOS
 */
export const isMacOSDevice = (): boolean => {
    return /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent) ||
           navigator.platform === 'MacIntel'
}

/**
 * Получает информацию о браузере
 */
export const getBrowserInfo = (): { name: string; version?: string; isSupported: boolean } => {
    const userAgent = navigator.userAgent
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        const match = userAgent.match(/Chrome\/(\d+)/)
        const version = match ? parseInt(match[1]) : 0
        return {
            name: 'Chrome',
            version: match ? match[1] : undefined,
            isSupported: version >= 85 // Touch ID поддержка с Chrome 85+
        }
    }
    
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        return {
            name: 'Safari',
            isSupported: true // Safari отлично поддерживает Touch ID на macOS
        }
    }
    
    if (userAgent.includes('Firefox')) {
        const match = userAgent.match(/Firefox\/(\d+)/)
        const version = match ? parseInt(match[1]) : 0
        return {
            name: 'Firefox',
            version: match ? match[1] : undefined,
            isSupported: version >= 90 // Ограниченная поддержка с Firefox 90+
        }
    }
    
    if (userAgent.includes('Edg')) {
        return {
            name: 'Edge',
            isSupported: true // Edge поддерживает WebAuthn на macOS
        }
    }
    
    return {
        name: 'Unknown',
        isSupported: false
    }
}

/**
 * Проверяет HTTPS соединение
 */
export const isHTTPS = (): boolean => {
    return window.location.protocol === 'https:' ||
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1'
}

/**
 * Получает подробную информацию о совместимости
 */
export const getCompatibilityInfo = async (): Promise<{
    webauthn: boolean
    platformAuthenticator: boolean
    browser: ReturnType<typeof getBrowserInfo>
    https: boolean
    device: string
    recommendations: string[]
}> => {
    const browser = getBrowserInfo()
    const device = isIOSDevice() ? 'iOS' : isMacOSDevice() ? 'macOS' : 'Unknown'
    const https = isHTTPS()
    const webauthn = isWebAuthnSupported()
    const platformAuthenticator = webauthn ? await isPlatformAuthenticatorAvailable() : false
    
    const recommendations: string[] = []
    
    if (!https) {
        recommendations.push('Сайт должен работать по HTTPS для биометрической аутентификации')
    }
    
    if (!browser.isSupported) {
        if (browser.name === 'Chrome') {
            recommendations.push('Обновите Chrome до версии 85 или новее для поддержки Touch ID')
        } else if (browser.name === 'Firefox') {
            recommendations.push('Рекомендуется использовать Safari или Chrome для лучшей совместимости')
        } else {
            recommendations.push('Используйте Safari, Chrome (85+) или Edge для биометрической аутентификации')
        }
    }
    
    if (!platformAuthenticator && device === 'macOS') {
        recommendations.push('Убедитесь, что Touch ID настроен в системных настройках macOS')
    }
    
    if (!platformAuthenticator && device === 'iOS') {
        recommendations.push('Убедитесь, что Touch ID или Face ID настроены в настройках iOS')
    }
    
    return {
        webauthn,
        platformAuthenticator,
        browser,
        https,
        device,
        recommendations
    }
}

/**
 * Проверяет, является ли устройство Apple (iOS, iPadOS, macOS)
 */
export const isAppleDevice = (): boolean => {
    return isIOSDevice() || isMacOSDevice()
}

/**
 * Определяет тип биометрической аутентификации на устройстве Apple
 */
export const getAppleBiometricType = (): 'touch-id' | 'face-id' | 'unknown' => {
    if (isMacOSDevice()) {
        return 'touch-id' // macOS поддерживает Touch ID
    }
    
    if (isIOSDevice()) {
        // Определяем модель устройства для выбора типа биометрии
        const userAgent = navigator.userAgent
        
        // iPhone X и новее поддерживают Face ID
        if (userAgent.includes('iPhone')) {
            // Простая эвристика: современные iPhone имеют Face ID
            // В реальном приложении можно использовать более точное определение
            const isModernIPhone = window.screen.height >= 812 && window.screen.width >= 375
            return isModernIPhone ? 'face-id' : 'touch-id'
        }
        
        // iPad Pro с Face ID
        if (userAgent.includes('iPad')) {
            const isModernIPad = window.screen.height >= 1024 && window.screen.width >= 768
            return isModernIPad ? 'face-id' : 'touch-id'
        }
    }
    
    return 'unknown'
}

/**
 * Возвращает локализованное название биометрической аутентификации
 */
export const getBiometricDisplayName = (): string => {
    const biometricType = getAppleBiometricType()
    
    switch (biometricType) {
        case 'touch-id':
            return 'Touch ID'
        case 'face-id':
            return 'Face ID'
        default:
            return 'Биометрическая аутентификация'
    }
}

/**
 * Проверяет, поддерживает ли устройство биометрию
 */
export const isBiometricSupported = async (): Promise<boolean> => {
    const isSupported = isWebAuthnSupported()
    const isPlatformAvailable = await isPlatformAuthenticatorAvailable()
    
    return isSupported && isPlatformAvailable && isAppleDevice()
}