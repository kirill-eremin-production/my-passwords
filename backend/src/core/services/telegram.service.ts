import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  constructor(private readonly configService: ConfigService) {}

  async sendFile(fileData: string): Promise<any> {
    const telegramBotSecret = this.configService.get('TELEGRAM_BOT_SECRET');
    const telegramUserId = this.configService.get('TELEGRAM_USER_ID');

    if (!telegramBotSecret || !telegramUserId) {
      throw new Error('Telegram credentials not configured');
    }

    const data = new FormData();
    data.append('chat_id', telegramUserId);
    data.append('document', new Blob([fileData]), 'backup');

    const result = await fetch(
      `https://api.telegram.org/bot${telegramBotSecret}/sendDocument`,
      {
        method: 'POST',
        body: data,
      }
    );

    return result;
  }

  async sendMessage(text: string): Promise<any> {
    const telegramBotSecret = this.configService.get('TELEGRAM_BOT_SECRET');
    const telegramUserId = this.configService.get('TELEGRAM_USER_ID');

    if (!telegramBotSecret || !telegramUserId) {
      throw new Error('Telegram credentials not configured');
    }

    const result = await fetch(
      `https://api.telegram.org/bot${telegramBotSecret}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramUserId,
          parse_mode: 'Markdown',
          text,
        }),
      }
    );

    return result;
  }
}