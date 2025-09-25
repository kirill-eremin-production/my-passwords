import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { createHash } from "crypto";

import { BiometricCredential, WebAuthnChallenge } from "./types/biometric";

const storeDirPath = resolve(".", "store");
const biometricFilePath = resolve(storeDirPath, "biometric.txt");
const challengesFilePath = resolve(storeDirPath, "challenges.txt");
const encoding = "utf-8";

// Ключ для шифрования мастер-паролей (в production должен быть в переменных окружения)
const ENCRYPTION_KEY = process.env.BIOMETRIC_ENCRYPTION_KEY || "my-passwords-biometric-key-2024";

/**
 * Шифрует мастер-пароль (упрощенная версия для совместимости)
 */
export function encryptMasterPassword(masterPassword: string): string {
  // Создаем хеш от ключа шифрования для дополнительной безопасности
  const keyHash = createHash('sha256').update(ENCRYPTION_KEY).digest('hex');
  
  // Простое XOR шифрование с Base64 кодированием
  const encrypted = Buffer.from(masterPassword, 'utf8')
    .map((byte, i) => byte ^ keyHash.charCodeAt(i % keyHash.length))
  
  // Добавляем случайную соль для усложнения
  const timestamp = Date.now().toString();
  const salt = createHash('md5').update(timestamp).digest('hex').slice(0, 8);
  
  return salt + ':' + Buffer.from(encrypted).toString('base64');
}

/**
 * Расшифровывает мастер-пароль
 */
export function decryptMasterPassword(encryptedData: string): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 2) {
    throw new Error('Неверный формат зашифрованных данных');
  }
  
  const salt = parts[0]; // Соль для проверки целостности (можно игнорировать в простой реализации)
  const encryptedBase64 = parts[1];
  
  const keyHash = createHash('sha256').update(ENCRYPTION_KEY).digest('hex');
  const encrypted = Array.from(Buffer.from(encryptedBase64, 'base64'));
  
  // Расшифровываем XOR
  const decrypted = encrypted
    .map((byte, i) => byte ^ keyHash.charCodeAt(i % keyHash.length))
  
  return Buffer.from(decrypted).toString('utf8');
}

/**
 * При необходимости создает файлы для хранения биометрических данных
 */
export function prepareBiometricStore() {
  prepareStoreDir();

  if (!existsSync(biometricFilePath)) {
    writeFileSync(biometricFilePath, "{}", { encoding });
  }

  if (!existsSync(challengesFilePath)) {
    writeFileSync(challengesFilePath, "{}", { encoding });
  }
}

function prepareStoreDir() {
  if (!existsSync(storeDirPath)) {
    require("fs").mkdirSync(storeDirPath);
  }
}

/**
 * Читает хранилище биометрических данных
 */
export function readBiometricStore(): string {
  return readFileSync(biometricFilePath, { encoding });
}

/**
 * Записывает в хранилище биометрических данных
 */
export function writeBiometricStore(data: string) {
  writeFileSync(biometricFilePath, data, { encoding });
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
 * Читает хранилище challenges
 */
export function readChallengesStore(): string {
  return readFileSync(challengesFilePath, { encoding });
}

/**
 * Записывает в хранилище challenges
 */
export function writeChallengesStore(data: string) {
  writeFileSync(challengesFilePath, data, { encoding });
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