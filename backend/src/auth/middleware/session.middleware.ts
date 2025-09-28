import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const sessionId = req.cookies?.sessionId;

    if (!sessionId) {
      // Создаем новую сессию если её нет
      const newSessionId = this.authService.createNewSession();
      
      // Устанавливаем cookie с новой сессией (как в оригинале)
      res.cookie('sessionId', newSessionId, { httpOnly: true });

      console.log(`🆕 Создана новая сессия: ${newSessionId}`);
      
      // ← БЛОКИРУЕМ ЗАПРОС до получения валидной сессии (как в оригинале)
      res.status(401);
      res.end();
      return;
    }

    next();
  }
}