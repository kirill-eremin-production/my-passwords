import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import { Request } from "express";
import { readFileSync, writeFileSync } from "fs";

import { sessionMiddleware } from "./sessionMiddleware";

import { getResponseMock } from "../../_tests/utils/responseMock";
import { clearSessionStore } from "../../_tests/utils/sessionStore";
import { sessionsFilePath } from "../../sessionsStore";

describe("sessionMiddleware", () => {
  const testSessionId = "test-sessionId";

  beforeEach(() => {
    clearSessionStore();
  });

  afterEach(() => {
    clearSessionStore();
    jest.clearAllMocks();
  });

  test("Когда: в запросе нет сессии; Тогда: создает сессию, устанавливает cookie и возвращает 401 статус", () => {
    // Arrange
    const nextFnMock = jest.fn();
    const response = getResponseMock();

    // Act
    sessionMiddleware({} as Request, response, nextFnMock);

    // Assert
    const sessionStore = JSON.parse(
      readFileSync(sessionsFilePath, { encoding: "utf-8" })
    );
    const sessionId = Object.keys(sessionStore).shift();

    expect(nextFnMock).not.toBeCalled();

    expect(response.cookie).toBeCalledTimes(1);
    expect(response.cookie).toHaveBeenCalledWith("sessionId", sessionId, {
      httpOnly: true,
    });

    expect(response.status).toBeCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(401);

    expect(response.end).toBeCalledTimes(1);
  });

  test("Когда: в запросе есть сессия; Тогда: вызывает функцию next()", () => {
    // Arrange
    const nextFnMock = jest.fn();
    const response = getResponseMock();

    writeFileSync(
      sessionsFilePath,
      JSON.stringify({
        [testSessionId]: {
          sessionId: testSessionId,
          time: 125,
          code: null,
          valid: false,
        },
      })
    );

    // Act
    sessionMiddleware(
      { cookies: { sessionId: testSessionId } } as Request,
      response,
      nextFnMock
    );

    // Assert
    expect(nextFnMock).toBeCalledTimes(1);

    expect(response.cookie).not.toBeCalled();
    expect(response.status).not.toBeCalled();
    expect(response.end).not.toBeCalled();
  });
});
