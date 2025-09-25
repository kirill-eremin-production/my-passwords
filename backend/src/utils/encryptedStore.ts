import { createCipher, createDecipher, randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

/**
 * Зашифрованное файловое хранилище с AES-256-CBC
 * Защищает данные на диске от несанкционированного доступа
 */
export class EncryptedFileStore {
  private encryptionKey: string;
  
  constructor() {
    // Получение ключа шифрования из переменных окружения
    this.encryptionKey = process.env.FILE_ENCRYPTION_KEY || 'default-key-change-me-in-production';
    
    if (this.encryptionKey === 'default-key-change-me-in-production') {
      console.warn('⚠️ ПРЕДУПРЕЖДЕНИЕ: Используется стандартный ключ шифрования! Установите FILE_ENCRYPTION_KEY в .env');
    }
  }

  /**
   * Шифрует и записывает данные в файл
   */
  writeEncrypted(filePath: string, data: string): void {
    try {
      // Создаем директорию если не существует
      const dirPath = resolve(filePath, '..');
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }

      // Генерируем случайную соль и IV
      const salt = randomBytes(32);
      const iv = randomBytes(16);
      
      // Создаем ключ на основе пароля и соли
      const crypto = require('crypto');
      const key = crypto.pbkdf2Sync(this.encryptionKey, salt, 100000, 32, 'sha256');
      
      // Шифруем данные
      const cipher = crypto.createCipher('aes-256-cbc', key);
      cipher.setAutoPadding(true);
      
      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Объединяем соль, IV и зашифрованные данные
      const encryptedData = {
        salt: salt.toString('base64'),
        iv: iv.toString('base64'),
        data: encrypted,
        version: '1.0'
      };
      
      const encryptedJson = JSON.stringify(encryptedData);
      
      // Записываем с безопасными правами доступа (только владелец может читать/писать)
      writeFileSync(filePath, encryptedJson, { 
        encoding: 'utf8', 
        mode: 0o600  // rw-------
      });
      
    } catch (error) {
      console.error('Ошибка записи зашифрованного файла:', error);
      throw new Error('Не удалось записать зашифрованный файл');
    }
  }

  /**
   * Читает и расшифровывает данные из файла
   */
  readEncrypted(filePath: string): string {
    try {
      if (!existsSync(filePath)) {
        return '';  // Возвращаем пустую строку если файл не существует
      }

      const encryptedJson = readFileSync(filePath, { encoding: 'utf8' });
      
      // Пытаемся распарсить как JSON (новый зашифрованный формат)
      let encryptedData;
      try {
        encryptedData = JSON.parse(encryptedJson);
      } catch (parseError) {
        // Если не JSON, возможно это старый незашифрованный файл
        console.warn('⚠️ Файл не в зашифрованном формате, возвращаем как есть');
        return encryptedJson;
      }

      if (!encryptedData.salt || !encryptedData.iv || !encryptedData.data) {
        throw new Error('Неверная структура зашифрованного файла');
      }

      // Восстанавливаем соль и IV
      const salt = Buffer.from(encryptedData.salt, 'base64');
      const iv = Buffer.from(encryptedData.iv, 'base64');
      
      // Создаем ключ на основе пароля и соли
      const crypto = require('crypto');
      const key = crypto.pbkdf2Sync(this.encryptionKey, salt, 100000, 32, 'sha256');
      
      // Расшифровываем данные
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      let decrypted = decipher.update(encryptedData.data, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
      
    } catch (error) {
      console.error('Ошибка чтения зашифрованного файла:', error);
      throw new Error('Не удалось расшифровать файл');
    }
  }

  /**
   * Проверяет, является ли файл зашифрованным
   */
  isEncrypted(filePath: string): boolean {
    try {
      if (!existsSync(filePath)) {
        return false;
      }

      const content = readFileSync(filePath, { encoding: 'utf8' });
      const parsed = JSON.parse(content);
      
      return parsed.salt && parsed.iv && parsed.data && parsed.version;
    } catch (error) {
      return false;  // Если не удается парсить как JSON, то не зашифрован
    }
  }

  /**
   * Мигрирует незашифрованный файл в зашифрованный формат
   */
  migrateToEncrypted(filePath: string): void {
    try {
      if (this.isEncrypted(filePath)) {
        console.log(`✅ Файл ${filePath} уже зашифрован`);
        return;
      }

      console.log(`🔄 Миграция файла ${filePath} в зашифрованный формат...`);
      
      // Читаем незашифрованные данные
      const plainData = readFileSync(filePath, { encoding: 'utf8' });
      
      // Создаем резервную копию
      const backupPath = filePath + '.backup.' + Date.now();
      writeFileSync(backupPath, plainData, { encoding: 'utf8' });
      console.log(`📝 Создана резервная копия: ${backupPath}`);
      
      // Записываем в зашифрованном виде
      this.writeEncrypted(filePath, plainData);
      
      console.log(`✅ Миграция завершена для ${filePath}`);
      
    } catch (error) {
      console.error('Ошибка миграции файла:', error);
      throw error;
    }
  }

  /**
   * Валидация ключа шифрования
   */
  validateEncryptionKey(): boolean {
    if (!this.encryptionKey || this.encryptionKey.length < 16) {
      console.error('❌ Ключ шифрования слишком короткий (минимум 16 символов)');
      return false;
    }
    
    if (this.encryptionKey === 'default-key-change-me-in-production') {
      console.error('❌ Используется стандартный ключ шифрования!');
      return false;
    }
    
    return true;
  }
}

// Экспорт единого экземпляра
export const encryptedStore = new EncryptedFileStore();