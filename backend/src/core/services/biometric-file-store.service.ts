import { Injectable } from '@nestjs/common';
import { resolve } from 'path';
import { EncryptedStoreService } from './encrypted-store.service';
import { BiometricCredential, WebAuthnChallenge } from '../../types/biometric';

export interface BiometricCredentialStore {
  id: string;
  publicKey: string;
  counter: number;
  credentialDeviceType?: string;
  credentialBackedUp?: boolean;
  transports?: string[];
  createdAt: number;
  sessionId?: string;
  userAgent?: string;
}

export interface ChallengeData {
  challenge: string;
  createdAt: number;
}

@Injectable()
export class BiometricFileStoreService {
  private readonly biometricFilePath = resolve('store', 'biometric.txt');
  private readonly challengesFilePath = resolve('store', 'challenges.txt');
  private readonly sessionChallengesFilePath = resolve('store', 'session-challenges.txt');
  
  constructor(private readonly encryptedStore: EncryptedStoreService) {}
  
  /**
   * Читает биометрические учетные данные из файла
   */
  readCredentials(): Record<string, BiometricCredentialStore> {
    try {
      const data = this.encryptedStore.readEncrypted(this.biometricFilePath);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Ошибка чтения файла биометрических данных:', error);
      return {};
    }
  }
  
  /**
   * Записывает биометрические учетные данные в файл
   */
  writeCredentials(credentials: Record<string, BiometricCredentialStore>): void {
    try {
      this.encryptedStore.writeEncrypted(
        this.biometricFilePath, 
        JSON.stringify(credentials, null, 4)
      );
    } catch (error) {
      console.error('Ошибка записи файла биометрических данных:', error);
      throw error;
    }
  }
  
  /**
   * Читает challenges из файла
   */
  readChallenges(): Record<string, ChallengeData> {
    try {
      const data = this.encryptedStore.readEncrypted(this.challengesFilePath);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Ошибка чтения файла challenges:', error);
      return {};
    }
  }
  
  /**
   * Записывает challenges в файл
   */
  writeChallenges(challenges: Record<string, ChallengeData>): void {
    try {
      this.encryptedStore.writeEncrypted(
        this.challengesFilePath, 
        JSON.stringify(challenges, null, 4)
      );
    } catch (error) {
      console.error('Ошибка записи файла challenges:', error);
      throw error;
    }
  }
  
  /**
   * Читает session challenges из файла
   */
  readSessionChallenges(): Record<string, WebAuthnChallenge> {
    try {
      const data = this.encryptedStore.readEncrypted(this.sessionChallengesFilePath);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Ошибка чтения файла session challenges:', error);
      return {};
    }
  }
  
  /**
   * Записывает session challenges в файл
   */
  writeSessionChallenges(challenges: Record<string, WebAuthnChallenge>): void {
    try {
      this.encryptedStore.writeEncrypted(
        this.sessionChallengesFilePath, 
        JSON.stringify(challenges, null, 4)
      );
    } catch (error) {
      console.error('Ошибка записи файла session challenges:', error);
      throw error;
    }
  }
  
  /**
   * Сохраняет биометрические учетные данные
   */
  saveCredential(credentialId: string, credential: Omit<BiometricCredentialStore, 'id' | 'createdAt'>): void {
    const credentials = this.readCredentials();
    const biometricCredential: BiometricCredentialStore = {
      id: credentialId,
      ...credential,
      createdAt: Date.now(),
    };
    
    credentials[credentialId] = biometricCredential;
    this.writeCredentials(credentials);
    console.log(`✅ Сохранены биометрические данные для credential: ${credentialId}`);
  }
  
  /**
   * Получает биометрические данные по ID
   */
  getCredential(credentialId: string): BiometricCredentialStore | undefined {
    const credentials = this.readCredentials();
    return credentials[credentialId];
  }
  
  /**
   * Получает все биометрические учетные данные
   */
  getAllCredentials(): BiometricCredentialStore[] {
    const credentials = this.readCredentials();
    return Object.values(credentials);
  }
  
  /**
   * Обновляет счетчик для credential
   */
  updateCredentialCounter(credentialId: string, newCounter: number): boolean {
    const credentials = this.readCredentials();
    if (credentials[credentialId]) {
      credentials[credentialId].counter = newCounter;
      this.writeCredentials(credentials);
      return true;
    }
    return false;
  }
  
  /**
   * Удаляет credential
   */
  removeCredential(credentialId: string): boolean {
    const credentials = this.readCredentials();
    if (credentials[credentialId]) {
      delete credentials[credentialId];
      this.writeCredentials(credentials);
      return true;
    }
    return false;
  }
  
  /**
   * Сохраняет challenge
   */
  saveChallenge(challenge: string, data: ChallengeData): void {
    const challenges = this.readChallenges();
    challenges[challenge] = data;
    this.writeChallenges(challenges);
  }
  
  /**
   * Получает challenge по ключу
   */
  getChallenge(challenge: string): ChallengeData | undefined {
    const challenges = this.readChallenges();
    return challenges[challenge];
  }
  
  /**
   * Удаляет challenge
   */
  removeChallenge(challenge: string): boolean {
    const challenges = this.readChallenges();
    if (challenges[challenge]) {
      delete challenges[challenge];
      this.writeChallenges(challenges);
      return true;
    }
    return false;
  }
  
  /**
   * Сохраняет session challenge
   */
  saveSessionChallenge(sessionId: string, challengeData: WebAuthnChallenge): void {
    const challenges = this.readSessionChallenges();
    challenges[sessionId] = challengeData;
    this.writeSessionChallenges(challenges);
  }
  
  /**
   * Получает session challenge по sessionId
   */
  getSessionChallenge(sessionId: string): WebAuthnChallenge | undefined {
    const challenges = this.readSessionChallenges();
    return challenges[sessionId];
  }
  
  /**
   * Удаляет session challenge
   */
  removeSessionChallenge(sessionId: string): boolean {
    const challenges = this.readSessionChallenges();
    if (challenges[sessionId]) {
      delete challenges[sessionId];
      this.writeSessionChallenges(challenges);
      return true;
    }
    return false;
  }
  
  /**
   * Очищает просроченные challenges
   */
  removeExpiredChallenges(timeout: number): void {
    const challenges = this.readChallenges();
    const now = Date.now();
    let removedCount = 0;
    
    for (const [challenge, data] of Object.entries(challenges)) {
      if (now - data.createdAt > timeout) {
        delete challenges[challenge];
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.writeChallenges(challenges);
      console.log(`🧹 Удалено ${removedCount} просроченных challenges`);
    }
  }
  
  /**
   * Очищает просроченные session challenges
   */
  removeExpiredSessionChallenges(timeout: number): void {
    const challenges = this.readSessionChallenges();
    const now = Date.now();
    let removedCount = 0;
    
    for (const [sessionId, data] of Object.entries(challenges)) {
      if (now - data.createdAt > timeout) {
        delete challenges[sessionId];
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.writeSessionChallenges(challenges);
      console.log(`🧹 Удалено ${removedCount} просроченных session challenges`);
    }
  }
}