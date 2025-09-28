import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { init } from './core/init';

async function bootstrap() {
  // Инициализация файлового хранилища и периодических задач
  init();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // БЕЗОПАСНОСТЬ: Настройка trust proxy для работы за nginx
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // БЕЗОПАСНОСТЬ: Helmet для базовой защиты
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // Cookie parser middleware
  app.use(cookieParser());
  
  // NOTE: Глобальный rate limiting реализован через ThrottlerModule в app.module.ts

  // Глобальная валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // API prefix
  app.setGlobalPrefix('api');

  const PORT = configService.get('PORT') || 60125;
  
  await app.listen(PORT);
  
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log('🔒 Безопасность активирована:');
  console.log('  ✅ Rate limiting включен');
  console.log('  ✅ Helmet защита активна');
  console.log('  ✅ Зашифрованное файловое хранилище');
  console.log('  ✅ Криптографически стойкие sessionId');
  console.log('  ✅ Полная WebAuthn верификация');
}

bootstrap();