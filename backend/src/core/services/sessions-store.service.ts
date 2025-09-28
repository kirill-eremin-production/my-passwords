import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { SessionsFileStoreService, SessionData } from './sessions-file-store.service';

// Интерфейс для совместимости со старым API
interface Session {
  id: string;
  valid: boolean;
  createdAt: number;
  lastAccessedAt: number;
  code?: string | null;
}

@Injectable()
export class SessionsStoreService {
  private readonly SESSION_TIMEOUT = 60 * 60 * 1000; // 1 час (исправлено с 24)

  constructor(private readonly fileStore: SessionsFileStoreService) {}

  /**
   * Создает новую сессию с правильным форматом
   */
  createSession(): string {
    const randomId = randomBytes(32).toString('hex');
    const timestamp = Date.now().toString(36);
    const sessionId = `${timestamp}-${randomId}`; // Восстановить формат!
    
    const sessionData: SessionData = {
      sessionId,
      code: null,
      valid: false,
      time: Date.now(),
    };
    
    this.fileStore.saveSession(sessionId, sessionData);
    return sessionId;
  }

  /**
   * Валидирует сессию
   */
  validateSession(sessionId: string): void {
    const sessionData = this.fileStore.getSession(sessionId);
    if (sessionData) {
      sessionData.valid = true;
      sessionData.time = Date.now();
      this.fileStore.saveSession(sessionId, sessionData);
    }
  }

  /**
   * Получает сессию по ID (возвращает в старом формате для совместимости)
   */
  getSession(sessionId: string): Session | undefined {
    const sessionData = this.fileStore.getSession(sessionId);
    if (!sessionData) {
      return undefined;
    }
    
    // Преобразуем в старый формат для совместимости
    return {
      id: sessionData.sessionId,
      valid: sessionData.valid,
      createdAt: sessionData.time,
      lastAccessedAt: sessionData.time,
      code: sessionData.code,
    };
  }

  /**
   * Удаляет сессию
   */
  removeSession(sessionId: string): void {
    this.fileStore.removeSession(sessionId);
  }

  /**
   * Удаляет все просроченные сессии
   */
  removeExpiredSessions(): void {
    this.fileStore.removeExpiredSessions(this.SESSION_TIMEOUT);
  }

  /**
   * Обновляет код подтверждения для сессии
   */
  updateSessionCode(sessionId: string, code: string): void {
    const sessionData = this.fileStore.getSession(sessionId);
    if (sessionData) {
      sessionData.code = code;
      sessionData.time = Date.now();
      this.fileStore.saveSession(sessionId, sessionData);
    }
  }

  /**
   * Получает код подтверждения для сессии
   */
  getSessionCode(sessionId: string): string | null | undefined {
    const sessionData = this.fileStore.getSession(sessionId);
    return sessionData?.code;
  }

  /**
   * Валидирует код подтверждения для сессии
   */
  validateSessionCode(sessionId: string, inputCode: string): boolean {
    const sessionData = this.fileStore.getSession(sessionId);
    if (sessionData && sessionData.code === inputCode) {
      sessionData.valid = true;
      sessionData.code = null; // Очищаем код после успешной валидации
      sessionData.time = Date.now();
      this.fileStore.saveSession(sessionId, sessionData);
      return true;
    }
    return false;
  }

  /**
   * Получает все активные сессии (для отладки)
   */
  getActiveSessions(): Session[] {
    const sessions = this.fileStore.getAllSessions();
    return Object.values(sessions).map(sessionData => ({
      id: sessionData.sessionId,
      valid: sessionData.valid,
      createdAt: sessionData.time,
      lastAccessedAt: sessionData.time,
      code: sessionData.code,
    }));
  }
}

// Экспорт функций для совместимости
let sessionsStoreInstance: SessionsStoreService;

export function prepareSessionsStore() {
  // Эта функция теперь пустая, инициализация через DI
  console.log('🔄 Sessions store подготовлен через dependency injection');
}

export function removeExpiredSessionsFromSessionStore() {
  if (sessionsStoreInstance) {
    sessionsStoreInstance.removeExpiredSessions();
  }
}

export function getSessionsStore(): SessionsStoreService {
  return sessionsStoreInstance;
}

export function setSessionsStoreInstance(instance: SessionsStoreService) {
  sessionsStoreInstance = instance;
}