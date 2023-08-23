import { Request, Response } from "express";

import {
  readSessionsStore,
  storeSession,
  removeExpiredSessionsFromSessionStore,
} from "../../sessionsStore.js";

export function sendAuthCode(req: Request, res: Response) {
  const code = req?.body?.data?.code;

  console.log(req?.body);

  if (!code) {
    res.sendStatus(403);
    return;
  }

  const sessionIdFromRequest = req?.cookies?.sessionId;
  const sessionsStore = JSON.parse(readSessionsStore() || "{}");

  const sessionData = sessionsStore[sessionIdFromRequest];

  if (sessionData.code === code) {
    storeSession({ ...sessionData, valid: true });
    res.sendStatus(200);
    return;
  } else {
    storeSession({ ...sessionData, time: 0 });
    removeExpiredSessionsFromSessionStore();
    res.sendStatus(403);
    return;
  }
}
