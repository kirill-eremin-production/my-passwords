import { Request, Response } from "express";
import { randomBytes } from "crypto";
import { storeChallenge } from "../../biometricStore";

/**
 * Генерирует и возвращает challenge для биометрической аутентификации
 */
export function getBiometricChallenge(req: Request, res: Response) {
  try {
    const sessionId = req.cookies?.sessionId;
    
    if (!sessionId) {
      res.status(401).json({ error: "Отсутствует sessionId" });
      return;
    }

    // Генерируем криптографически стойкий challenge
    const challenge = randomBytes(32);
    const challengeBase64 = challenge.toString('base64');

    // Сохраняем challenge для последующей проверки
    storeChallenge({
      sessionId,
      challenge: challengeBase64,
      createdAt: Date.now()
    });

    console.log(`✅ Challenge создан для сессии ${sessionId}`);

    res.status(200).json({
      success: true,
      challenge: challengeBase64
    });

  } catch (error) {
    console.error("Ошибка создания challenge:", error);
    res.status(500).json({ error: "Ошибка сервера при создании challenge" });
  }
}