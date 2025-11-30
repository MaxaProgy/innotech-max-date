import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Like, LikeType } from './entities/like.entity';
import { Match } from './entities/match.entity';
import { ProfilesService } from '../profiles/profiles.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { Profile, Gender } from '../profiles/entities/profile.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    private profilesService: ProfilesService,
    private mailService: MailService,
    private usersService: UsersService,
  ) {}

  async getFeed(userId: string, page: number = 1, limit: number = 20): Promise<any[]> {
    const userProfile = await this.profilesService.findByUserId(userId);
    if (!userProfile) {
      throw new NotFoundException('Сначала создайте профиль');
    }

    // Check if user has at least one photo
    if (!userProfile.photos || userProfile.photos.length === 0) {
      throw new BadRequestException('Добавьте хотя бы одно фото');
    }

    // Get all users this user has already interacted with
    const interactions = await this.likesRepository.find({
      where: { fromUserId: userId },
      select: ['toUserId'],
    });
    const interactedUserIds = interactions.map((l) => l.toUserId);
    interactedUserIds.push(userId); // Exclude self

    // Build query for profiles
    const queryBuilder = this.profilesService['profilesRepository']
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.photos', 'photos')
      .leftJoinAndSelect('profile.city', 'city')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.userId NOT IN (:...excludeIds)', {
        excludeIds: interactedUserIds.length > 0 ? interactedUserIds : ['none'],
      })
      .andWhere('profile.isVisible = :visible', { visible: true })
      .andWhere('user.isDeactivated = :deactivated', { deactivated: false });

    // Apply user's preference filters
    if (userProfile.preferredGender) {
      queryBuilder.andWhere('profile.gender = :gender', {
        gender: userProfile.preferredGender,
      });
    }

    if (userProfile.preferredCityId) {
      queryBuilder.andWhere('profile.cityId = :cityId', {
        cityId: userProfile.preferredCityId,
      });
    }

    // Age filter
    const today = new Date();
    if (userProfile.preferredAgeMin) {
      const maxBirthDate = new Date(
        today.getFullYear() - userProfile.preferredAgeMin,
        today.getMonth(),
        today.getDate(),
      );
      queryBuilder.andWhere('profile.birthDate <= :maxBirth', {
        maxBirth: maxBirthDate,
      });
    }

    if (userProfile.preferredAgeMax) {
      const minBirthDate = new Date(
        today.getFullYear() - userProfile.preferredAgeMax - 1,
        today.getMonth(),
        today.getDate(),
      );
      queryBuilder.andWhere('profile.birthDate >= :minBirth', {
        minBirth: minBirthDate,
      });
    }

    // Also check if the other person's filters allow seeing this user
    // Gender filter from other side
    queryBuilder.andWhere(
      '(profile.preferredGender IS NULL OR profile.preferredGender = :userGender)',
      { userGender: userProfile.gender },
    );

    // City filter from other side
    queryBuilder.andWhere(
      '(profile.preferredCityId IS NULL OR profile.preferredCityId = :userCityId)',
      { userCityId: userProfile.cityId },
    );

    // Age filter from other side
    const userAge = this.profilesService.calculateAge(userProfile.birthDate);
    queryBuilder.andWhere(
      '(profile.preferredAgeMin IS NULL OR profile.preferredAgeMin <= :userAge)',
      { userAge },
    );
    queryBuilder.andWhere(
      '(profile.preferredAgeMax IS NULL OR profile.preferredAgeMax >= :userAge)',
      { userAge },
    );

    // Only show profiles with at least one photo
    queryBuilder.andWhere(
      'EXISTS (SELECT 1 FROM photos p WHERE p."profileId" = profile.id)',
    );

    // Order by creation date (newest first) instead of random to avoid PostgreSQL DISTINCT issue
    queryBuilder.orderBy('profile.createdAt', 'DESC');

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const profiles = await queryBuilder.getMany();

    // Format for display
    return profiles.map((profile) => ({
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      age: this.profilesService.calculateAge(profile.birthDate),
      gender: profile.gender,
      city: profile.city,
      bio: profile.bio,
      vkLink: profile.vkLink,
      maxLink: profile.maxLink,
      photos: profile.photos?.sort((a, b) => (a.isMain ? -1 : b.isMain ? 1 : a.order - b.order)),
      email: !profile.hideEmail ? profile.user?.email : undefined,
    }));
  }

  async like(fromUserId: string, toUserId: string): Promise<{ isMatch: boolean }> {
    if (fromUserId === toUserId) {
      throw new BadRequestException('Нельзя лайкнуть самого себя');
    }

    const toUser = await this.usersService.findById(toUserId);
    if (!toUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Check if already interacted
    const existing = await this.likesRepository.findOne({
      where: { fromUserId, toUserId },
    });

    if (existing) {
      // Update if was dislike
      existing.type = LikeType.LIKE;
      await this.likesRepository.save(existing);
    } else {
      // Create new like
      const like = this.likesRepository.create({
        fromUserId,
        toUserId,
        type: LikeType.LIKE,
      });
      await this.likesRepository.save(like);
    }

    // Check for mutual like
    const mutualLike = await this.likesRepository.findOne({
      where: {
        fromUserId: toUserId,
        toUserId: fromUserId,
        type: LikeType.LIKE,
      },
    });

    if (mutualLike) {
      // Create match
      const existingMatch = await this.matchesRepository.findOne({
        where: [
          { user1Id: fromUserId, user2Id: toUserId },
          { user1Id: toUserId, user2Id: fromUserId },
        ],
      });

      if (!existingMatch) {
        const match = this.matchesRepository.create({
          user1Id: fromUserId,
          user2Id: toUserId,
        });
        await this.matchesRepository.save(match);

        // Send notification emails
        const fromProfile = await this.profilesService.findByUserId(fromUserId);
        const toProfile = await this.profilesService.findByUserId(toUserId);

        if (fromProfile && toUser.email) {
          await this.mailService.sendMatchNotification(
            toUser.email,
            `${fromProfile.firstName} ${fromProfile.lastName}`,
          );
        }

        const fromUser = await this.usersService.findById(fromUserId);
        if (toProfile && fromUser?.email) {
          await this.mailService.sendMatchNotification(
            fromUser.email,
            `${toProfile.firstName} ${toProfile.lastName}`,
          );
        }
      }

      return { isMatch: true };
    }

    return { isMatch: false };
  }

  async dislike(fromUserId: string, toUserId: string): Promise<void> {
    if (fromUserId === toUserId) {
      throw new BadRequestException('Нельзя дизлайкнуть самого себя');
    }

    // Check if already interacted
    const existing = await this.likesRepository.findOne({
      where: { fromUserId, toUserId },
    });

    if (existing) {
      existing.type = LikeType.DISLIKE;
      await this.likesRepository.save(existing);
    } else {
      const like = this.likesRepository.create({
        fromUserId,
        toUserId,
        type: LikeType.DISLIKE,
      });
      await this.likesRepository.save(like);
    }
  }

  async getMatches(userId: string): Promise<any[]> {
    const matches = await this.matchesRepository.find({
      where: [{ user1Id: userId }, { user2Id: userId }],
      order: { createdAt: 'DESC' },
    });

    const result = [];
    for (const match of matches) {
      const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const isViewed = match.user1Id === userId ? match.user1Viewed : match.user2Viewed;

      const profile = await this.profilesService.findByUserId(otherUserId);
      if (profile) {
        result.push({
          matchId: match.id,
          isNew: !isViewed,
          createdAt: match.createdAt,
          profile: {
            id: profile.id,
            userId: profile.userId,
            firstName: profile.firstName,
            lastName: profile.lastName,
            age: this.profilesService.calculateAge(profile.birthDate),
            city: profile.city,
            maxLink: profile.maxLink,
            vkLink: profile.vkLink,
            mainPhoto: profile.photos?.find((p) => p.isMain) || profile.photos?.[0],
          },
        });
      }
    }

    return result;
  }

  async markMatchAsViewed(userId: string, matchId: string): Promise<void> {
    const match = await this.matchesRepository.findOne({
      where: [
        { id: matchId, user1Id: userId },
        { id: matchId, user2Id: userId },
      ],
    });

    if (!match) {
      throw new NotFoundException('Мэтч не найден');
    }

    if (match.user1Id === userId) {
      match.user1Viewed = true;
    } else {
      match.user2Viewed = true;
    }

    await this.matchesRepository.save(match);
  }

  async getUnviewedMatchCount(userId: string): Promise<number> {
    const count = await this.matchesRepository.count({
      where: [
        { user1Id: userId, user1Viewed: false },
        { user2Id: userId, user2Viewed: false },
      ],
    });
    return count;
  }
}

