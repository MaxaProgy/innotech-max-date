import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Match } from './entities/match.entity';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { ProfilesModule } from '../profiles/profiles.module';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Like, Match]),
    ProfilesModule,
    MailModule,
    UsersModule,
  ],
  providers: [LikesService],
  controllers: [LikesController],
  exports: [LikesService],
})
export class LikesModule {}

