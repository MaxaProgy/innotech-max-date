import {
  Controller,
  Get,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      return null;
    }
    const { password, emailConfirmationToken, passwordResetToken, ...result } = user;
    return result;
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Request() req: any) {
    await this.usersService.deleteAccount(req.user.userId);
    return { message: 'Аккаунт удален' };
  }

  @Delete('me/deactivate')
  @UseGuards(JwtAuthGuard)
  async deactivateAccount(@Request() req: any) {
    await this.usersService.deactivateAccount(req.user.userId);
    return { message: 'Аккаунт деактивирован' };
  }
}

