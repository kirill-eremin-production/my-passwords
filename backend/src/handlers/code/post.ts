import { Request, Response } from "express";

import { getSessionFromReq } from "../../middlewares/authorization/utils";
import { generateConfirmationCode } from "../../utils/generateConfirmationCode";
import { storeSession } from "../../sessionsStore";
import { sendTelegramMessage } from "../../api/telegram/sendMessage";

/**
 * Когда: приходит запрос
 * Тогда:
 *    — генерируется код подтверждения сессии,
 *    — записывает этот код в сессию,
 *    — отправляет код в telegram
 */
export async function generateAndSendCode(req: Request, res: Response) {
  const session = getSessionFromReq(req);
  const code = String(generateConfirmationCode());

  // TODO: В этот момент сессия уже гарантированно есть, т.к. логика проверки и создания сессии выполняется в миддлваре.
  //       Надо придумать как сделать так, чтобы в подобных местах не требовала проверка сессии.
  if (!session) {
    res.sendStatus(401);
    return;
  }

  storeSession({ ...session, code });

  // TODO: Понять, что тут приходит в случае успеха и в случае ошибки. Обработать оба варианта. Возможно, здесь надо добавить ретраи.
  const result = await sendTelegramMessage(
    `Ваш код для входа в my-passwords: **${code}**`
  );

  res.sendStatus(200);
  return code;
}
