import { Module } from '@nestjs/common';
import { BiometricController } from './biometric.controller';
import { BiometricService } from './biometric.service';
import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CoreModule, AuthModule],
  controllers: [BiometricController],
  providers: [BiometricService],
  exports: [BiometricService],
})
export class BiometricModule {}