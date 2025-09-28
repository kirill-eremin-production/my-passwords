import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CoreModule } from '../core/core.module';
import { SessionGuard, AuthGuard } from './guards/session.guard';
import { SessionMiddleware } from './middleware/session.middleware';

@Module({
  imports: [CoreModule],
  controllers: [AuthController],
  providers: [AuthService, SessionGuard, AuthGuard, SessionMiddleware],
  exports: [AuthService, SessionGuard, AuthGuard, SessionMiddleware],
})
export class AuthModule {}