import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StoreService } from '../core/services/store.service';
import { TelegramService } from '../core/services/telegram.service';

@Injectable()
export class PasswordsService {
  constructor(
    private readonly storeService: StoreService,
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Получает все пароли из хранилища
   */
  getPasswords(): string {
    return this.storeService.readStore();
  }

  /**
   * Сохраняет пароли в хранилище и отправляет backup в Telegram (если настроено)
   */
  async savePasswords(requestData: any): Promise<void> {
    const data = JSON.stringify(requestData, null, 4);

    // Сохраняем данные локально
    this.storeService.writeStore(data);

    // БЕЗОПАСНОСТЬ: Отправка в Telegram только в dev режиме и при явном разрешении
    const isTelegramEnabled = this.configService.get('ENABLE_TELEGRAM_BACKUP') === 'true';
    const isDevelopment = this.configService.get('NODE_ENV') !== 'production';

    if (isTelegramEnabled && isDevelopment) {
      console.log('📱 Отправка backup в Telegram (dev режим)');
      try {
        await this.telegramService.sendFile(data);
      } catch (error) {
        console.error('⚠️ Ошибка отправки в Telegram:', error);
        // Не прерываем выполнение - backup опциональный
      }
    } else {
      if (!isDevelopment) {
        console.log('🔒 Telegram backup отключен в production для безопасности');
      } else {
        console.log('🔒 Telegram backup отключен (ENABLE_TELEGRAM_BACKUP=false)');
      }
    }
  }
}