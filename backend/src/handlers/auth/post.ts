import { Request, Response } from "express";

import { storeSession } from "../../sessionsStore";
import { getSessionFromReq } from "../../middlewares/authorization/utils";

/**
 * Когда: в запросе пришел правильный код (код в запросе совпадает с ожидаемым кодом подтверждения сессии)
 * Тогда: делаем сессию валидной и возвращает 200 статус
 * Иначе: возвращаем 403 статус
 */
export function validateSession(req: Request, res: Response) {
  const session = getSessionFromReq(req);
  const code = req?.body?.data?.code;

  if (session && session.code === String(code)) {
    storeSession({ ...session, valid: true });
    res.sendStatus(200);
    return;
  } else {
    res.sendStatus(403);
    return;
  }
}
