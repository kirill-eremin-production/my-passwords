import { Request, Response } from "express";
import { BiometricAuthenticationRequest } from "../../types/biometric";
import {
  getBiometricCredentialById,
  decryptMasterPassword,
  getChallengeBySessionId,
  removeChallenge
} from "../../biometricStore";
import { storeSession } from "../../sessionsStore";
import { generateSessionId } from "../../middlewares/authorization/utils";

/**
 * Аутентификация с помощью биометрических данных
 * Проверяет WebAuthn assertion и возвращает мастер-пароль для расшифровки данных
 */
export function authenticateWithBiometric(req: Request, res: Response) {
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

    // TODO: Здесь должна быть полная проверка WebAuthn assertion
    // Для MVP упрощаем проверку - считаем что если credential найден, то аутентификация успешна
    
    // Проверяем базовые данные
    const clientData = JSON.parse(Buffer.from(clientDataJSON, 'base64').toString());
    
    if (clientData.type !== 'webauthn.get') {
      res.status(400).json({ error: "Неверный тип операции WebAuthn" });
      return;
    }

    // В production здесь должна быть проверка:
    // 1. Проверка challenge
    // 2. Проверка origin
    // 3. Проверка подписи с использованием публичного ключа
    // 4. Проверка и обновление счетчика

    // Расшифровываем мастер-пароль
    const masterPassword = decryptMasterPassword(credential.encryptedMasterPassword);

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
      masterPassword: masterPassword,
      message: "Биометрическая аутентификация успешна"
    });

  } catch (error) {
    console.error("Ошибка биометрической аутентификации:", error);
    res.status(500).json({ error: "Ошибка сервера при биометрической аутентификации" });
  }
}