import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.cookies?.sessionId;
    
    if (!sessionId) {
      throw new ForbiddenException('Session required');
    }

    const session = this.authService.getSessionFromCookie(sessionId);
    
    if (!session) {
      throw new ForbiddenException('Invalid session');
    }

    // Добавляем сессию в request для использования в контроллерах
    (request as any).session = session;
    
    return true;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.cookies?.sessionId;
    
    if (!sessionId) {
      throw new ForbiddenException('Authentication required');
    }

    const session = this.authService.getSessionFromCookie(sessionId);
    
    if (!session || !session.valid) {
      throw new ForbiddenException('Valid authentication required');
    }

    // Добавляем сессию в request для использования в контроллерах
    (request as any).session = session;
    
    return true;
  }
}