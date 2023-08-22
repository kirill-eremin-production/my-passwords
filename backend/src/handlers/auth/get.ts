import { Request, Response } from "express";

export function checkAuth(req: Request, res: Response) {
  res.json({
    data: "ok",
  });
}
