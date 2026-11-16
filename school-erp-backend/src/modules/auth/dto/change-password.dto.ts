import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentSecret123!' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewStrongPassword2026!@' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'teacher@zustand.edu' })
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'BrandNewPassword2026!@' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}

