import { Request, Response } from "express";

import { writeStore } from "../../store.js";

export function postPasswords(req: Request, res: Response) {
  const requestData = req.body.data;

  writeStore(requestData);

  res.sendStatus(200);
}
