import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

/**
 * Интерфейс для зашифрованных данных
 */
interface EncryptedData {
  salt: string;
  iv: string;
  data: string;
  version: string;
  algorithm?: string;
  iterations?: number;
  timestamp?: number;
}

/**
 * Зашифрованное файловое хранилище с AES-256-CBC
 * Защищает данные на диске от несанкционированного доступа
 */
export class EncryptedFileStore {
  private encryptionKey: string;
  private readonly CURRENT_VERSION = '3.0';
  private readonly CURRENT_ALGORITHM = 'aes-256-cbc';
  private readonly CURRENT_ITERATIONS = 100000;
  
  constructor() {
    // Получение ключа шифрования из переменных окружения
    this.encryptionKey = process.env.FILE_ENCRYPTION_KEY || 'default-key-change-me-in-production';
    
    if (this.encryptionKey === 'default-key-change-me-in-production') {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('🚨 КРИТИЧЕСКАЯ ОШИБКА: Стандартный ключ шифрования в production! Установите FILE_ENCRYPTION_KEY');
      } else {
        console.warn('⚠️ ПРЕДУПРЕЖДЕНИЕ: Используется стандартный ключ шифрования! Установите FILE_ENCRYPTION_KEY в .env');
      }
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
      
      // Шифруем данные с явным IV
      const cipher = createCipheriv('aes-256-cbc', key, iv as any);
      cipher.setAutoPadding(true);
      
      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Объединяем соль, IV и зашифрованные данные с полными метаданными
      const encryptedData: EncryptedData = {
        salt: salt.toString('base64'),
        iv: iv.toString('base64'),
        data: encrypted,
        version: this.CURRENT_VERSION,
        algorithm: this.CURRENT_ALGORITHM,
        iterations: this.CURRENT_ITERATIONS,
        timestamp: Date.now()
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
      
      // Пытаемся распарсить как JSON (зашифрованный формат)
      let encryptedData: EncryptedData;
      try {
        encryptedData = JSON.parse(encryptedJson) as EncryptedData;
      } catch (parseError) {
        // Если не JSON, возможно это старый незашифрованный файл
        console.warn('⚠️ Файл не в зашифрованном формате, создаем новый зашифрованный файл с пустыми данными');
        
        // Создаем резервную копию старого файла
        const backupPath = filePath + '.backup.' + Date.now();
        writeFileSync(backupPath, encryptedJson, { encoding: 'utf8' });
        console.log(`📝 Создана резервная копия старого файла: ${backupPath}`);
        
        // Создаем новый зашифрованный файл с пустой строкой
        // Фронтенд сам обработает пустые данные и инициализирует их
        const emptyData = '';
        this.writeEncrypted(filePath, emptyData);
        
        console.log(`✅ Создан новый зашифрованный файл: ${filePath}`);
        return emptyData;
      }

      if (!encryptedData.salt || !encryptedData.iv || !encryptedData.data) {
        throw new Error('Неверная структура зашифрованного файла');
      }

      // Проверяем версию и выполняем соответствующую расшифровку
      return this.decryptByVersion(encryptedData);
      
    } catch (error) {
      console.error('Ошибка чтения зашифрованного файла:', error);
      throw new Error('Не удалось расшифровать файл');
    }
  }

  /**
   * Расшифровывает данные в зависимости от версии
   */
  private decryptByVersion(encryptedData: EncryptedData): string {
    const version = encryptedData.version || '1.0';
    
    // Восстанавливаем соль и IV
    const salt = Buffer.from(encryptedData.salt, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    
    // Определяем параметры в зависимости от версии
    const iterations = encryptedData.iterations || (version === '1.0' ? 10000 : this.CURRENT_ITERATIONS);
    const algorithm = encryptedData.algorithm || this.CURRENT_ALGORITHM;
    
    // Создаем ключ на основе пароля и соли
    const crypto = require('crypto');
    const key = crypto.pbkdf2Sync(this.encryptionKey, salt, iterations, 32, 'sha256');
    
    // Расшифровываем данные
    const decipher = createDecipheriv(algorithm, key, iv as any);
    let decrypted = decipher.update(encryptedData.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Логируем информацию о версии для отладки
    if (version !== this.CURRENT_VERSION) {
      console.log(`📄 Расшифровка файла версии ${version} (текущая: ${this.CURRENT_VERSION})`);
    }
    
    return decrypted;
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
      const parsed = JSON.parse(content) as EncryptedData;
      
      return !!(parsed.salt && parsed.iv && parsed.data && parsed.version);
    } catch (error) {
      return false;  // Если не удается парсить как JSON, то не зашифрован
    }
  }

  /**
   * Получает информацию о версии зашифрованного файла
   */
  getFileVersion(filePath: string): string | null {
    try {
      if (!existsSync(filePath)) {
        return null;
      }

      const content = readFileSync(filePath, { encoding: 'utf8' });
      const parsed = JSON.parse(content) as EncryptedData;
      
      return parsed.version || '1.0';
    } catch (error) {
      return null;
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

      const currentVersion = this.getFileVersion(filePath);
      
      if (currentVersion && currentVersion !== this.CURRENT_VERSION) {
        console.log(`🔄 Обновление файла ${filePath} с версии ${currentVersion} до ${this.CURRENT_VERSION}...`);
        
        // Читаем данные в старом формате
        const decryptedData = this.readEncrypted(filePath);
        
        // Создаем резервную копию старой версии
        const backupPath = filePath + `.backup.v${currentVersion}.` + Date.now();
        const oldContent = readFileSync(filePath, { encoding: 'utf8' });
        writeFileSync(backupPath, oldContent, { encoding: 'utf8' });
        console.log(`📝 Создана резервная копия старой версии: ${backupPath}`);
        
        // Перезаписываем в новом формате
        this.writeEncrypted(filePath, decryptedData);
        
        console.log(`✅ Обновление версии завершено для ${filePath}`);
      } else {
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
      }
      
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
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Ключ шифрования слишком короткий (минимум 16 символов)');
      }
      return false;
    }
    
    if (this.encryptionKey === 'default-key-change-me-in-production') {
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Используется стандартный ключ шифрования!');
      }
      return false;
    }
    
    return true;
  }
}

// Экспорт единого экземпляра
export const encryptedStore = new EncryptedFileStore();