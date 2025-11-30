import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile, Gender } from './entities/profile.entity';
import { Photo } from './entities/photo.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from '../users/users.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    @InjectRepository(Photo)
    private photosRepository: Repository<Photo>,
    private usersService: UsersService,
  ) {}

  async findByUserId(userId: string): Promise<Profile | null> {
    return this.profilesRepository.findOne({
      where: { userId },
      relations: ['city', 'photos', 'user'],
    });
  }

  async findById(id: string): Promise<Profile | null> {
    return this.profilesRepository.findOne({
      where: { id },
      relations: ['city', 'photos', 'user'],
    });
  }

  async create(userId: string, dto: CreateProfileDto): Promise<Profile> {
    const existingProfile = await this.findByUserId(userId);
    if (existingProfile) {
      throw new ConflictException('Профиль уже существует');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Validate age (must be 18+)
    const birthDate = new Date(dto.birthDate);
    const age = this.calculateAge(birthDate);
    if (age < 18) {
      throw new BadRequestException('Вам должно быть не менее 18 лет');
    }

    const profile = this.profilesRepository.create({
      ...dto,
      birthDate,
      userId,
    });

    return this.profilesRepository.save(profile);
  }

  async update(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Профиль не найден');
    }

    if (dto.birthDate) {
      const birthDate = new Date(dto.birthDate);
      const age = this.calculateAge(birthDate);
      if (age < 18) {
        throw new BadRequestException('Вам должно быть не менее 18 лет');
      }
    }

    // Validate age filter
    if (dto.preferredAgeMin && dto.preferredAgeMax) {
      if (dto.preferredAgeMin > dto.preferredAgeMax) {
        throw new BadRequestException(
          'Минимальный возраст не может быть больше максимального',
        );
      }
    }

    Object.assign(profile, dto);
    return this.profilesRepository.save(profile);
  }

  async uploadPhoto(
    userId: string,
    file: Express.Multer.File,
    isMain: boolean = false,
  ): Promise<Photo> {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Сначала создайте профиль');
    }

    const photosCount = profile.photos?.length || 0;
    if (photosCount >= 5) {
      // Delete the uploaded file
      fs.unlinkSync(file.path);
      throw new BadRequestException('Максимум 5 фотографий');
    }

    // If this is the first photo, make it main
    const shouldBeMain = photosCount === 0 || isMain;

    // If setting as main, unset other main photos
    if (shouldBeMain && photosCount > 0) {
      await this.photosRepository.update(
        { profileId: profile.id, isMain: true },
        { isMain: false },
      );
    }

    const photo = this.photosRepository.create({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      isMain: shouldBeMain,
      order: photosCount,
      profileId: profile.id,
    });

    return this.photosRepository.save(photo);
  }

  async deletePhoto(userId: string, photoId: string): Promise<void> {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Профиль не найден');
    }

    const photo = await this.photosRepository.findOne({
      where: { id: photoId, profileId: profile.id },
    });

    if (!photo) {
      throw new NotFoundException('Фото не найдено');
    }

    // Check if this is the only photo
    const photosCount = profile.photos?.length || 0;
    if (photosCount <= 1) {
      throw new BadRequestException('Необходимо минимум одно фото');
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '..', '..', 'uploads', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const wasMain = photo.isMain;
    await this.photosRepository.remove(photo);

    // If deleted photo was main, set another one as main
    if (wasMain) {
      const remainingPhoto = await this.photosRepository.findOne({
        where: { profileId: profile.id },
        order: { order: 'ASC' },
      });
      if (remainingPhoto) {
        remainingPhoto.isMain = true;
        await this.photosRepository.save(remainingPhoto);
      }
    }
  }

  async setMainPhoto(userId: string, photoId: string): Promise<Photo> {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Профиль не найден');
    }

    const photo = await this.photosRepository.findOne({
      where: { id: photoId, profileId: profile.id },
    });

    if (!photo) {
      throw new NotFoundException('Фото не найдено');
    }

    // Unset all main photos
    await this.photosRepository.update(
      { profileId: profile.id },
      { isMain: false },
    );

    // Set this photo as main
    photo.isMain = true;
    return this.photosRepository.save(photo);
  }

  async getProfileForDisplay(
    profileId: string,
    viewerId?: string,
  ): Promise<Partial<Profile> | null> {
    const profile = await this.findById(profileId);
    if (!profile) {
      return null;
    }

    // Get viewer's profile for filtering
    let viewerProfile: Profile | null = null;
    if (viewerId) {
      viewerProfile = await this.findByUserId(viewerId);
    }

    // Apply visibility filters
    if (!profile.isVisible) {
      return null;
    }

    // Create display object
    const displayProfile: any = {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      middleName: profile.middleName,
      birthDate: profile.birthDate,
      gender: profile.gender,
      city: profile.city,
      vkLink: profile.vkLink,
      maxLink: profile.maxLink,
      bio: profile.bio,
      photos: profile.photos,
      age: this.calculateAge(profile.birthDate),
    };

    // Add email if not hidden
    if (!profile.hideEmail && profile.user) {
      displayProfile.email = profile.user.email;
    }

    return displayProfile;
  }

  calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}

