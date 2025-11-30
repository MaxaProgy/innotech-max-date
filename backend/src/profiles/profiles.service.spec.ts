import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { Profile, Gender } from './entities/profile.entity';
import { Photo } from './entities/photo.entity';
import { UsersService } from '../users/users.service';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let profilesRepository: any;
  let photosRepository: any;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockProfilesRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockPhotosRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockUsersService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        { provide: getRepositoryToken(Profile), useValue: mockProfilesRepository },
        { provide: getRepositoryToken(Photo), useValue: mockPhotosRepository },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    profilesRepository = module.get(getRepositoryToken(Profile));
    photosRepository = module.get(getRepositoryToken(Photo));
    usersService = module.get(UsersService);
  });

  describe('create', () => {
    it('should throw error if profile already exists', async () => {
      profilesRepository.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create('user1', {
          firstName: 'Test',
          lastName: 'User',
          birthDate: '2000-01-01',
          gender: Gender.MALE,
          cityId: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw error if user not found', async () => {
      profilesRepository.findOne.mockResolvedValue(null);
      usersService.findById.mockResolvedValue(null);

      await expect(
        service.create('user1', {
          firstName: 'Test',
          lastName: 'User',
          birthDate: '2000-01-01',
          gender: Gender.MALE,
          cityId: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if user is under 18', async () => {
      profilesRepository.findOne.mockResolvedValue(null);
      usersService.findById.mockResolvedValue({ id: 'user1' } as any);

      const today = new Date();
      const underageDate = new Date(
        today.getFullYear() - 17,
        today.getMonth(),
        today.getDate(),
      );

      await expect(
        service.create('user1', {
          firstName: 'Test',
          lastName: 'User',
          birthDate: underageDate.toISOString().split('T')[0],
          gender: Gender.MALE,
          cityId: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create profile for valid data', async () => {
      profilesRepository.findOne.mockResolvedValue(null);
      usersService.findById.mockResolvedValue({ id: 'user1' } as any);
      profilesRepository.create.mockReturnValue({
        firstName: 'Test',
        lastName: 'User',
        userId: 'user1',
      });
      profilesRepository.save.mockResolvedValue({
        id: 'profile1',
        firstName: 'Test',
        lastName: 'User',
        userId: 'user1',
      });

      const result = await service.create('user1', {
        firstName: 'Test',
        lastName: 'User',
        birthDate: '2000-01-01',
        gender: Gender.MALE,
        cityId: 1,
      });

      expect(result.id).toBe('profile1');
      expect(profilesRepository.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should throw error if profile not found', async () => {
      profilesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('user1', { firstName: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if age filter is invalid', async () => {
      profilesRepository.findOne.mockResolvedValue({
        id: 'profile1',
        userId: 'user1',
      });

      await expect(
        service.update('user1', {
          preferredAgeMin: 30,
          preferredAgeMax: 20,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update profile successfully', async () => {
      const existingProfile = {
        id: 'profile1',
        userId: 'user1',
        firstName: 'Old',
      };
      profilesRepository.findOne.mockResolvedValue(existingProfile);
      profilesRepository.save.mockResolvedValue({
        ...existingProfile,
        firstName: 'New',
      });

      const result = await service.update('user1', { firstName: 'New' });

      expect(result.firstName).toBe('New');
    });
  });

  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear() - 25,
        today.getMonth(),
        today.getDate(),
      );

      const age = service.calculateAge(birthDate);

      expect(age).toBe(25);
    });

    it('should handle birthday not yet occurred this year', () => {
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear() - 25,
        today.getMonth() + 1,
        today.getDate(),
      );

      const age = service.calculateAge(birthDate);

      expect(age).toBe(24);
    });
  });

  describe('uploadPhoto', () => {
    it('should throw error if profile not found', async () => {
      profilesRepository.findOne.mockResolvedValue(null);

      const mockFile = {
        filename: 'test.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        path: '/tmp/test.jpg',
      };

      await expect(
        service.uploadPhoto('user1', mockFile as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if max photos reached', async () => {
      profilesRepository.findOne.mockResolvedValue({
        id: 'profile1',
        photos: Array(5).fill({ id: 'photo' }),
      });

      const mockFile = {
        filename: 'test.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        path: '/tmp/test.jpg',
      };

      // Mock fs.unlinkSync
      jest.spyOn(require('fs'), 'unlinkSync').mockImplementation(() => {});

      await expect(
        service.uploadPhoto('user1', mockFile as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set first photo as main', async () => {
      profilesRepository.findOne.mockResolvedValue({
        id: 'profile1',
        photos: [],
      });

      const mockFile = {
        filename: 'test.jpg',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        path: '/tmp/test.jpg',
      };

      photosRepository.create.mockReturnValue({
        filename: 'test.jpg',
        isMain: true,
      });
      photosRepository.save.mockResolvedValue({
        id: 'photo1',
        filename: 'test.jpg',
        isMain: true,
      });

      const result = await service.uploadPhoto('user1', mockFile as any);

      expect(result.isMain).toBe(true);
    });
  });

  describe('setMainPhoto', () => {
    it('should throw error if profile not found', async () => {
      profilesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.setMainPhoto('user1', 'photo1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if photo not found', async () => {
      profilesRepository.findOne.mockResolvedValue({
        id: 'profile1',
      });
      photosRepository.findOne.mockResolvedValue(null);

      await expect(
        service.setMainPhoto('user1', 'photo1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should set photo as main', async () => {
      profilesRepository.findOne.mockResolvedValue({
        id: 'profile1',
      });
      photosRepository.findOne.mockResolvedValue({
        id: 'photo1',
        profileId: 'profile1',
        isMain: false,
      });
      photosRepository.update.mockResolvedValue({});
      photosRepository.save.mockResolvedValue({
        id: 'photo1',
        isMain: true,
      });

      const result = await service.setMainPhoto('user1', 'photo1');

      expect(result.isMain).toBe(true);
    });
  });
});

