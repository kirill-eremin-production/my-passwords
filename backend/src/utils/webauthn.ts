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
  
  // Функция для конверсии base64 в base64url
  const toBase64url = (base64: string): string => {
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };
  
  // Преобразуем все данные из base64 в base64url для совместимости с @simplewebauthn/server
  const base64urlChallenge = toBase64url(challenge);
  const base64urlAuthenticatorData = toBase64url(authenticatorData);
  const base64urlClientDataJSON = toBase64url(clientDataJSON);
  const base64urlSignature = toBase64url(signature);
  const base64urlCredentialId = toBase64url(credentialId);
  
  console.log('🔍 Base64 -> Base64url конверсия:');
  console.log('  - Challenge:', base64urlChallenge);
  console.log('  - AuthenticatorData:', base64urlAuthenticatorData.substring(0, 20) + '...');
  console.log('  - ClientDataJSON:', base64urlClientDataJSON.substring(0, 20) + '...');
  console.log('  - Signature:', base64urlSignature.substring(0, 20) + '...');
  console.log('  - CredentialId:', base64urlCredentialId);
  
  // Подготавливаем данные для верификации
  const verification: VerifyAuthenticationResponseOpts = {
    response: {
      id: base64urlCredentialId,
      rawId: base64urlCredentialId,
      response: {
        authenticatorData: base64urlAuthenticatorData,
        clientDataJSON: base64urlClientDataJSON,
        signature: base64urlSignature,
      },
      type: 'public-key',
      clientExtensionResults: {},
    },
    expectedChallenge: base64urlChallenge,
    expectedOrigin,
    expectedRPID: process.env.WEBAUTHN_RP_ID || 'local.passwords.keremin.ru',
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
    
    console.log('🔍 Детали валидации clientData:');
    console.log('  - clientData.type:', clientData.type);
    console.log('  - clientData.challenge:', clientData.challenge);
    console.log('  - expectedChallenge:', expectedChallenge);
    console.log('  - clientData.origin:', clientData.origin);
    console.log('  - expectedOrigin:', expectedOrigin);
    
    // Проверка типа операции
    if (clientData.type !== 'webauthn.get') {
      console.log('❌ Неверный тип операции WebAuthn');
      return { isValid: false, error: 'Неверный тип операции WebAuthn' };
    }
    
    // Проверка challenge - может быть проблема с base64 vs base64url
    const clientChallenge = clientData.challenge;
    
    // Пробуем разные варианты сравнения challenge
    const challengeMatch = clientChallenge === expectedChallenge ||
                          clientChallenge === expectedChallenge.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') ||
                          clientChallenge.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') === expectedChallenge;
    
    if (!challengeMatch) {
      console.log('❌ Challenge не совпадает');
      console.log('  - Прямое сравнение:', clientChallenge === expectedChallenge);
      console.log('  - base64 vs base64url сравнение доступно для отладки');
      return { isValid: false, error: 'Неверный challenge' };
    }
    
    console.log('✅ Challenge совпадает');
    
    // Проверка origin
    if (clientData.origin !== expectedOrigin) {
      console.log('❌ Origin не совпадает');
      return { isValid: false, error: 'Неверный origin' };
    }
    
    console.log('✅ Все проверки прошли успешно');
    return { isValid: true };
    
  } catch (error) {
    console.log('❌ Ошибка парсинга clientDataJSON:', error);
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