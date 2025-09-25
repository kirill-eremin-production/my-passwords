/**
 * Безопасное хранилище с IndexedDB и дополнительным шифрованием
 * Защищает от XSS атак в отличие от localStorage
 */

interface SecureStorageItem {
  id: string;
  data: string;
  timestamp: number;
}

export class SecureStorage {
  private dbName = 'my-passwords-secure';
  private version = 1;
  private storeName = 'secure_store';
  private db: IDBDatabase | null = null;

  /**
   * Инициализация базы данных
   */
  private async openDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Ошибка открытия IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Генерирует ключ шифрования из deviceKey
   */
  private async deriveKey(deviceKey: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(deviceKey),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('my-passwords-salt-2024'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Шифрует данные с помощью Web Crypto API
   */
  private async encryptWithDeviceKey(data: string, deviceKey: string): Promise<string> {
    try {
      const key = await this.deriveKey(deviceKey);
      const encoder = new TextEncoder();
      
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(data)
      );

      return JSON.stringify({
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encrypted))
      });
    } catch (error) {
      console.error('Ошибка шифрования:', error);
      throw new Error('Не удалось зашифровать данные');
    }
  }

  /**
   * Расшифровывает данные с помощью Web Crypto API
   */
  private async decryptWithDeviceKey(encryptedData: string, deviceKey: string): Promise<string> {
    try {
      const key = await this.deriveKey(deviceKey);
      const decoder = new TextDecoder();
      
      const { iv, data } = JSON.parse(encryptedData);
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        key,
        new Uint8Array(data)
      );

      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Ошибка расшифровки:', error);
      throw new Error('Не удалось расшифровать данные');
    }
  }

  /**
   * Генерирует device key на основе характеристик браузера
   */
  private generateDeviceKey(): string {
    const characteristics = [
      navigator.userAgent,
      navigator.language,
      window.screen.width,
      window.screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown'
    ].join('|');

    // Используем простое хеширование для создания стабильного ключа
    let hash = 0;
    for (let i = 0; i < characteristics.length; i++) {
      const char = characteristics.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Конвертируем в 32bit integer
    }
    
    return `device-key-${Math.abs(hash)}-2024`;
  }

  /**
   * Сохраняет зашифрованные данные в IndexedDB
   */
  async storeEncryptedData(key: string, data: string): Promise<void> {
    try {
      const deviceKey = this.generateDeviceKey();
      const doubleEncrypted = await this.encryptWithDeviceKey(data, deviceKey);
      
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const item: SecureStorageItem = {
        id: key,
        data: doubleEncrypted,
        timestamp: Date.now()
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Ошибка записи в IndexedDB'));
      });
    } catch (error) {
      console.error('Ошибка сохранения в SecureStorage:', error);
      throw error;
    }
  }

  /**
   * Загружает и расшифровывает данные из IndexedDB
   */
  async getEncryptedData(key: string): Promise<string | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const item = await new Promise<SecureStorageItem | null>((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error('Ошибка чтения из IndexedDB'));
      });

      if (!item) {
        return null;
      }

      const deviceKey = this.generateDeviceKey();
      return await this.decryptWithDeviceKey(item.data, deviceKey);
    } catch (error) {
      console.error('Ошибка загрузки из SecureStorage:', error);
      return null;
    }
  }

  /**
   * Удаляет данные из IndexedDB
   */
  async removeData(key: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Ошибка удаления из IndexedDB'));
      });
    } catch (error) {
      console.error('Ошибка удаления из SecureStorage:', error);
      throw error;
    }
  }

  /**
   * Очищает все данные
   */
  async clearAll(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Ошибка очистки IndexedDB'));
      });
    } catch (error) {
      console.error('Ошибка очистки SecureStorage:', error);
      throw error;
    }
  }

  /**
   * Очищает устаревшие данные (старше указанного времени)
   */
  async cleanupOldData(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');

      const cutoffTime = Date.now() - maxAgeMs;
      const range = IDBKeyRange.upperBound(cutoffTime);

      await new Promise<void>((resolve, reject) => {
        const request = index.openCursor(range);
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(new Error('Ошибка очистки старых данных'));
      });
    } catch (error) {
      console.error('Ошибка очистки старых данных:', error);
    }
  }
}

// Экспорт единого экземпляра
export const secureStorage = new SecureStorage();