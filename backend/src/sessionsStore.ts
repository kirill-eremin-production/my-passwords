import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";

import { HOUR } from "./constants";
import { encryptedStore } from "./utils/encryptedStore";

export interface SessionData {
  sessionId: string;
  code: string | null;
  valid: boolean;
  time: number;
}

const storeDirPath = resolve(".", "store");
export const sessionsFilePath = resolve(storeDirPath, "sessions.txt");

/** При необходимости создает файл для хранения сессий */
export function prepareSessionsStore() {
  prepareAppDir();

  // Валидация ключа шифрования
  if (!encryptedStore.validateEncryptionKey()) {
    throw new Error("Невалидный ключ шифрования для сессий!");
  }

  // Миграция существующего файла в зашифрованный формат (если нужно)
  if (existsSync(sessionsFilePath)) {
    try {
      encryptedStore.migrateToEncrypted(sessionsFilePath);
    } catch (error) {
      console.error("⚠️ Ошибка миграции файла сессий:", error);
    }
  }
}

function prepareAppDir() {
  const isAppDirExists = existsSync(storeDirPath);

  if (!isAppDirExists) {
    mkdirSync(storeDirPath, { recursive: true });
  }
}

export function readSessionsStore(): string {
  try {
    const data = encryptedStore.readEncrypted(sessionsFilePath);
    return data || "{}"; // Возвращаем пустой объект если файл пустой
  } catch (error) {
    console.error("Ошибка чтения зашифрованного хранилища сессий:", error);
    return "{}";
  }
}

export function writeSessionsStore(data: string) {
  try {
    encryptedStore.writeEncrypted(sessionsFilePath, data);
  } catch (error) {
    console.error("Ошибка записи в зашифрованное хранилище сессий:", error);
    throw error;
  }
}

export function storeSession(sessionData: SessionData) {
  const sessionStore = JSON.parse(readSessionsStore() || "{}");

  sessionStore[sessionData.sessionId] = sessionData;

  writeSessionsStore(JSON.stringify(sessionStore, null, 4));
}

export function readSessionById(sessionId: string): SessionData | undefined {
  const sessionStore = JSON.parse(readSessionsStore() || "{}");

  return sessionStore[sessionId];
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
