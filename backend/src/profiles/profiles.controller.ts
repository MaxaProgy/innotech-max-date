import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Request() req: any) {
    return this.profilesService.findByUserId(req.user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createProfile(@Request() req: any, @Body() dto: CreateProfileDto) {
    return this.profilesService.create(req.user.userId, dto);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.profilesService.update(req.user.userId, dto);
  }

  @Post('photos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Query('isMain', new ParseBoolPipe({ optional: true })) isMain?: boolean,
  ) {
    if (!file) {
      return { error: 'Файл не загружен' };
    }
    return this.profilesService.uploadPhoto(req.user.userId, file, isMain);
  }

  @Delete('photos/:id')
  @UseGuards(JwtAuthGuard)
  async deletePhoto(@Request() req: any, @Param('id') photoId: string) {
    await this.profilesService.deletePhoto(req.user.userId, photoId);
    return { message: 'Фото удалено' };
  }

  @Put('photos/:id/main')
  @UseGuards(JwtAuthGuard)
  async setMainPhoto(@Request() req: any, @Param('id') photoId: string) {
    return this.profilesService.setMainPhoto(req.user.userId, photoId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any, @Param('id') profileId: string) {
    return this.profilesService.getProfileForDisplay(profileId, req.user.userId);
  }
}

