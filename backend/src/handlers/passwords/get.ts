import { Request, Response } from "express";

import { readStore } from "../../store.js";

export function getPasswords(req: Request, res: Response) {
  const storeData = readStore();

  res.json({
    data: storeData,
  });
}
