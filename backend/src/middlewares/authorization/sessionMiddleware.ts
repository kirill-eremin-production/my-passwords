import { Request, Response, NextFunction } from "express";

import { getSessionFromReq, createNewSession } from "./utils";

/**
 * Когда: в запросе нет сессии
 * Тогда:
 *    — создаем новую сессию,
 *    — устанавливаем cookie с id этой сессии,
 *    — возвращаем 401 статус (потому что сессию еще надо подтвердить кодом безопасности)
 *
 * Когда: в запросе есть сессия
 * Тогда: идем дальше
 */
export function sessionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const session = getSessionFromReq(req);

  if (!session) {
    const newSessionId = createNewSession();

    res.cookie("sessionId", newSessionId, { httpOnly: true });
    res.status(401);
    res.end();
    return;
  }

  next();
  return;
}
