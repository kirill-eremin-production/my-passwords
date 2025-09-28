import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { VerifyAuthenticationResponseOpts } from '@simplewebauthn/server';
import { createHash } from 'crypto';

/**
 * Извлекает counter из authenticatorData
 * Counter находится в байтах 33-36 authenticatorData
 */
export function extractCounterFromAuthenticatorData(authenticatorData: string): number {
  try {
    const buffer = Buffer.from(authenticatorData, 'base64');
    
    // Counter занимает 4 байта начиная с позиции 33
    if (buffer.length < 37) {
      console.error('authenticatorData слишком короткий для извлечения counter');
      return -1;
    }
    
    // Читаем 4 байта как big-endian unsigned integer
    const counter = buffer.readUInt32BE(33);
    
    console.log(`🔍 Извлечен counter: ${counter} из authenticatorData длиной ${buffer.length} байт`);
    return counter;
  } catch (error) {
    console.error('Ошибка извлечения counter из authenticatorData:', error);
    return -1;
  }
}

/**
 * Получает ожидаемый origin для текущего окружения
 */
export function getExpectedOrigin(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return process.env.WEBAUTHN_ORIGIN || 'https://passwords.keremin.ru';
  } else {
    return process.env.WEBAUTHN_ORIGIN || 'https://local.passwords.keremin.ru:3000';
  }
}

/**
 * Валидирует clientDataJSON для WebAuthn
 */
export function validateWebAuthnClientData(
  clientDataJSON: string,
  expectedChallenge: string,
  expectedOrigin: string
): { isValid: boolean; error?: string } {
  try {
    // Декодируем clientDataJSON
    const clientData = JSON.parse(Buffer.from(clientDataJSON, 'base64').toString());
    
    console.log('🔍 Валидация clientData:');
    console.log('  - type:', clientData.type);
    console.log('  - challenge:', clientData.challenge);
    console.log('  - origin:', clientData.origin);
    console.log('  - expectedChallenge:', expectedChallenge);
    console.log('  - expectedOrigin:', expectedOrigin);
    
    // Проверяем тип операции
    if (clientData.type !== 'webauthn.get') {
      return {
        isValid: false,
        error: `Неверный тип операции: ${clientData.type}, ожидался webauthn.get`
      };
    }
    
    // Проверяем challenge
    if (clientData.challenge !== expectedChallenge) {
      return {
        isValid: false,
        error: `Challenge не совпадает: получен ${clientData.challenge}, ожидался ${expectedChallenge}`
      };
    }
    
    // Проверяем origin
    if (clientData.origin !== expectedOrigin) {
      return {
        isValid: false,
        error: `Origin не совпадает: получен ${clientData.origin}, ожидался ${expectedOrigin}`
      };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('Ошибка валидации clientData:', error);
    return {
      isValid: false,
      error: `Ошибка парсинга clientData: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
    };
  }
}

/**
 * Верифицирует подпись WebAuthn используя @simplewebauthn/server
 */
export async function verifyWebAuthnSignature(
  credentialId: string,
  authenticatorData: string,
  clientDataJSON: string,
  signature: string,
  expectedChallenge: string,
  credential: { publicKey: string; counter: number },
  expectedOrigin: string
): Promise<{ verified: boolean; authenticationInfo?: any; error?: string }> {
  try {
    // Преобразуем данные в формат base64url для библиотеки
    const toBase64url = (base64: string): string => {
      return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };

    const expectedRPID = process.env.WEBAUTHN_RP_ID || 'local.passwords.keremin.ru';

    console.log('🔄 Верифицируем WebAuthn подпись с @simplewebauthn/server...');
    console.log('  - credentialId длина:', credentialId.length);
    console.log('  - expectedOrigin:', expectedOrigin);
    console.log('  - expectedRPID:', expectedRPID);
    console.log('  - expectedChallenge:', expectedChallenge);
    console.log('  - credential counter:', credential.counter);

    // Подготавливаем данные для верификации
    const verification: VerifyAuthenticationResponseOpts = {
      response: {
        id: toBase64url(credentialId),
        rawId: toBase64url(credentialId),
        response: {
          authenticatorData: toBase64url(authenticatorData),
          clientDataJSON: toBase64url(clientDataJSON),
          signature: toBase64url(signature),
        },
        type: 'public-key',
        clientExtensionResults: {},
      },
      expectedChallenge: toBase64url(expectedChallenge),
      expectedOrigin,
      expectedRPID,
      credential: {
        id: credentialId,
        publicKey: new Uint8Array(Buffer.from(credential.publicKey, 'base64')),
        counter: credential.counter,
      },
      requireUserVerification: true,
    };

    const verificationResult = await verifyAuthenticationResponse(verification);
    
    if (verificationResult.verified) {
      console.log('✅ WebAuthn подпись верифицирована успешно');
      console.log('  - новый counter:', verificationResult.authenticationInfo.newCounter);
      
      return {
        verified: true,
        authenticationInfo: verificationResult.authenticationInfo
      };
    } else {
      console.error('❌ WebAuthn подпись не прошла верификацию');
      return {
        verified: false,
        error: 'Подпись WebAuthn не прошла верификацию'
      };
    }
  } catch (error) {
    console.error('❌ Ошибка верификации WebAuthn подписи:', error);
    return {
      verified: false,
      error: `Ошибка верификации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
    };
  }
}

/**
 * Вычисляет SHA-256 хеш от данных
 */
export function sha256(data: Buffer): Buffer {
  return createHash('sha256').update(data as any).digest();
}

/**
 * Конвертирует base64 в base64url
 */
export function base64ToBase64url(base64: string): string {
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Конвертирует base64url в base64
 */
export function base64urlToBase64(base64url: string): string {
  // Добавляем padding если необходимо
  let padded = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const paddingNeeded = 4 - (padded.length % 4);
  if (paddingNeeded !== 4) {
    padded += '='.repeat(paddingNeeded);
  }
  return padded;
}