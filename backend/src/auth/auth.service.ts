import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { SessionsStoreService } from '../core/services/sessions-store.service';

export interface SessionData {
  sessionId: string;
  code: string | null;
  valid: boolean;
  time: number;
}

@Injectable()
export class AuthService {
  constructor(private readonly sessionsStore: SessionsStoreService) {}

  /**
   * Получает сессию по sessionId из cookie
   */
  getSessionFromCookie(sessionId?: string): SessionData | undefined {
    if (!sessionId) {
      return undefined;
    }

    const session = this.sessionsStore.getSession(sessionId);
    if (!session) {
      return undefined;
    }

    // Преобразуем внутренний формат в формат для совместимости
    return {
      sessionId: session.id,
      code: this.sessionsStore.getSessionCode(sessionId) || null, // Получаем реальный код из сессии
      valid: session.valid,
      time: session.createdAt,
    };
  }

  /**
   * Создает новую сессию
   */
  createNewSession(): string {
    return this.sessionsStore.createSession();
  }

  /**
   * Валидирует сессию с помощью кода подтверждения
   */
  validateSessionWithCode(sessionId: string, code: string): boolean {
    return this.sessionsStore.validateSessionCode(sessionId, String(code));
  }

  /**
   * Генерирует криптографически стойкий уникальный sessionId
   */
  generateSessionId(): string {
    // Криптографически стойкий генератор (32 байта = 256 бит)
    const randomId = randomBytes(32).toString('hex');
    const timestamp = Date.now().toString(36); // Компактное представление времени

    // Формат: timestamp-randomId для удобства отладки и сортировки
    return `${timestamp}-${randomId}`;
  }

  /**
   * Проверяет валидность сессии
   */
  isSessionValid(sessionId: string): boolean {
    const session = this.sessionsStore.getSession(sessionId);
    return session ? session.valid : false;
  }

  /**
   * Удаляет сессию
   */
  removeSession(sessionId: string): void {
    this.sessionsStore.removeSession(sessionId);
  }
}