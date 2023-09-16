import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import { Request, Response } from "express";

import * as AuthorizationUtils from "./utils";

import { authorizationMiddleware } from "./authorizationMiddleware";
import { createNewSession } from "./utils";
import { readFileSync, writeFileSync } from "fs";

const getResponseMock = (): Response => {
  return {
    cookie: jest.fn(),
    status: jest.fn(),
    end: jest.fn(),
  } as unknown as Response;
};

const sessionStorePath = "./store/sessions.txt";

const clearSessionStore = () =>
  writeFileSync(sessionStorePath, "{}", { encoding: "utf-8" });

describe("authorizationMiddleware", () => {
  const testSessionId = "test-sessionId";

  beforeEach(() => {
    clearSessionStore();
  });

  afterEach(() => {
    clearSessionStore();
    jest.clearAllMocks();
  });

  test("no session - creates a session, sets a cookie and returns a 401 status", () => {
    // Arrange
    const nextFnMock = jest.fn();
    const response = getResponseMock();

    // Act
    authorizationMiddleware({} as Request, response, nextFnMock);

    // Assert
    const sessionStore = JSON.parse(
      readFileSync(sessionStorePath, { encoding: "utf-8" })
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

  test("exists invalid session - returns status 401", () => {
    // Arrange
    const nextFnMock = jest.fn();
    const response = getResponseMock();

    writeFileSync(
      sessionStorePath,
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
    authorizationMiddleware(
      { cookies: { sessionId: testSessionId } } as Request,
      response,
      nextFnMock
    );

    // Assert
    expect(nextFnMock).not.toBeCalled();
    expect(response.cookie).not.toBeCalled();

    expect(response.status).toBeCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(401);

    expect(response.end).toBeCalledTimes(1);
  });

  test("there is a valid session - calls the next function", () => {
    // Arrange
    const nextFnMock = jest.fn();
    const response = getResponseMock();

    writeFileSync(
      sessionStorePath,
      JSON.stringify({
        [testSessionId]: {
          sessionId: testSessionId,
          time: 125,
          code: null,
          valid: true,
        },
      })
    );

    // Act
    authorizationMiddleware(
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

describe("authorizationMiddleware with mocks", () => {
  const testSessionId = "test-sessionId";

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("no session - creates a session, sets a cookie and returns a 401 status", () => {
    jest
      .spyOn(AuthorizationUtils, "getSessionFromReq")
      .mockReturnValue(undefined);
    jest
      .spyOn(AuthorizationUtils, "createNewSession")
      .mockReturnValue(testSessionId);

    const nextFnMock = jest.fn();
    const response = getResponseMock();

    authorizationMiddleware({} as Request, response, nextFnMock);

    expect(nextFnMock).not.toBeCalled();

    expect(response.cookie).toBeCalledTimes(1);
    expect(response.cookie).toHaveBeenCalledWith("sessionId", testSessionId, {
      httpOnly: true,
    });

    expect(response.status).toBeCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(401);

    expect(response.end).toBeCalledTimes(1);
  });

  test("exists invalid session - returns status 401", () => {
    jest.spyOn(AuthorizationUtils, "getSessionFromReq").mockReturnValue({
      sessionId: testSessionId,
      code: null,
      time: 125,
      valid: false,
    });

    const nextFnMock = jest.fn();
    const response = getResponseMock();

    authorizationMiddleware({} as Request, response, nextFnMock);

    expect(nextFnMock).not.toBeCalled();

    expect(response.cookie).not.toBeCalled();

    expect(response.status).toBeCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(401);

    expect(response.end).toBeCalledTimes(1);
  });

  test("there is a valid session - calls the next function", () => {
    jest.spyOn(AuthorizationUtils, "getSessionFromReq").mockReturnValue({
      sessionId: testSessionId,
      code: null,
      time: 125,
      valid: true,
    });

    const nextFnMock = jest.fn();
    const response = getResponseMock();

    authorizationMiddleware({} as Request, response, nextFnMock);

    expect(nextFnMock).toBeCalledTimes(1);

    expect(response.cookie).not.toBeCalled();
    expect(response.status).not.toBeCalled();
    expect(response.end).not.toBeCalled();
  });
});
