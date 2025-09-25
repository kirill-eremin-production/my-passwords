import { Request, Response } from "express";
import { getSessionFromReq } from "../../middlewares/authorization/utils";
import { BiometricRegistrationRequest } from "../../types/biometric";
import { storeBiometricCredential } from "../../biometricStore";

/**
 * Регистрирует биометрические учетные данные вместе с зашифрованным мастер-паролем
 * Требует авторизованную сессию (пользователь должен быть полностью авторизован)
 */
export function registerBiometric(req: Request, res: Response) {
  const session = getSessionFromReq(req);
  
  if (!session || !session.valid) {
    res.status(403).json({ error: "Требуется авторизация для регистрации биометрии" });
    return;
  }

  const registrationData: BiometricRegistrationRequest = req.body.data;
  
  if (!registrationData) {
    res.status(400).json({ error: "Отсутствуют данные регистрации" });
    return;
  }

  const { credentialId, publicKey, authenticatorData, clientDataJSON } = registrationData;

  if (!credentialId || !publicKey) {
    res.status(400).json({ error: "Отсутствуют обязательные поля" });
    return;
  }

  try {
    // Сохраняем только метаданные биометрических учетных данных (БЕЗ мастер-пароля!)
    const biometricCredential = {
      id: credentialId,
      publicKey,
      counter: 0,
      createdAt: new Date().toISOString(),
      sessionId: session.sessionId,
      userAgent: req.headers["user-agent"]
    };

    storeBiometricCredential(biometricCredential);

    res.status(200).json({
      success: true,
      message: "Биометрические данные успешно зарегистрированы"
    });
  } catch (error) {
    console.error("Ошибка регистрации биометрических данных:", error);
    res.status(500).json({ error: "Ошибка сервера при регистрации биометрии" });
  }
}