import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { 
  VerifyAuthenticationResponseOpts,
  VerifiedAuthenticationResponse 
} from '@simplewebauthn/server';
import { BiometricCredential } from '../types/biometric';

/**
 * Проверяет WebAuthn подпись и возвращает результат верификации
 */
export async function verifyWebAuthnSignature(
  credentialId: string,
  authenticatorData: string,
  clientDataJSON: string,
  signature: string,
  challenge: string,
  credential: BiometricCredential,
  expectedOrigin: string
): Promise<VerifiedAuthenticationResponse> {
  
  // Подготавливаем данные для верификации
  const verification: VerifyAuthenticationResponseOpts = {
    response: {
      id: credentialId,
      rawId: credentialId,
      response: {
        authenticatorData,
        clientDataJSON,
        signature,
      },
      type: 'public-key',
      clientExtensionResults: {},
    },
    expectedChallenge: challenge,
    expectedOrigin,
    expectedRPID: process.env.WEBAUTHN_RP_ID || 'localhost',
    credential: {
      id: credential.id,
      publicKey: new Uint8Array(Buffer.from(credential.publicKey, 'base64')),
      counter: credential.counter,
    },
    requireUserVerification: true,
  };

  return await verifyAuthenticationResponse(verification);
}

/**
 * Проверяет базовые данные WebAuthn
 */
export function validateWebAuthnClientData(
  clientDataJSON: string,
  expectedChallenge: string,
  expectedOrigin: string
): { isValid: boolean; error?: string } {
  try {
    const clientData = JSON.parse(Buffer.from(clientDataJSON, 'base64').toString());
    
    // Проверка типа операции
    if (clientData.type !== 'webauthn.get') {
      return { isValid: false, error: 'Неверный тип операции WebAuthn' };
    }
    
    // Проверка challenge
    if (clientData.challenge !== expectedChallenge) {
      return { isValid: false, error: 'Неверный challenge' };
    }
    
    // Проверка origin
    if (clientData.origin !== expectedOrigin) {
      return { isValid: false, error: 'Неверный origin' };
    }
    
    return { isValid: true };
    
  } catch (error) {
    return { isValid: false, error: 'Ошибка парсинга clientDataJSON' };
  }
}

/**
 * Извлекает counter из authenticatorData
 */
export function extractCounterFromAuthenticatorData(authenticatorData: string): number {
  try {
    const authDataBuffer = Buffer.from(authenticatorData, 'base64');
    
    // Counter находится в байтах 33-36 (4 байта, big-endian)
    if (authDataBuffer.length < 37) {
      throw new Error('Недостаточная длина authenticatorData');
    }
    
    return authDataBuffer.readUInt32BE(33);
  } catch (error) {
    console.error('Ошибка извлечения counter:', error);
    return -1;
  }
}

/**
 * Получает ожидаемый origin на основе окружения
 */
export function getExpectedOrigin(): string {
  if (process.env.NODE_ENV === 'production') {
    return process.env.PRODUCTION_ORIGIN || 'https://passwords.keremin.ru';
  }
  return process.env.DEV_ORIGIN || 'https://local.passwords.keremin.ru:3001';
}