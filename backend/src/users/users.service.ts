import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['profile', 'profile.city', 'profile.photos'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['profile', 'profile.city', 'profile.photos'],
    });
  }

  async findByEmailConfirmationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { emailConfirmationToken: token },
    });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { passwordResetToken: token },
    });
  }

  async create(email: string, password: string): Promise<User> {
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const emailConfirmationToken = uuidv4();

    const user = this.usersRepository.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      emailConfirmationToken,
    });

    return this.usersRepository.save(user);
  }

  async confirmEmail(token: string): Promise<User> {
    const user = await this.findByEmailConfirmationToken(token);
    if (!user) {
      throw new NotFoundException('Неверный токен подтверждения');
    }

    user.emailConfirmed = true;
    user.emailConfirmationToken = '';
    return this.usersRepository.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const isValid = await this.validatePassword(user, oldPassword);
    if (!isValid) {
      throw new BadRequestException('Неверный текущий пароль');
    }

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      throw new BadRequestException('Новый пароль не должен совпадать со старым');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await this.usersRepository.save(user);
  }

  async createPasswordResetToken(email: string): Promise<string> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    user.passwordResetToken = token;
    user.passwordResetExpires = expires;
    await this.usersRepository.save(user);

    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.findByPasswordResetToken(token);
    if (!user) {
      throw new NotFoundException('Неверный токен сброса пароля');
    }

    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Токен сброса пароля истек');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = '';
    user.passwordResetExpires = null as unknown as Date;
    await this.usersRepository.save(user);
  }

  async incrementFailedAttempts(user: User): Promise<void> {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 5) {
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + 30);
      user.lockedUntil = lockedUntil;
    }
    await this.usersRepository.save(user);
  }

  async resetFailedAttempts(user: User): Promise<void> {
    user.failedLoginAttempts = 0;
    user.lockedUntil = null as unknown as Date;
    await this.usersRepository.save(user);
  }

  async isLocked(user: User): Promise<boolean> {
    if (!user.lockedUntil) return false;
    return user.lockedUntil > new Date();
  }

  async deactivateAccount(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    user.isDeactivated = true;
    user.isActive = false;
    await this.usersRepository.save(user);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    await this.usersRepository.remove(user);
  }
}

