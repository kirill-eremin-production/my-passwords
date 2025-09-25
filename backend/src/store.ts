import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { encryptedStore } from "./utils/encryptedStore";

const storeDirPath = resolve(".", "store");
export const passwordsFilePath = resolve(storeDirPath, "my-passwords.txt");

/**
 * При необходимости создает директорию и инициализирует зашифрованное хранилище
 */
export function prepareStore() {
  prepareAppDir();
  
  // Валидация ключа шифрования
  if (!encryptedStore.validateEncryptionKey()) {
    throw new Error('Невалидный ключ шифрования! Установите FILE_ENCRYPTION_KEY в .env');
  }

  // Миграция существующего файла в зашифрованный формат (если нужно)
  if (existsSync(passwordsFilePath)) {
    try {
      encryptedStore.migrateToEncrypted(passwordsFilePath);
    } catch (error) {
      console.error('⚠️ Ошибка миграции файла паролей:', error);
    }
  }
}

function prepareAppDir() {
  const isAppDirExists = existsSync(storeDirPath);

  if (!isAppDirExists) {
    mkdirSync(storeDirPath, { recursive: true });
  }
}

/**
 * Читает и расшифровывает данные из хранилища
 */
export function readStore(): string {
  try {
    return encryptedStore.readEncrypted(passwordsFilePath);
  } catch (error) {
    console.error('Ошибка чтения зашифрованного хранилища:', error);
    return '';  // Возвращаем пустую строку при ошибке
  }
}

/**
 * Шифрует и записывает данные в хранилище
 */
export function writeStore(data: string) {
  try {
    encryptedStore.writeEncrypted(passwordsFilePath, data);
    console.log('✅ Данные успешно записаны в зашифрованное хранилище');
  } catch (error) {
    console.error('❌ Ошибка записи в зашифрованное хранилище:', error);
    throw error;
  }
}
