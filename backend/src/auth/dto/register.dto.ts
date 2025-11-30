import { IsEmail, IsString, IsNotEmpty, MaxLength, IsBoolean, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(50)
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsBoolean()
  @IsOptional()
  acceptTerms?: boolean;

  @IsBoolean()
  @IsOptional()
  acceptPrivacy?: boolean;
}

