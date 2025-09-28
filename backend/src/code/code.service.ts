import { Injectable } from '@nestjs/common';
import { SessionsStoreService } from '../core/services/sessions-store.service';
import { TelegramService } from '../core/services/telegram.service';

@Injectable()
export class CodeService {
  constructor(
    private readonly sessionsStore: SessionsStoreService,
    private readonly telegramService: TelegramService
  ) {}

  /**
   * Генерирует 6-значный код подтверждения
   */
  generateConfirmationCode(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  /**
   * Генерирует и отправляет код подтверждения в Telegram
   */
  async generateAndSendCode(sessionId: string, userAgent?: string): Promise<string> {
    const session = this.sessionsStore.getSession(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    const code = String(this.generateConfirmationCode());

    // Сохраняем код в сессию, как в оригинальной архитектуре
    this.sessionsStore.updateSessionCode(sessionId, code);
    
    const message = `Ваш код для входа в my-passwords: ***${code}***\n\n\`${userAgent || 'Unknown User Agent'}\``;
    
    try {
      await this.telegramService.sendMessage(message);
      console.log(`✅ Код ${code} отправлен в Telegram для сессии ${sessionId}`);
    } catch (error) {
      console.error('⚠️ Ошибка отправки кода в Telegram:', error);
      // НЕ выбрасываем исключение - код уже сохранен в сессию
      // Пользователь может получить код другими способами
    }

    return code;
  }

  /**
   * Проверяет код подтверждения
   * Примечание: В оригинальной архитектуре проверка кода была в AuthService
   * Здесь добавляем для полноты
   */
  validateCode(sessionId: string, inputCode: string, expectedCode: string): boolean {
    return inputCode === expectedCode;
  }
}