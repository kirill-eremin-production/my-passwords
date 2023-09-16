import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

import { HOUR } from "./constants";

export interface SessionData {
  sessionId: string;
  code: string;
  valid: boolean;
  time: number;
}

const storeDirPath = resolve(".", "store");
const sessionsFilePath = resolve(storeDirPath, "sessions.txt");
const encoding = "utf-8";

/** При необходимости создает файл для хранения сессий */
export function prepareSessionsStore() {
  prepareAppDir();

  const isStoreFileExists = existsSync(sessionsFilePath);

  if (!isStoreFileExists) {
    writeFileSync(sessionsFilePath, "", { encoding });
  }
}

function prepareAppDir() {
  const isAppDirExists = existsSync(storeDirPath);

  if (!isAppDirExists) {
    mkdirSync(storeDirPath);
  }
}

export function readSessionsStore(): string {
  return readFileSync(sessionsFilePath, { encoding });
}

export function writeSessionsStore(data: string) {
  writeFileSync(sessionsFilePath, data, { encoding });
}

export function storeSession(sessionData: SessionData) {
  const sessionStore = JSON.parse(readSessionsStore() || "{}");

  sessionStore[sessionData.sessionId] = sessionData;

  writeSessionsStore(JSON.stringify(sessionStore, null, 4));
}

export function removeExpiredSessionsFromSessionStore() {
  const sessionStore: Record<string, SessionData> = JSON.parse(
    readSessionsStore() || "{}"
  );

  const filteredSessions: Record<string, SessionData> = {};

  // Удаляем протухшие сессии
  Object.values(sessionStore).forEach((sessionData) => {
    // Сессия живет 1 час
    if (new Date().getTime() - sessionData.time < HOUR) {
      filteredSessions[sessionData.sessionId] = sessionData;
    }
  });

  writeSessionsStore(JSON.stringify(filteredSessions, null, 4));
}
