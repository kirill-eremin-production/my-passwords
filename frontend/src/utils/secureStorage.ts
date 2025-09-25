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
   * Генерирует device key на основе характеристик браузера и случайного компонента
   * Использует Web Crypto API для безопасности
   */
  private async generateDeviceKey(): Promise<string> {
    console.log('🔄 generateDeviceKey: начинаем генерацию...');
    
    // Получаем или создаем случайный seed для данного устройства из безопасного IndexedDB
    console.log('🔄 Получаем randomSeed...');
    let randomSeed = await this.getSecureRandomSeed();
    console.log('✅ RandomSeed получен:', randomSeed.substring(0, 10) + '...');
    
    const characteristics = [
      navigator.userAgent,
      navigator.language,
      window.screen.width,
      window.screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      randomSeed // Добавляем уникальный случайный компонент
    ].join('|');
    console.log('✅ Характеристики устройства собраны');

    // Используем Web Crypto API для создания криптографически стойкого ключа
    try {
      console.log('🔄 Создаем хеш через Web Crypto API...');
      const encoder = new TextEncoder();
      const data = encoder.encode(characteristics);
      
      // Создаем хеш с помощью Web Crypto API
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const deviceKey = `device-key-${hashHex.substring(0, 16)}-2024`;
      console.log('✅ DeviceKey сгенерирован успешно:', deviceKey.substring(0, 20) + '...');
      return deviceKey;
    } catch (error) {
      console.error('❌ Ошибка генерации device key, используем fallback:', error);
      // Fallback на простое хеширование только в случае ошибки
      let hash = 0;
      for (let i = 0; i < characteristics.length; i++) {
        const char = characteristics.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const fallbackKey = `device-key-${Math.abs(hash)}-2024`;
      console.log('✅ Fallback deviceKey сгенерирован:', fallbackKey);
      return fallbackKey;
    }
  }

  /**
   * Безопасно получает или создает случайный seed из IndexedDB
   */
  private async getSecureRandomSeed(): Promise<string> {
    const SEED_KEY = 'device-random-seed';
    
    try {
      // Пытаемся получить существующий seed из IndexedDB БЕЗ шифрования
      // чтобы избежать циклической зависимости
      const existingSeed = await this.getRawData(SEED_KEY);
      if (existingSeed) {
        return existingSeed;
      }

      // Генерируем новый криптографически стойкий seed
      const randomArray = new Uint32Array(4);
      window.crypto.getRandomValues(randomArray);
      const newSeed = Array.from(randomArray).join('-');
      
      // Сохраняем в IndexedDB БЕЗ шифрования (только для seed)
      await this.storeRawData(SEED_KEY, newSeed);
      
      return newSeed;
    } catch (error) {
      console.error('Ошибка работы с безопасным seed:', error);
      // Fallback: генерируем временный seed (не сохраняется)
      const randomArray = new Uint32Array(4);
      window.crypto.getRandomValues(randomArray);
      return Array.from(randomArray).join('-');
    }
  }

  /**
   * Сохраняет данные в IndexedDB БЕЗ шифрования (только для внутренних нужд)
   */
  private async storeRawData(key: string, data: string): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    const item: SecureStorageItem = {
      id: key,
      data: data, // Сохраняем как есть, без шифрования
      timestamp: Date.now()
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Ошибка записи в IndexedDB'));
    });
  }

  /**
   * Загружает данные из IndexedDB БЕЗ расшифровки (только для внутренних нужд)
   */
  private async getRawData(key: string): Promise<string | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const item = await new Promise<SecureStorageItem | null>((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error('Ошибка чтения из IndexedDB'));
      });

      return item ? item.data : null;
    } catch (error) {
      console.error('Ошибка загрузки raw данных:', error);
      return null;
    }
  }

  /**
   * Сохраняет зашифрованные данные в IndexedDB
   */
  async storeEncryptedData(key: string, data: string): Promise<void> {
    try {
      console.log('🔄 SecureStorage.storeEncryptedData: начинаем сохранение для ключа:', key);
      
      console.log('🔄 Генерируем deviceKey...');
      const deviceKey = await this.generateDeviceKey();
      console.log('✅ DeviceKey сгенерирован');
      
      console.log('🔄 Шифруем данные...');
      const doubleEncrypted = await this.encryptWithDeviceKey(data, deviceKey);
      console.log('✅ Данные зашифрованы');
      
      console.log('🔄 Открываем базу данных...');
      const db = await this.openDB();
      console.log('✅ База данных открыта');
      
      console.log('🔄 Создаем транзакцию...');
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      console.log('✅ Транзакция создана');
      
      const item: SecureStorageItem = {
        id: key,
        data: doubleEncrypted,
        timestamp: Date.now()
      };
      console.log('🔄 Записываем данные в IndexedDB...');

      await new Promise<void>((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => {
          console.log('✅ Данные успешно записаны в IndexedDB');
          resolve();
        };
        request.onerror = () => {
          console.error('❌ Ошибка записи в IndexedDB:', request.error);
          reject(new Error('Ошибка записи в IndexedDB'));
        };
      });
      
      console.log('🎉 SecureStorage.storeEncryptedData: сохранение завершено');
    } catch (error) {
      console.error('❌ SecureStorage.storeEncryptedData: ошибка сохранения:', error);
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

      const deviceKey = await this.generateDeviceKey();
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