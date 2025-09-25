import { Request } from "express";
import { randomBytes } from "crypto";

import {
  readSessionsStore,
  SessionData,
  storeSession,
} from "../../sessionsStore";

/**
 * Returns the user session by sessionId cookie
 */
export function getSessionFromReq(req: Request): SessionData | undefined {
  const sessionIdFromRequest: string | undefined = req?.cookies?.sessionId;

  if (!sessionIdFromRequest) {
    return;
  }

  const sessionsStore = JSON.parse(readSessionsStore());

  return sessionsStore[sessionIdFromRequest];
}

/**
 * Creates a new session and stores it in store
 */
export function createNewSession(): string {
  const newSessionId = generateSessionId();

  storeSession({
    sessionId: newSessionId,
    code: null,
    time: new Date().getTime(),
    valid: false,
  });

  return newSessionId;
}

/**
 * Генерирует криптографически стойкий уникальный sessionId
 */
export function generateSessionId(): string {
  // Криптографически стойкий генератор (32 байта = 256 бит)
  const randomId = randomBytes(32).toString('hex');
  const timestamp = Date.now().toString(36); // Компактное представление времени
  
  // Формат: timestamp-randomId для удобства отладки и сортировки
  return `${timestamp}-${randomId}`;
}
