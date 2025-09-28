import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { BiometricModule } from './biometric/biometric.module';
import { PasswordsModule } from './passwords/passwords.module';
import { CodeModule } from './code/code.module';
import { CoreModule } from './core/core.module';
import { SessionMiddleware } from './auth/middleware/session.middleware';

@Module({
  imports: [
    // Конфигурация из .env файлов
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Rate limiting (настройки как в старой архитектуре)
    ThrottlerModule.forRoot([
      {
        name: 'general',
        ttl: 15 * 60 * 1000, // 15 минут
        limit: 100, // 100 запросов за окно
      },
      {
        name: 'authCode',
        ttl: 15 * 60 * 1000, // 15 минут
        limit: 5, // максимум 5 запросов кодов за 15 минут
      },
      {
        name: 'biometric',
        ttl: 1 * 60 * 1000, // 1 минута
        limit: 10, // максимум 10 попыток за минуту
      },
    ]),

    // Основные модули приложения
    CoreModule,
    AuthModule,
    BiometricModule,
    PasswordsModule,
    CodeModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Применяем SessionMiddleware ко всем маршрутам
    consumer
      .apply(SessionMiddleware)
      .forRoutes('*');
  }
}