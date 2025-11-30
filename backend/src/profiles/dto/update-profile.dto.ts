import {
  IsString,
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  IsBoolean,
  MaxLength,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { Gender } from '../entities/profile.entity';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  middleName?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsNumber()
  @IsOptional()
  cityId?: number;

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

  @IsBoolean()
  @IsOptional()
  hideEmail?: boolean;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsEnum(Gender)
  @IsOptional()
  preferredGender?: Gender;

  @IsNumber()
  @IsOptional()
  @Min(18)
  @Max(100)
  preferredAgeMin?: number;

  @IsNumber()
  @IsOptional()
  @Min(18)
  @Max(100)
  preferredAgeMax?: number;

  @IsNumber()
  @IsOptional()
  preferredCityId?: number;
}

