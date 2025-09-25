import { existsSync } from "fs";
import { resolve } from "path";
import { createHash } from "crypto";

import { BiometricCredential, WebAuthnChallenge } from "./types/biometric";
import { encryptedStore } from "./utils/encryptedStore";

const storeDirPath = resolve(".", "store");
const biometricFilePath = resolve(storeDirPath, "biometric.txt");
const challengesFilePath = resolve(storeDirPath, "challenges.txt");

// УДАЛЕНЫ функции шифрования мастер-пароля для безопасности!
// Мастер-пароль теперь хранится только локально на клиенте.

/**
 * При необходимости создает файлы для хранения биометрических данных
 */
export function prepareBiometricStore() {
  prepareStoreDir();
  
  // Валидация ключа шифрования
  if (!encryptedStore.validateEncryptionKey()) {
    throw new Error('Невалидный ключ шифрования для биометрических данных!');
  }

  // Миграция существующих файлов в зашифрованный формат
  if (existsSync(biometricFilePath)) {
    try {
      encryptedStore.migrateToEncrypted(biometricFilePath);
    } catch (error) {
      console.error('⚠️ Ошибка миграции биометрического файла:', error);
    }
  }

  if (existsSync(challengesFilePath)) {
    try {
      encryptedStore.migrateToEncrypted(challengesFilePath);
    } catch (error) {
      console.error('⚠️ Ошибка миграции файла challenges:', error);
    }
  }
}

function prepareStoreDir() {
  if (!existsSync(storeDirPath)) {
    require("fs").mkdirSync(storeDirPath, { recursive: true });
  }
}

/**
 * Читает зашифрованное хранилище биометрических данных
 */
export function readBiometricStore(): string {
  try {
    const data = encryptedStore.readEncrypted(biometricFilePath);
    return data || "{}";  // Возвращаем пустой объект если файл пустой
  } catch (error) {
    console.error('Ошибка чтения зашифрованного биометрического хранилища:', error);
    return "{}";
  }
}

/**
 * Записывает в зашифрованное хранилище биометрических данных
 */
export function writeBiometricStore(data: string) {
  try {
    encryptedStore.writeEncrypted(biometricFilePath, data);
  } catch (error) {
    console.error('Ошибка записи в зашифрованное биометрическое хранилище:', error);
    throw error;
  }
}

/**
 * Сохраняет биометрические учетные данные
 */
export function storeBiometricCredential(credential: BiometricCredential) {
  const store = JSON.parse(readBiometricStore() || "{}");
  store[credential.id] = credential;
  writeBiometricStore(JSON.stringify(store, null, 4));
}

/**
 * Получает биометрические учетные данные по ID
 */
export function getBiometricCredentialById(credentialId: string): BiometricCredential | undefined {
  const store = JSON.parse(readBiometricStore() || "{}");
  return store[credentialId];
}

/**
 * Получает все биометрические учетные данные для сессии
 */
export function getBiometricCredentialsBySession(sessionId: string): BiometricCredential[] {
  const store: Record<string, BiometricCredential> = JSON.parse(readBiometricStore() || "{}");
  return Object.values(store).filter((cred: BiometricCredential) => cred.sessionId === sessionId);
}

/**
 * Удаляет биометрические учетные данные
 */
export function removeBiometricCredential(credentialId: string): boolean {
  const store = JSON.parse(readBiometricStore() || "{}");
  if (store[credentialId]) {
    delete store[credentialId];
    writeBiometricStore(JSON.stringify(store, null, 4));
    return true;
  }
  return false;
}

/**
 * Обновляет счетчик для биометрических учетных данных
 */
export function updateBiometricCredentialCounter(credentialId: string, newCounter: number): boolean {
  const store = JSON.parse(readBiometricStore() || "{}");
  if (store[credentialId]) {
    store[credentialId].counter = newCounter;
    writeBiometricStore(JSON.stringify(store, null, 4));
    return true;
  }
  return false;
}

/**
 * Читает зашифрованное хранилище challenges
 */
export function readChallengesStore(): string {
  try {
    const data = encryptedStore.readEncrypted(challengesFilePath);
    return data || "{}";  // Возвращаем пустой объект если файл пустой
  } catch (error) {
    console.error('Ошибка чтения зашифрованного хранилища challenges:', error);
    return "{}";
  }
}

/**
 * Записывает в зашифрованное хранилище challenges
 */
export function writeChallengesStore(data: string) {
  try {
    encryptedStore.writeEncrypted(challengesFilePath, data);
  } catch (error) {
    console.error('Ошибка записи в зашифрованное хранилище challenges:', error);
    throw error;
  }
}

/**
 * Сохраняет challenge для WebAuthn
 */
export function storeChallenge(challenge: WebAuthnChallenge) {
  const store = JSON.parse(readChallengesStore() || "{}");
  store[challenge.sessionId] = challenge;
  writeChallengesStore(JSON.stringify(store, null, 4));
}

/**
 * Получает challenge по sessionId
 */
export function getChallengeBySessionId(sessionId: string): WebAuthnChallenge | undefined {
  const store = JSON.parse(readChallengesStore() || "{}");
  return store[sessionId];
}

/**
 * Удаляет challenge после использования
 */
export function removeChallenge(sessionId: string): boolean {
  const store = JSON.parse(readChallengesStore() || "{}");
  if (store[sessionId]) {
    delete store[sessionId];
    writeChallengesStore(JSON.stringify(store, null, 4));
    return true;
  }
  return false;
}

/**
 * Удаляет протухшие challenges (старше 5 минут)
 */
export function removeExpiredChallenges() {
  const store = JSON.parse(readChallengesStore() || "{}");
  const filteredChallenges: Record<string, WebAuthnChallenge> = {};
  const now = Date.now();
  const FIVE_MINUTES = 5 * 60 * 1000;

  Object.values(store).forEach((challenge: any) => {
    if (now - challenge.createdAt < FIVE_MINUTES) {
      filteredChallenges[challenge.sessionId] = challenge;
    }
  });

  writeChallengesStore(JSON.stringify(filteredChallenges, null, 4));
}