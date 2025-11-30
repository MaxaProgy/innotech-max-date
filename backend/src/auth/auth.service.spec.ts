import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    const mockUsersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      validatePassword: jest.fn(),
      isLocked: jest.fn(),
      resetFailedAttempts: jest.fn(),
      incrementFailedAttempts: jest.fn(),
      confirmEmail: jest.fn(),
      createPasswordResetToken: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockMailService = {
      sendConfirmationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);
  });

  describe('register', () => {
    it('should throw error for email without @', async () => {
      await expect(
        service.register({ email: 'testmail.ru', password: 'Пароль1б' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for email not ending with .ru', async () => {
      await expect(
        service.register({ email: 'test@mail.com', password: 'Пароль1б' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for email over 50 characters', async () => {
      const longEmail = 'a'.repeat(45) + '@mail.ru';
      await expect(
        service.register({ email: longEmail, password: 'Пароль1б' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for password less than 8 characters', async () => {
      await expect(
        service.register({ email: 'test@mail.ru', password: 'Пар1А' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for password over 20 characters', async () => {
      await expect(
        service.register({
          email: 'test@mail.ru',
          password: 'Пароль1234567890123456789А',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for password without digit', async () => {
      await expect(
        service.register({ email: 'test@mail.ru', password: 'ПарольБез' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for password without lowercase cyrillic', async () => {
      await expect(
        service.register({ email: 'test@mail.ru', password: 'ПАРОЛЬ1Б' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for password without uppercase cyrillic', async () => {
      await expect(
        service.register({ email: 'test@mail.ru', password: 'пароль1б' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for password with latin characters', async () => {
      await expect(
        service.register({ email: 'test@mail.ru', password: 'Пароль1bс' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for password with special characters', async () => {
      await expect(
        service.register({ email: 'test@mail.ru', password: 'Пароль1!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should register user with valid credentials', async () => {
      const mockUser = {
        id: '123',
        email: 'test@mail.ru',
        emailConfirmationToken: 'token123',
      };

      usersService.create.mockResolvedValue(mockUser as any);
      mailService.sendConfirmationEmail.mockResolvedValue(undefined);

      const result = await service.register({
        email: 'test@mail.ru',
        password: 'Пароль1б',
      });

      expect(result.userId).toBe('123');
      expect(usersService.create).toHaveBeenCalledWith('test@mail.ru', 'Пароль1б');
      expect(mailService.sendConfirmationEmail).toHaveBeenCalledWith(
        'test@mail.ru',
        'token123',
      );
    });
  });

  describe('login', () => {
    it('should throw error for non-existent user', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@mail.ru', password: 'Пароль1б' }),
      ).rejects.toThrow('Неверный email или пароль');
    });

    it('should throw error for locked account', async () => {
      const mockUser = {
        id: '123',
        email: 'test@mail.ru',
        isDeactivated: false,
      };

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      usersService.isLocked.mockResolvedValue(true);

      await expect(
        service.login({ email: 'test@mail.ru', password: 'Пароль1б' }),
      ).rejects.toThrow('Аккаунт заблокирован');
    });

    it('should throw error for deactivated account', async () => {
      const mockUser = {
        id: '123',
        email: 'test@mail.ru',
        isDeactivated: true,
      };

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      usersService.isLocked.mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@mail.ru', password: 'Пароль1б' }),
      ).rejects.toThrow('Аккаунт деактивирован');
    });

    it('should increment failed attempts on wrong password', async () => {
      const mockUser = {
        id: '123',
        email: 'test@mail.ru',
        isDeactivated: false,
      };

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      usersService.isLocked.mockResolvedValue(false);
      usersService.validatePassword.mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@mail.ru', password: 'НеверныйПароль1' }),
      ).rejects.toThrow('Неверный email или пароль');

      expect(usersService.incrementFailedAttempts).toHaveBeenCalled();
    });

    it('should throw error for unconfirmed email', async () => {
      const mockUser = {
        id: '123',
        email: 'test@mail.ru',
        isDeactivated: false,
        emailConfirmed: false,
      };

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      usersService.isLocked.mockResolvedValue(false);
      usersService.validatePassword.mockResolvedValue(true);

      await expect(
        service.login({ email: 'test@mail.ru', password: 'Пароль1б' }),
      ).rejects.toThrow('подтвердите email');
    });

    it('should return token for valid login', async () => {
      const mockUser = {
        id: '123',
        email: 'test@mail.ru',
        isDeactivated: false,
        emailConfirmed: true,
        profile: null,
      };

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      usersService.isLocked.mockResolvedValue(false);
      usersService.validatePassword.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login({
        email: 'test@mail.ru',
        password: 'Пароль1б',
      });

      expect(result.accessToken).toBe('jwt-token');
      expect(result.user.id).toBe('123');
      expect(usersService.resetFailedAttempts).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should validate new password format', async () => {
      await expect(
        service.changePassword('123', 'СтарыйПароль1', 'короткий'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should call updatePassword with valid data', async () => {
      usersService.updatePassword.mockResolvedValue(undefined);

      await service.changePassword('123', 'СтарыйПароль1', 'НовыйПароль2');

      expect(usersService.updatePassword).toHaveBeenCalledWith(
        '123',
        'СтарыйПароль1',
        'НовыйПароль2',
      );
    });
  });
});

