import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateParentDto {
  @ApiProperty({ example: 'Rajesh Sharma' })
  @IsString()
  @IsNotEmpty()
  fatherName: string;

  @ApiPropertyOptional({ example: 'Sunita Sharma' })
  @IsOptional()
  @IsString()
  motherName?: string;

  @ApiPropertyOptional({ example: 'Guardian Name' })
  @IsOptional()
  @IsString()
  guardianName?: string;

  @ApiProperty({ example: '+91 98765 12345' })
  @IsString()
  @IsNotEmpty()
  primaryPhone: string;

  @ApiPropertyOptional({ example: '+91 98765 54321' })
  @IsOptional()
  @IsString()
  alternatePhone?: string;

  @ApiProperty({ example: 'parent.sharma@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiProperty({ example: 'Flat 402, Royal Palms, New Delhi' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: '+91 98765 99999' })
  @IsString()
  @IsNotEmpty()
  emergencyContact: string;

  @ApiPropertyOptional({ example: 'ParentPass2026!@' })
  @IsOptional()
  @IsString()
  temporaryPassword?: string;
}

