import { Injectable } from '@nestjs/common';
import { resolve } from 'path';
import { EncryptedStoreService } from './encrypted-store.service';

export interface SessionData {
  sessionId: string;    // НЕ id!
  code: string | null;
  valid: boolean;
  time: number;        // НЕ createdAt/lastAccessedAt!
}

@Injectable()
export class SessionsFileStoreService {
  private readonly sessionsFilePath = resolve('store', 'sessions.txt');
  
  constructor(private readonly encryptedStore: EncryptedStoreService) {}
  
  /**
   * Читает сессии из зашифрованного файла
   */
  readSessions(): Record<string, SessionData> {
    try {
      const data = this.encryptedStore.readEncrypted(this.sessionsFilePath);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Ошибка чтения файла сессий:', error);
      return {};
    }
  }
  
  /**
   * Записывает сессии в зашифрованный файл
   */
  writeSessions(sessions: Record<string, SessionData>): void {
    try {
      this.encryptedStore.writeEncrypted(
        this.sessionsFilePath, 
        JSON.stringify(sessions, null, 4)
      );
    } catch (error) {
      console.error('Ошибка записи файла сессий:', error);
      throw error;
    }
  }
  
  /**
   * Получает сессию по ID
   */
  getSession(sessionId: string): SessionData | undefined {
    const sessions = this.readSessions();
    return sessions[sessionId];
  }
  
  /**
   * Сохраняет сессию
   */
  saveSession(sessionId: string, session: SessionData): void {
    const sessions = this.readSessions();
    sessions[sessionId] = session;
    this.writeSessions(sessions);
  }
  
  /**
   * Удаляет сессию
   */
  removeSession(sessionId: string): void {
    const sessions = this.readSessions();
    delete sessions[sessionId];
    this.writeSessions(sessions);
  }
  
  /**
   * Удаляет просроченные сессии
   */
  removeExpiredSessions(timeout: number): void {
    const sessions = this.readSessions();
    const now = Date.now();
    let removedCount = 0;
    
    for (const [sessionId, session] of Object.entries(sessions)) {
      if (now - session.time > timeout) {
        delete sessions[sessionId];
        removedCount++;
        console.log(`🗑️ Удалена просроченная сессия: ${sessionId}`);
      }
    }
    
    if (removedCount > 0) {
      this.writeSessions(sessions);
      console.log(`🧹 Удалено ${removedCount} просроченных сессий`);
    }
  }
  
  /**
   * Получает все активные сессии
   */
  getAllSessions(): Record<string, SessionData> {
    return this.readSessions();
  }
}