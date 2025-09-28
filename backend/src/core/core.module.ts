import { Module } from '@nestjs/common';
import { StoreService } from './services/store.service';
import { EncryptedStoreService } from './services/encrypted-store.service';
import { SessionsStoreService } from './services/sessions-store.service';
import { SessionsFileStoreService } from './services/sessions-file-store.service';
import { BiometricStoreService } from './services/biometric-store.service';
import { BiometricFileStoreService } from './services/biometric-file-store.service';
import { TelegramService } from './services/telegram.service';

@Module({
  providers: [
    EncryptedStoreService,
    StoreService,
    SessionsFileStoreService,
    SessionsStoreService,
    BiometricFileStoreService,
    BiometricStoreService,
    TelegramService,
    {
      provide: 'STORE_INIT',
      useFactory: (storeService: StoreService) => {
        storeService.prepareStore(); // Инициализация при старте
        return storeService;
      },
      inject: [StoreService],
    },
  ],
  exports: [
    EncryptedStoreService,
    StoreService,
    SessionsFileStoreService,
    SessionsStoreService,
    BiometricFileStoreService,
    BiometricStoreService,
    TelegramService,
  ],
})
export class CoreModule {}