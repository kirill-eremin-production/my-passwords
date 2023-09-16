import { Request } from "express";

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
 * Generates a unique random sessionId
 */
export function generateSessionId(): string {
  const time = new Date().getTime();
  const randomNumber = Math.random();

  return `${time}-${randomNumber}`;
}
