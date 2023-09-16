import { Request, Response, NextFunction } from "express";

import { getSessionFromReq, createNewSession } from "./utils";

export function authorizationMiddleware(
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

  if (!session.valid) {
    res.status(401);
    res.end();
    return;
  }

  next();
  return;
}
