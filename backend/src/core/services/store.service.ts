import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { EncryptedStoreService } from './encrypted-store.service';

@Injectable()
export class StoreService {
  private readonly storeDirPath = resolve('.', 'store');
  public readonly passwordsFilePath = resolve(this.storeDirPath, 'my-passwords.txt');

  constructor(private readonly encryptedStore: EncryptedStoreService) {}

  /**
   * При необходимости создает директорию и инициализирует зашифрованное хранилище
   */
  prepareStore() {
    this.prepareAppDir();

    // Валидация ключа шифрования
    if (!this.encryptedStore.validateEncryptionKey()) {
      throw new Error(
        'Невалидный ключ шифрования! Установите FILE_ENCRYPTION_KEY в .env'
      );
    }

    // Миграция существующего файла в зашифрованный формат (если нужно)
    if (existsSync(this.passwordsFilePath)) {
      try {
        this.encryptedStore.migrateToEncrypted(this.passwordsFilePath);
      } catch (error) {
        console.error('⚠️ Ошибка миграции файла паролей:', error);
      }
    }
  }

  private prepareAppDir() {
    const isAppDirExists = existsSync(this.storeDirPath);

    if (!isAppDirExists) {
      mkdirSync(this.storeDirPath, { recursive: true });
    }
  }

  /**
   * Читает и расшифровывает данные из хранилища
   */
  readStore(): string {
    try {
      return this.encryptedStore.readEncrypted(this.passwordsFilePath);
    } catch (error) {
      console.error('Ошибка чтения зашифрованного хранилища:', error);
      return ''; // Возвращаем пустую строку при ошибке
    }
  }

  /**
   * Шифрует и записывает данные в хранилище
   */
  writeStore(data: string) {
    try {
      this.encryptedStore.writeEncrypted(this.passwordsFilePath, data);
      console.log('✅ Данные успешно записаны в зашифрованное хранилище');
    } catch (error) {
      console.error('❌ Ошибка записи в зашифрованное хранилище:', error);
      throw error;
    }
  }
}

// Экспорт функции для совместимости
export function prepareStore() {
  console.log('⚠️ DEPRECATED: Используйте StoreService.prepareStore() через dependency injection');
  // Создаем временный экземпляр для обратной совместимости
  const tempEncryptedStore = new (require('./encrypted-store.service').EncryptedStoreService)();
  const tempStoreService = new StoreService(tempEncryptedStore);
  tempStoreService.prepareStore();
}