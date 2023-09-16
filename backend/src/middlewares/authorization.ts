import { Request, Response, NextFunction } from "express";

import { readSessionsStore, storeSession } from "../sessionsStore.js";
import { sendTelegramMessage } from "../api/telegram/sendMessage.js";
import { generateConfirmationCode } from "../utils/generateConfirmationCode.js";

export function authorizationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sessionIdFromRequest = req?.cookies?.sessionId;

  if (!sessionIdFromRequest) {
    const sessionId = generateSessionId();
    const code = generateConfirmationCode();
    res.cookie("sessionId", sessionId, { httpOnly: true });
    storeSession({
      sessionId,
      code: String(code),
      time: new Date().getTime(),
      valid: false,
    });
    sendTelegramMessage(`Ваш код для входа в my-passwords: **${code}**`);
    res.status(401);
    res.end();
  } else {
    const sessionsStore = JSON.parse(readSessionsStore() || "{}");

    if (sessionsStore[sessionIdFromRequest]) {
      if (sessionsStore[sessionIdFromRequest].valid) {
        next();
        return;
      }
    } else {
      res.cookie("sessionId", "", { httpOnly: true });
    }

    res.status(401);
    res.end();
  }
}

function generateSessionId(): string {
  const time = new Date().getTime();
  const randomNumber = Math.random();

  return `${time}-${randomNumber}`;
}
