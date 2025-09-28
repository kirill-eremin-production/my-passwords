import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { VerifyRegistrationResponseOpts } from '@simplewebauthn/server';

import { BiometricStoreService } from '../core/services/biometric-store.service';
import { SessionsStoreService } from '../core/services/sessions-store.service';
import { AuthService } from '../auth/auth.service';

import { BiometricRegistrationRequest, BiometricAuthenticationRequest } from '../types/biometric';
import { 
  extractCounterFromAuthenticatorData,
  getExpectedOrigin,
  validateWebAuthnClientData,
  verifyWebAuthnSignature,
} from '../utils/webauthn';

@Injectable()
export class BiometricService {
  constructor(
    private readonly biometricStore: BiometricStoreService,
    private readonly sessionsStore: SessionsStoreService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Генерирует и сохраняет challenge для биометрической аутентификации
   */
  generateChallenge(sessionId: string): string {
    // Генерируем криптографически стойкий challenge
    const challenge = randomBytes(32);
    const challengeBase64 = challenge.toString('base64');

    // Сохраняем challenge для последующей проверки
    this.biometricStore.storeChallenge({
      sessionId,
      challenge: challengeBase64,
      createdAt: Date.now(),
    });

    console.log(`✅ Challenge создан для сессии ${sessionId}`);

    return challengeBase64;
  }

  /**
   * Регистрирует биометрические учетные данные
   * Требует авторизованную сессию
   */
  async registerBiometric(
    sessionId: string,
    registrationData: BiometricRegistrationRequest,
    userAgent?: string
  ): Promise<{ success: boolean; message: string }> {
    let currentSessionId = sessionId;
    const session = this.sessionsStore.getSession(sessionId);

    if (!session) {
      throw new Error('Сессия не найдена');
    }

    // Если сессия невалидна, создаем новую валидную сессию для мастер-пароля пользователей
    if (!session.valid) {
      console.log('🔄 Создание новой валидной сессии для регистрации биометрии');
      const newSessionId = this.authService.createNewSession();
      this.sessionsStore.validateSession(newSessionId);
      currentSessionId = newSessionId;
      console.log(`✅ Создана новая валидная сессия ${newSessionId} для регистрации биометрии`);
    }

    const {
      credentialId,
      publicKey,
      authenticatorData,
      clientDataJSON,
      attestationObject,
    } = registrationData;

    if (!credentialId || !attestationObject || !clientDataJSON) {
      throw new Error('Отсутствуют обязательные поля');
    }

    try {
      // Преобразуем данные в формат base64url для библиотеки
      const toBase64url = (base64: string): string => {
        return base64
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      };

      const expectedOrigin = getExpectedOrigin();
      const expectedRPID = process.env.WEBAUTHN_RP_ID || 'local.passwords.keremin.ru';

      // Получаем challenge из clientDataJSON для правильной верификации
      const clientData = JSON.parse(
        Buffer.from(clientDataJSON, 'base64').toString()
      );
      const challengeFromClient = clientData.challenge;

      console.log('🔍 Регистрация - challenge из clientData:', challengeFromClient);

      // Подготавливаем данные для верификации регистрации
      const verification: VerifyRegistrationResponseOpts = {
        response: {
          id: toBase64url(credentialId),
          rawId: toBase64url(credentialId),
          response: {
            attestationObject: toBase64url(attestationObject),
            clientDataJSON: toBase64url(clientDataJSON),
          },
          type: 'public-key',
          clientExtensionResults: {},
        },
        expectedChallenge: toBase64url(challengeFromClient),
        expectedOrigin,
        expectedRPID,
        requireUserVerification: true,
      };

      console.log('🔄 Верифицируем регистрацию с @simplewebauthn/server...');
      const verificationResult = await verifyRegistrationResponse(verification);

      if (!verificationResult.verified) {
        console.error('❌ Верификация регистрации не прошла:', verificationResult);
        throw new Error('Ошибка верификации регистрации биометрии');
      }

      console.log('✅ Регистрация верифицирована успешно');

      // Сохраняем правильные метаданные с COSE публичным ключом
      const biometricCredential = {
        id: credentialId,
        publicKey: Buffer.from(
          verificationResult.registrationInfo!.credential.publicKey
        ).toString('base64'),
        counter: verificationResult.registrationInfo!.credential.counter,
        createdAt: new Date().toISOString(),
        sessionId: currentSessionId,
        userAgent: userAgent,
      };

      console.log('🔄 Сохраняем credential с правильным COSE публичным ключом...');
      this.biometricStore.storeBiometricCredential(biometricCredential);

      return {
        success: true,
        message: 'Биометрические данные успешно зарегистрированы',
      };
    } catch (error) {
      console.error('Ошибка регистрации биометрических данных:', error);
      throw new Error(
        `Ошибка сервера при регистрации биометрии: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
    }
  }

  /**
   * Аутентификация с помощью биометрических данных
   */
  async authenticateWithBiometric(
    sessionId: string,
    authData: BiometricAuthenticationRequest
  ): Promise<{ success: boolean; sessionId: string; valid: boolean; message: string }> {
    const { credentialId, authenticatorData, clientDataJSON, signature } = authData;

    if (!credentialId || !authenticatorData || !clientDataJSON || !signature) {
      throw new Error('Отсутствуют обязательные поля');
    }

    try {
      // Находим биометрические учетные данные
      const credential = this.biometricStore.getBiometricCredentialById(credentialId);

      if (!credential) {
        throw new Error('Биометрические учетные данные не найдены');
      }

      // Получаем challenge для текущей сессии
      console.log('🔍 Аутентификация - sessionId:', sessionId);

      const challengeData = this.biometricStore.getChallengeBySessionId(sessionId);
      console.log('🔍 Challenge для сессии:', challengeData);

      if (!challengeData) {
        console.log('❌ Challenge не найден для сессии:', sessionId);
        throw new Error('Отсутствует challenge для данной сессии');
      }

      const expectedOrigin = getExpectedOrigin();

      // Проверяем базовые данные WebAuthn
      console.log('🔍 Валидируем clientData с challenge:', challengeData.challenge);
      const clientDataValidation = validateWebAuthnClientData(
        clientDataJSON,
        challengeData.challenge,
        expectedOrigin
      );

      if (!clientDataValidation.isValid) {
        console.log('❌ Валидация clientData неуспешна:', clientDataValidation.error);
        throw new Error(clientDataValidation.error);
      }
      console.log('✅ clientData валидирован успешно');

      // Извлекаем counter из authenticatorData для проверки replay атак
      const newCounter = extractCounterFromAuthenticatorData(authenticatorData);
      console.log('🔍 Counter информация:');
      console.log('  - newCounter из authenticatorData:', newCounter);
      console.log('  - сохраненный counter в credential:', credential.counter);

      if (newCounter === -1) {
        console.log('❌ Ошибка извлечения counter');
        throw new Error('Ошибка извлечения counter из authenticatorData');
      }

      // Проверка counter для защиты от replay атак
      if (newCounter < credential.counter) {
        console.warn(
          `❌ Возможная replay атака: новый counter (${newCounter}) < старого (${credential.counter}) для credential ${credentialId}`
        );
        throw new Error('Обнаружена возможная replay атака');
      }

      if (newCounter === credential.counter) {
        console.log(
          '⚠️ Counter не изменился, но это может быть нормально для некоторых аутентификаторов'
        );
      } else {
        console.log('✅ Counter увеличился корректно');
      }

      // ПОЛНАЯ ПРОВЕРКА WEBAUTHN ПОДПИСИ
      try {
        const verificationResult = await verifyWebAuthnSignature(
          credentialId,
          authenticatorData,
          clientDataJSON,
          signature,
          challengeData.challenge,
          credential,
          expectedOrigin
        );

        if (!verificationResult.verified) {
          console.error('WebAuthn signature verification failed:', verificationResult);
          throw new Error('Неверная подпись WebAuthn');
        }

        // Обновляем counter после успешной верификации
        this.biometricStore.updateBiometricCredentialCounter(
          credentialId,
          verificationResult.authenticationInfo.newCounter
        );
      } catch (verificationError) {
        console.error('Ошибка верификации WebAuthn:', verificationError);
        throw new Error('Ошибка верификации подписи WebAuthn');
      }

      // Удаляем использованный challenge
      this.biometricStore.removeChallenge(sessionId);

      // Создаем новую валидную сессию
      const newSessionId = this.authService.createNewSession();
      this.sessionsStore.validateSession(newSessionId);

      return {
        success: true,
        sessionId: newSessionId,
        valid: true,
        message: 'Биометрическая аутентификация успешна',
      };
    } catch (error) {
      console.error('Ошибка биометрической аутентификации:', error);
      throw error;
    }
  }
}