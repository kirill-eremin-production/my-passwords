import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
  HttpCode,
  UseGuards
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { BiometricService } from './biometric.service';
import { BiometricRegistrationRequest, BiometricAuthenticationRequest } from '../types/biometric';
import { AuthGuard } from '../auth/guards/session.guard';

export class GenerateChallengeDto {
  // Пустой DTO, challenge генерируется автоматически
}

export class RegisterBiometricDto {
  data?: BiometricRegistrationRequest;
}

export class AuthenticateBiometricDto {
  data?: BiometricAuthenticationRequest;
}

@Controller('biometric')
export class BiometricController {
  constructor(private readonly biometricService: BiometricService) {}

  /**
   * Генерирует и возвращает challenge для биометрической аутентификации
   * GET /api/biometric/challenge
   */
  @Get('challenge')
  @HttpCode(HttpStatus.OK)
  @Throttle({ general: { limit: 100, ttl: 15 * 60 * 1000 } }) // Общий лимит как в старой архитектуре
  generateChallenge(
    @Req() req: Request,
    @Res() res: Response,
  ): Response {
    try {
      const sessionId = req.cookies?.sessionId;

      if (!sessionId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ 
          error: 'Отсутствует sessionId' 
        });
      }

      const challenge = this.biometricService.generateChallenge(sessionId);

      return res.status(HttpStatus.OK).json({
        success: true,
        challenge: challenge,
      });
    } catch (error) {
      console.error('Ошибка создания challenge:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        error: 'Ошибка сервера при создании challenge' 
      });
    }
  }

  /**
   * Регистрирует биометрические учетные данные
   * POST /api/biometric/register
   * Требует авторизованную сессию
   */
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard) // ← ДОБАВЛЕНО: Требует валидной авторизованной сессии
  @Throttle({ general: { limit: 100, ttl: 15 * 60 * 1000 } }) // Общий лимит, но требует авторизации
  async registerBiometric(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: RegisterBiometricDto,
  ): Promise<void> {
    const sessionId = req.cookies?.sessionId;
    const registrationData = body?.data;

    if (!sessionId) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Отсутствует sessionId',
      });
      return;
    }

    if (!registrationData) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Отсутствуют данные регистрации',
      });
      return;
    }

    try {
      const result = await this.biometricService.registerBiometric(
        sessionId,
        registrationData,
        req.headers['user-agent']
      );

      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('Ошибка регистрации биометрических данных:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: `Ошибка сервера при регистрации биометрии: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      });
    }
  }

  /**
   * Аутентификация с помощью биометрических данных
   * POST /api/biometric/authenticate
   * Не требует предварительной авторизации (альтернативный способ входа)
   */
  @Post('authenticate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ biometric: { limit: 10, ttl: 60 * 1000 } }) // 10 попыток за минуту как в старой архитектуре
  async authenticateWithBiometric(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: AuthenticateBiometricDto,
  ): Promise<void> {
    const sessionId = req.cookies?.sessionId;
    const authData = body?.data;

    if (!sessionId) {
      res.status(HttpStatus.UNAUTHORIZED).json({ 
        error: 'Отсутствует sessionId' 
      });
      return;
    }

    if (!authData) {
      res.status(HttpStatus.BAD_REQUEST).json({ 
        error: 'Отсутствуют данные аутентификации' 
      });
      return;
    }

    try {
      const result = await this.biometricService.authenticateWithBiometric(
        sessionId,
        authData
      );

      // Устанавливаем cookie с новой сессией
      res.cookie('sessionId', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('Ошибка биометрической аутентификации:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Ошибка сервера при биометрической аутентификации',
      });
    }
  }
}