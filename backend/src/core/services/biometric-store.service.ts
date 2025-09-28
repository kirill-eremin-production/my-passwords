import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { BiometricCredential, WebAuthnChallenge } from '../../types/biometric';
import { BiometricFileStoreService, BiometricCredentialStore, ChallengeData } from './biometric-file-store.service';

@Injectable()
export class BiometricStoreService {
  private readonly CHALLENGE_TIMEOUT = 5 * 60 * 1000; // 5 минут

  constructor(private readonly fileStore: BiometricFileStoreService) {}

  /**
   * Создает новый challenge для биометрической аутентификации
   */
  createChallenge(): string {
    const challenge = randomBytes(32).toString('base64url');
    const challengeData: ChallengeData = {
      challenge,
      createdAt: Date.now(),
    };
    
    this.fileStore.saveChallenge(challenge, challengeData);
    
    // Удаляем старые challenges
    this.cleanupExpiredChallenges();
    
    return challenge;
  }

  /**
   * Проверяет валидность challenge
   */
  isValidChallenge(challenge: string): boolean {
    const challengeData = this.fileStore.getChallenge(challenge);
    if (!challengeData) {
      return false;
    }

    const now = Date.now();
    if (now - challengeData.createdAt > this.CHALLENGE_TIMEOUT) {
      this.fileStore.removeChallenge(challenge);
      return false;
    }

    return true;
  }

  /**
   * Использует challenge (удаляет после использования)
   */
  useChallenge(challenge: string): boolean {
    if (this.isValidChallenge(challenge)) {
      this.fileStore.removeChallenge(challenge);
      return true;
    }
    return false;
  }

  /**
   * Сохраняет биометрические данные
   */
  saveCredential(credentialId: string, credential: Omit<BiometricCredentialStore, 'id' | 'createdAt'>): void {
    this.fileStore.saveCredential(credentialId, credential);
  }

  /**
   * Получает биометрические данные
   */
  getCredential(credentialId: string): BiometricCredentialStore | undefined {
    return this.fileStore.getCredential(credentialId);
  }

  /**
   * Получает все сохраненные credentials
   */
  getAllCredentials(): BiometricCredentialStore[] {
    return this.fileStore.getAllCredentials();
  }

  /**
   * Обновляет счетчик для credential
   */
  updateCredentialCounter(credentialId: string, newCounter: number): boolean {
    return this.fileStore.updateCredentialCounter(credentialId, newCounter);
  }

  /**
   * Удаляет credential
   */
  removeCredential(credentialId: string): boolean {
    return this.fileStore.removeCredential(credentialId);
  }

  /**
   * Очищает просроченные challenges
   */
  private cleanupExpiredChallenges(): void {
    this.fileStore.removeExpiredChallenges(this.CHALLENGE_TIMEOUT);
  }

  /**
   * Сохраняет challenge привязанный к sessionId (для WebAuthn)
   */
  storeChallenge(challengeData: WebAuthnChallenge): void {
    this.fileStore.saveSessionChallenge(challengeData.sessionId, challengeData);
    
    // Удаляем старые challenges
    this.cleanupExpiredSessionChallenges();
  }

  /**
   * Получает challenge по sessionId
   */
  getChallengeBySessionId(sessionId: string): WebAuthnChallenge | undefined {
    const challengeData = this.fileStore.getSessionChallenge(sessionId);
    if (!challengeData) {
      return undefined;
    }

    const now = Date.now();
    if (now - challengeData.createdAt > this.CHALLENGE_TIMEOUT) {
      this.fileStore.removeSessionChallenge(sessionId);
      return undefined;
    }

    return challengeData;
  }

  /**
   * Удаляет challenge по sessionId
   */
  removeChallenge(sessionId: string): boolean {
    return this.fileStore.removeSessionChallenge(sessionId);
  }

  /**
   * Сохраняет биометрические учетные данные (совместимость со старой архитектурой)
   */
  storeBiometricCredential(credential: BiometricCredential): void {
    const storeCredential: Omit<BiometricCredentialStore, 'id' | 'createdAt'> = {
      publicKey: credential.publicKey,
      counter: credential.counter,
      credentialDeviceType: undefined,
      credentialBackedUp: undefined,
      transports: undefined,
      sessionId: credential.sessionId,
      userAgent: credential.userAgent,
    };
    
    this.fileStore.saveCredential(credential.id, storeCredential);
    console.log(`✅ Сохранены биометрические данные для credential: ${credential.id}`);
  }

  /**
   * Получает биометрические учетные данные по ID (совместимость)
   */
  getBiometricCredentialById(credentialId: string): BiometricCredential | undefined {
    const storeCredential = this.fileStore.getCredential(credentialId);
    if (!storeCredential || !storeCredential.sessionId) {
      return undefined;
    }
    
    // Преобразуем обратно в оригинальный формат
    return {
      id: storeCredential.id,
      publicKey: storeCredential.publicKey,
      counter: storeCredential.counter,
      createdAt: new Date(storeCredential.createdAt).toISOString(),
      sessionId: storeCredential.sessionId,
      userAgent: storeCredential.userAgent,
    };
  }

  /**
   * Обновляет счетчик для credential (совместимость)
   */
  updateBiometricCredentialCounter(credentialId: string, newCounter: number): boolean {
    return this.fileStore.updateCredentialCounter(credentialId, newCounter);
  }

  /**
   * Очищает просроченные session challenges
   */
  private cleanupExpiredSessionChallenges(): void {
    this.fileStore.removeExpiredSessionChallenges(this.CHALLENGE_TIMEOUT);
  }

  /**
   * Подготавливает биометрическое хранилище
   */
  prepareBiometricStore(): void {
    console.log('🔐 Биометрическое хранилище инициализировано');
    
    // Периодическая очистка просроченных challenges
    setInterval(() => {
      this.cleanupExpiredChallenges();
      this.cleanupExpiredSessionChallenges();
    }, 60 * 1000); // каждую минуту
  }
}

// Экспорт функции для совместимости
let biometricStoreInstance: BiometricStoreService;

export function prepareBiometricStore() {
  // Эта функция теперь пустая, инициализация через DI
  console.log('🔄 Biometric store подготовлен через dependency injection');
}

export function getBiometricStore(): BiometricStoreService {
  return biometricStoreInstance;
}

export function setBiometricStoreInstance(instance: BiometricStoreService) {
  biometricStoreInstance = instance;
}