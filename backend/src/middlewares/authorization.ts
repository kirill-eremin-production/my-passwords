import { Request, Response, NextFunction } from "express";

import {
  readSessionsStore,
  storeSession,
  removeExpiredSessionsFromSessionStore,
} from "../sessionsStore.js";
import { sendTelegramMessage } from "../api/telegram/sendMessage.js";

export function authorizationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  removeExpiredSessionsFromSessionStore();

  const sessionIdFromRequest = req?.cookies?.sessionId;

  if (!sessionIdFromRequest) {
    const sessionId = generateSessionId();
    const code = generateCode();
    res.cookie("sessionId", sessionId, { httpOnly: true });
    storeSession({
      sessionId,
      code,
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

function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
