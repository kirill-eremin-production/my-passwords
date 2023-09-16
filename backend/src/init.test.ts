import {
  describe,
  test,
  expect,
  jest,
  afterEach,
  beforeEach,
} from "@jest/globals";

import { init } from "./init";
import * as SessionStore from "./sessionsStore";
import * as Store from "./store";
import { MIN } from "./constants";

jest.mock("");

describe("init", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllTimers();
  });

  test("prepares the passwords store", () => {
    jest.spyOn(Store, "prepareStore");

    init();

    expect(Store.prepareStore).toHaveBeenCalledTimes(1);
  });

  test("prepares the sessions store", () => {
    jest.spyOn(SessionStore, "prepareSessionsStore");

    init();

    expect(SessionStore.prepareSessionsStore).toHaveBeenCalledTimes(1);
  });

  test("deletes expired sessions every minute", () => {
    jest.spyOn(SessionStore, "removeExpiredSessionsFromSessionStore");

    init();

    expect(SessionStore.removeExpiredSessionsFromSessionStore).not.toBeCalled();

    jest.advanceTimersByTime(5 * MIN);

    expect(
      SessionStore.removeExpiredSessionsFromSessionStore
    ).toHaveBeenCalledTimes(5);
  });
});
