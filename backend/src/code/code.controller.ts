import {
  Controller,
  Post,
  Req,
  Res,
  HttpStatus,
  HttpCode,
  UseGuards
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { CodeService } from './code.service';
import { SessionGuard } from '../auth/guards/session.guard';

@Controller('code')
export class CodeController {
  constructor(private readonly codeService: CodeService) {}

  /**
   * Генерация и отправка кода подтверждения
   * POST /api/code
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @Throttle({ authCode: { limit: 5, ttl: 15 * 60 * 1000 } }) // 5 запросов за 15 минут (как в старой архитектуре)
  async generateAndSendCode(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const sessionId = req.cookies?.sessionId;
    
    if (!sessionId) {
      res.status(HttpStatus.UNAUTHORIZED).send();
      return;
    }

    try {
      const code = await this.codeService.generateAndSendCode(
        sessionId,
        req.headers['user-agent']
      );
      
      res.status(HttpStatus.OK).send();
    } catch (error) {
      console.error('Ошибка генерации/отправки кода:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
    }
  }
}