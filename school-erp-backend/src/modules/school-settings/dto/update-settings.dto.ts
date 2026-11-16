import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateSchoolSettingsDto {
  @ApiPropertyOptional({ example: 'Zustand Public School' })
  @IsOptional()
  @IsString()
  schoolName?: string;

  @ApiPropertyOptional({ example: 'Knowledge | Character | Bright Future' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ example: '/school-logo.svg' })
  @IsOptional()
  @IsString()
  logoPath?: string;

  @ApiPropertyOptional({ example: '108 Academic Enclave, Vidya Nagar, New Delhi - 110001' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '+91 (011) 2345-6789' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'info@zustandpublicschool.edu.in' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'https://zustandpublicschool.edu.in' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: 'CBSE-AFF-2026/89432' })
  @IsOptional()
  @IsString()
  affiliationNo?: string;

  @ApiPropertyOptional({ example: 'session-uuid-here' })
  @IsOptional()
  @IsString()
  currentSessionId?: string;

  @ApiPropertyOptional({ example: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] })
  @IsOptional()
  @IsArray()
  workingDays?: string[];
}

