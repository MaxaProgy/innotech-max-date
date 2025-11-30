import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LikesService } from './likes.service';
import { Like, LikeType } from './entities/like.entity';
import { Match } from './entities/match.entity';
import { ProfilesService } from '../profiles/profiles.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';

describe('LikesService', () => {
  let service: LikesService;
  let likesRepository: any;
  let matchesRepository: any;
  let profilesService: jest.Mocked<ProfilesService>;
  let mailService: jest.Mocked<MailService>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockLikesRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockMatchesRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };

    const mockProfilesService = {
      findByUserId: jest.fn(),
      calculateAge: jest.fn(),
    };

    const mockMailService = {
      sendMatchNotification: jest.fn(),
    };

    const mockUsersService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        { provide: getRepositoryToken(Like), useValue: mockLikesRepository },
        { provide: getRepositoryToken(Match), useValue: mockMatchesRepository },
        { provide: ProfilesService, useValue: mockProfilesService },
        { provide: MailService, useValue: mockMailService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<LikesService>(LikesService);
    likesRepository = module.get(getRepositoryToken(Like));
    matchesRepository = module.get(getRepositoryToken(Match));
    profilesService = module.get(ProfilesService);
    mailService = module.get(MailService);
    usersService = module.get(UsersService);
  });

  describe('like', () => {
    it('should throw error when liking self', async () => {
      await expect(service.like('user1', 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error when target user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(service.like('user1', 'user2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create like without match when no mutual like', async () => {
      usersService.findById.mockResolvedValue({ id: 'user2' } as any);
      likesRepository.findOne.mockResolvedValue(null);
      likesRepository.create.mockReturnValue({
        fromUserId: 'user1',
        toUserId: 'user2',
        type: LikeType.LIKE,
      });
      likesRepository.save.mockResolvedValue({});

      const result = await service.like('user1', 'user2');

      expect(result.isMatch).toBe(false);
      expect(likesRepository.create).toHaveBeenCalledWith({
        fromUserId: 'user1',
        toUserId: 'user2',
        type: LikeType.LIKE,
      });
    });

    it('should create match when mutual like exists', async () => {
      usersService.findById.mockResolvedValue({
        id: 'user2',
        email: 'user2@mail.ru',
      } as any);
      
      // First findOne: check existing like from user1 to user2
      likesRepository.findOne
        .mockResolvedValueOnce(null) // no existing like
        .mockResolvedValueOnce({ // mutual like exists
          fromUserId: 'user2',
          toUserId: 'user1',
          type: LikeType.LIKE,
        });

      likesRepository.create.mockReturnValue({
        fromUserId: 'user1',
        toUserId: 'user2',
        type: LikeType.LIKE,
      });
      likesRepository.save.mockResolvedValue({});

      // No existing match
      matchesRepository.findOne.mockResolvedValue(null);
      matchesRepository.create.mockReturnValue({
        user1Id: 'user1',
        user2Id: 'user2',
      });
      matchesRepository.save.mockResolvedValue({});

      profilesService.findByUserId.mockResolvedValue({
        firstName: 'Test',
        lastName: 'User',
      } as any);

      const result = await service.like('user1', 'user2');

      expect(result.isMatch).toBe(true);
      expect(matchesRepository.create).toHaveBeenCalled();
      expect(mailService.sendMatchNotification).toHaveBeenCalled();
    });
  });

  describe('dislike', () => {
    it('should throw error when disliking self', async () => {
      await expect(service.dislike('user1', 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create dislike record', async () => {
      likesRepository.findOne.mockResolvedValue(null);
      likesRepository.create.mockReturnValue({
        fromUserId: 'user1',
        toUserId: 'user2',
        type: LikeType.DISLIKE,
      });
      likesRepository.save.mockResolvedValue({});

      await service.dislike('user1', 'user2');

      expect(likesRepository.create).toHaveBeenCalledWith({
        fromUserId: 'user1',
        toUserId: 'user2',
        type: LikeType.DISLIKE,
      });
    });

    it('should update existing like to dislike', async () => {
      const existingLike = {
        fromUserId: 'user1',
        toUserId: 'user2',
        type: LikeType.LIKE,
      };
      likesRepository.findOne.mockResolvedValue(existingLike);
      likesRepository.save.mockResolvedValue({});

      await service.dislike('user1', 'user2');

      expect(existingLike.type).toBe(LikeType.DISLIKE);
      expect(likesRepository.save).toHaveBeenCalledWith(existingLike);
    });
  });

  describe('getMatches', () => {
    it('should return empty array when no matches', async () => {
      matchesRepository.find.mockResolvedValue([]);

      const result = await service.getMatches('user1');

      expect(result).toEqual([]);
    });

    it('should return formatted matches', async () => {
      matchesRepository.find.mockResolvedValue([
        {
          id: 'match1',
          user1Id: 'user1',
          user2Id: 'user2',
          user1Viewed: false,
          createdAt: new Date(),
        },
      ]);

      profilesService.findByUserId.mockResolvedValue({
        id: 'profile2',
        userId: 'user2',
        firstName: 'Test',
        lastName: 'User',
        birthDate: new Date('1995-01-01'),
        city: { name: 'Москва' },
        photos: [{ isMain: true, filename: 'photo.jpg' }],
      } as any);

      profilesService.calculateAge.mockReturnValue(29);

      const result = await service.getMatches('user1');

      expect(result).toHaveLength(1);
      expect(result[0].matchId).toBe('match1');
      expect(result[0].isNew).toBe(true);
      expect(result[0].profile.firstName).toBe('Test');
    });
  });

  describe('getUnviewedMatchCount', () => {
    it('should return correct count', async () => {
      matchesRepository.count.mockResolvedValue(5);

      const result = await service.getUnviewedMatchCount('user1');

      expect(result).toBe(5);
    });
  });

  describe('markMatchAsViewed', () => {
    it('should throw error when match not found', async () => {
      matchesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.markMatchAsViewed('user1', 'match1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should mark match as viewed for user1', async () => {
      const match = {
        id: 'match1',
        user1Id: 'user1',
        user2Id: 'user2',
        user1Viewed: false,
        user2Viewed: false,
      };
      matchesRepository.findOne.mockResolvedValue(match);
      matchesRepository.save.mockResolvedValue({});

      await service.markMatchAsViewed('user1', 'match1');

      expect(match.user1Viewed).toBe(true);
      expect(matchesRepository.save).toHaveBeenCalledWith(match);
    });

    it('should mark match as viewed for user2', async () => {
      const match = {
        id: 'match1',
        user1Id: 'user1',
        user2Id: 'user2',
        user1Viewed: false,
        user2Viewed: false,
      };
      matchesRepository.findOne.mockResolvedValue(match);
      matchesRepository.save.mockResolvedValue({});

      await service.markMatchAsViewed('user2', 'match1');

      expect(match.user2Viewed).toBe(true);
      expect(matchesRepository.save).toHaveBeenCalledWith(match);
    });
  });
});

