import { Request, Response } from "express";
import { BiometricAuthenticationRequest } from "../../types/biometric";
import {
  getBiometricCredentialById,
  getChallengeBySessionId,
  removeChallenge,
  updateBiometricCredentialCounter
} from "../../biometricStore";
import { storeSession } from "../../sessionsStore";
import { generateSessionId } from "../../middlewares/authorization/utils";
import {
  verifyWebAuthnSignature,
  validateWebAuthnClientData,
  extractCounterFromAuthenticatorData,
  getExpectedOrigin
} from "../../utils/webauthn";

/**
 * Аутентификация с помощью биометрических данных
 * Проверяет WebAuthn assertion и возвращает мастер-пароль для расшифровки данных
 */
export async function authenticateWithBiometric(req: Request, res: Response) {
  const authData: BiometricAuthenticationRequest = req.body.data;
  
  if (!authData) {
    res.status(400).json({ error: "Отсутствуют данные аутентификации" });
    return;
  }

  const { credentialId, authenticatorData, clientDataJSON, signature } = authData;

  if (!credentialId || !authenticatorData || !clientDataJSON || !signature) {
    res.status(400).json({ error: "Отсутствуют обязательные поля" });
    return;
  }

  try {
    // Находим биометрические учетные данные
    const credential = getBiometricCredentialById(credentialId);
    
    if (!credential) {
      res.status(404).json({ error: "Биометрические учетные данные не найдены" });
      return;
    }

    // Получаем challenge для текущей сессии
    const sessionId = req.cookies?.sessionId;
    if (!sessionId) {
      res.status(401).json({ error: "Отсутствует sessionId" });
      return;
    }

    const challengeData = getChallengeBySessionId(sessionId);
    if (!challengeData) {
      res.status(400).json({ error: "Отсутствует challenge для данной сессии" });
      return;
    }

    const expectedOrigin = getExpectedOrigin();
    
    // Проверяем базовые данные WebAuthn
    const clientDataValidation = validateWebAuthnClientData(
      clientDataJSON,
      challengeData.challenge,
      expectedOrigin
    );
    
    if (!clientDataValidation.isValid) {
      res.status(400).json({ error: clientDataValidation.error });
      return;
    }

    // Извлекаем counter из authenticatorData для проверки replay атак
    const newCounter = extractCounterFromAuthenticatorData(authenticatorData);
    if (newCounter === -1) {
      res.status(400).json({ error: "Ошибка извлечения counter из authenticatorData" });
      return;
    }

    // Проверка counter для защиты от replay атак
    if (newCounter <= credential.counter) {
      console.warn(`Возможная replay атака: новый counter (${newCounter}) <= старого (${credential.counter}) для credential ${credentialId}`);
      res.status(400).json({ error: "Обнаружена возможная replay атака" });
      return;
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
        console.error("WebAuthn signature verification failed:", verificationResult);
        res.status(403).json({ error: "Неверная подпись WebAuthn" });
        return;
      }

      // Обновляем counter после успешной верификации
      updateBiometricCredentialCounter(credentialId, verificationResult.authenticationInfo.newCounter);

    } catch (verificationError) {
      console.error("Ошибка верификации WebAuthn:", verificationError);
      res.status(500).json({ error: "Ошибка верификации подписи WebAuthn" });
      return;
    }

    // Удаляем использованный challenge
    removeChallenge(sessionId);

    // Мастер-пароль больше НЕ расшифровывается на сервере для безопасности!
    // Теперь он получается только локально на клиенте.

    // Создаем новую валидную сессию
    const newSessionId = generateSessionId();
    const newSession = {
      sessionId: newSessionId,
      code: null,
      valid: true,
      time: Date.now()
    };

    storeSession(newSession);

    // Устанавливаем cookie с новой сессией
    res.cookie("sessionId", newSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      sessionId: newSessionId,
      valid: true,
      // masterPassword удален для безопасности - получается только локально!
      message: "Биометрическая аутентификация успешна"
    });

  } catch (error) {
    console.error("Ошибка биометрической аутентификации:", error);
    res.status(500).json({ error: "Ошибка сервера при биометрической аутентификации" });
  }
}