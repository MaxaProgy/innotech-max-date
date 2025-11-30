import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('likes')
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Get('feed')
  async getFeed(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.likesService.getFeed(
      req.user.userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('like/:userId')
  async like(@Request() req: any, @Param('userId') toUserId: string) {
    return this.likesService.like(req.user.userId, toUserId);
  }

  @Post('dislike/:userId')
  async dislike(@Request() req: any, @Param('userId') toUserId: string) {
    await this.likesService.dislike(req.user.userId, toUserId);
    return { message: 'Dislike recorded' };
  }

  @Get('matches')
  async getMatches(@Request() req: any) {
    return this.likesService.getMatches(req.user.userId);
  }

  @Post('matches/:matchId/view')
  async markMatchAsViewed(
    @Request() req: any,
    @Param('matchId') matchId: string,
  ) {
    await this.likesService.markMatchAsViewed(req.user.userId, matchId);
    return { message: 'Match marked as viewed' };
  }

  @Get('matches/unviewed-count')
  async getUnviewedMatchCount(@Request() req: any) {
    const count = await this.likesService.getUnviewedMatchCount(req.user.userId);
    return { count };
  }
}

