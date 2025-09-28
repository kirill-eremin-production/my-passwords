import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UseGuards
} from '@nestjs/common';
import { PasswordsService } from './passwords.service';
import { AuthGuard } from '../auth/guards/session.guard';

export class SavePasswordsDto {
  data?: any;
}

@Controller('passwords')
@UseGuards(AuthGuard) // Требуем полную авторизацию для всех endpoint'ов
export class PasswordsController {
  constructor(private readonly passwordsService: PasswordsService) {}

  /**
   * Получение всех паролей
   * GET /api/passwords
   */
  @Get()
  getPasswords(): { data: string } {
    const storeData = this.passwordsService.getPasswords();
    
    return {
      data: storeData,
    };
  }

  /**
   * Сохранение паролей
   * POST /api/passwords
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async savePasswords(@Body() body: SavePasswordsDto,): Promise<void> {
    await this.passwordsService.savePasswords(body.data);
  }
}