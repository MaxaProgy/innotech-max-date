import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    // Validate email format
    this.validateEmail(email);

    // Validate password
    this.validatePassword(password);

    const user = await this.usersService.create(email, password);

    // Send confirmation email
    await this.mailService.sendConfirmationEmail(
      user.email,
      user.emailConfirmationToken!,
    );

    return {
      message: 'Регистрация успешна. Проверьте почту для подтверждения.',
      userId: user.id,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Check if account is locked
    if (await this.usersService.isLocked(user)) {
      throw new UnauthorizedException(
        'Аккаунт заблокирован. Попробуйте через 30 минут.',
      );
    }

    // Check if account is deactivated
    if (user.isDeactivated) {
      throw new UnauthorizedException('Аккаунт деактивирован');
    }

    // Validate password
    const isValid = await this.usersService.validatePassword(user, password);
    if (!isValid) {
      await this.usersService.incrementFailedAttempts(user);
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Reset failed attempts on successful login
    await this.usersService.resetFailedAttempts(user);

    // Check if email is confirmed
    if (!user.emailConfirmed) {
      throw new UnauthorizedException(
        'Пожалуйста, подтвердите email перед входом',
      );
    }

    const payload = { userId: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        hasProfile: !!user.profile,
      },
    };
  }

  async confirmEmail(token: string) {
    await this.usersService.confirmEmail(token);
    return { message: 'Email подтвержден успешно' };
  }

  async requestPasswordReset(email: string) {
    const token = await this.usersService.createPasswordResetToken(email);
    await this.mailService.sendPasswordResetEmail(email, token);
    return { message: 'Инструкции по сбросу пароля отправлены на email' };
  }

  async resetPassword(token: string, newPassword: string) {
    this.validatePassword(newPassword);
    await this.usersService.resetPassword(token, newPassword);
    return { message: 'Пароль успешно изменен' };
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    this.validatePassword(newPassword);
    await this.usersService.updatePassword(userId, oldPassword, newPassword);
    return { message: 'Пароль успешно изменен' };
  }

  private validateEmail(email: string): void {
    if (email.length > 50) {
      throw new BadRequestException('Email не должен превышать 50 символов');
    }
    if (!email.includes('@')) {
      throw new BadRequestException('Email должен содержать @');
    }
    if (!email.toLowerCase().endsWith('.ru')) {
      throw new BadRequestException('Email должен заканчиваться на .ru');
    }
  }

  private validatePassword(password: string): void {
    if (password.length < 8 || password.length > 20) {
      throw new BadRequestException(
        'Пароль должен содержать от 8 до 20 символов',
      );
    }

    // Check for at least one digit
    if (!/\d/.test(password)) {
      throw new BadRequestException(
        'Пароль должен содержать минимум одну цифру',
      );
    }

    // Check for Cyrillic lowercase
    if (!/[а-яё]/.test(password)) {
      throw new BadRequestException(
        'Пароль должен содержать минимум одну строчную букву кириллицы',
      );
    }

    // Check for Cyrillic uppercase
    if (!/[А-ЯЁ]/.test(password)) {
      throw new BadRequestException(
        'Пароль должен содержать минимум одну заглавную букву кириллицы',
      );
    }

    // Check for Latin characters (should not have any)
    if (/[a-zA-Z]/.test(password)) {
      throw new BadRequestException(
        'Пароль не должен содержать латинские буквы',
      );
    }

    // Check for special characters (should not have any)
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new BadRequestException(
        'Пароль не должен содержать специальные символы',
      );
    }
  }
}

