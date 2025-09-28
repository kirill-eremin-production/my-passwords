import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

export class ValidateSessionDto {
  data?: {
    code?: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Валидация сессии с кодом подтверждения
   * POST /api/auth
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  validateSession(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: ValidateSessionDto
  ): Response {
    const sessionId = req.cookies?.sessionId;
    const code = body?.data?.code;

    if (!sessionId) {
      return res.status(HttpStatus.FORBIDDEN).send();
    }

    const session = this.authService.getSessionFromCookie(sessionId);
    
    if (session && this.authService.validateSessionWithCode(sessionId, String(code))) {
      return res.status(HttpStatus.OK).send();
    } else {
      return res.status(HttpStatus.FORBIDDEN).send();
    }
  }
}