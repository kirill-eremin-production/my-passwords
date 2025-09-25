import { Request, Response } from "express";
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { VerifyRegistrationResponseOpts } from '@simplewebauthn/server';
import { getSessionFromReq } from "../../middlewares/authorization/utils";
import { BiometricRegistrationRequest } from "../../types/biometric";
import { storeBiometricCredential } from "../../biometricStore";
import { getExpectedOrigin } from "../../utils/webauthn";

/**
 * Регистрирует биометрические учетные данные вместе с зашифрованным мастер-паролем
 * Требует авторизованную сессию (пользователь должен быть полностью авторизован)
 */
export async function registerBiometric(req: Request, res: Response) {
  const session = getSessionFromReq(req);
  
  console.log('🔍 Регистрация биометрии - проверка сессии:', {
    sessionExists: !!session,
    sessionValid: session?.valid,
    sessionId: session?.sessionId
  });
  
  let currentSession = session;
  
  // Если нет сессии вообще, создаем новую валидную сессию
  // Это нужно для случаев когда пользователь вошел через мастер-пароль
  if (!session) {
    console.log('🔄 Создание новой валидной сессии для регистрации биометрии');
    const { createNewSession } = require("../../middlewares/authorization/utils");
    const newSessionId = createNewSession();
    
    // Создаем новую валидную сессию
    const newSessionData = {
      sessionId: newSessionId,
      code: null,
      valid: true,
      time: Date.now()
    };
    
    // Обновляем сессию как валидную
    const { storeSession } = require("../../sessionsStore");
    storeSession(newSessionData);
    
    // Устанавливаем cookie с новой сессией
    res.cookie("sessionId", newSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    currentSession = newSessionData;
    console.log('✅ Создана новая валидная сессия:', newSessionId);
  }

  const registrationData: BiometricRegistrationRequest = req.body.data;
  
  if (!registrationData) {
    res.status(400).json({
      success: false,
      message: "Отсутствуют данные регистрации"
    });
    return;
  }

  const { credentialId, publicKey, authenticatorData, clientDataJSON, attestationObject } = registrationData;

  if (!credentialId || !attestationObject || !clientDataJSON) {
    res.status(400).json({
      success: false,
      message: "Отсутствуют обязательные поля"
    });
    return;
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
    const clientData = JSON.parse(Buffer.from(clientDataJSON, 'base64').toString());
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
      expectedChallenge: toBase64url(challengeFromClient), // Используем challenge из clientData
      expectedOrigin,
      expectedRPID,
      requireUserVerification: true,
    };

    console.log('🔄 Верифицируем регистрацию с @simplewebauthn/server...');
    const verificationResult = await verifyRegistrationResponse(verification);

    if (!verificationResult.verified) {
      console.error('❌ Верификация регистрации не прошла:', verificationResult);
      res.status(400).json({
        success: false,
        message: "Ошибка верификации регистрации биометрии"
      });
      return;
    }

    console.log('✅ Регистрация верифицирована успешно');

    // Сохраняем правильные метаданные с COSE публичным ключом
    const biometricCredential = {
      id: credentialId,
      publicKey: Buffer.from(verificationResult.registrationInfo!.credential.publicKey).toString('base64'),
      counter: verificationResult.registrationInfo!.credential.counter,
      createdAt: new Date().toISOString(),
      sessionId: currentSession!.sessionId,
      userAgent: req.headers["user-agent"]
    };

    console.log('🔄 Сохраняем credential с правильным COSE публичным ключом...');
    storeBiometricCredential(biometricCredential);

    res.status(200).json({
      success: true,
      message: "Биометрические данные успешно зарегистрированы"
    });
  } catch (error) {
    console.error("Ошибка регистрации биометрических данных:", error);
    res.status(500).json({
      success: false,
      message: `Ошибка сервера при регистрации биометрии: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
    });
  }
}