import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
import { Gender } from '../entities/profile.entity';

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  middleName?: string;

  @IsDateString()
  @IsNotEmpty()
  birthDate: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @IsNumber()
  @IsNotEmpty()
  cityId: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Matches(/^@[\w\d_]+$/, { message: 'VK ссылка должна быть в формате @username' })
  vkLink?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Matches(/^https:\/\/max\.me\/[\w\d_]+$/, { 
    message: 'Max ссылка должна быть в формате https://max.me/username' 
  })
  maxLink?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  bio?: string;
}

