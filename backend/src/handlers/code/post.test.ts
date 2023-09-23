import "dotenv/config";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import { Request } from "express";

import { generateAndSendCode } from "./post";
import { clearSessionStore } from "../../_tests/utils/sessionStore";
import { createNewSession } from "../../middlewares/authorization/utils";
import { readSessionById } from "../../sessionsStore";
import { getResponseMock } from "../../_tests/utils/responseMock";
import * as Telegram from "../../api/telegram/sendMessage";

describe("handlers/code/post", () => {
  const testSessionId = "test-sessionId";

  beforeEach(() => {
    clearSessionStore();
  });

  afterEach(() => {
    clearSessionStore();
    jest.clearAllMocks();
  });

  test("Когда: приходит запрос; Тогда: генерирует код подтверждения сессии, записывает этот код в сессию и отправляет его в telegram", async () => {
    // Подготовка
    const sessionId = createNewSession();
    const responseMock = getResponseMock();

    jest
      .spyOn(Telegram, "sendTelegramMessage")
      .mockImplementation(() => Promise.resolve({} as Response));

    // Выполнение
    const code = await generateAndSendCode(
      { cookies: { sessionId } } as Request,
      responseMock
    );

    // Проверка
    const session = readSessionById(sessionId);
    expect(session?.code).toBe(code);
  });
});
