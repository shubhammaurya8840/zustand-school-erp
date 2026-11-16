import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class CreateStudentDto {
  @ApiProperty({ example: 'ADM-2026-0105' })
  @IsString()
  @IsNotEmpty()
  admissionNo: string;

  @ApiProperty({ example: 12 })
  @IsInt()
  rollNo: number;

  @ApiProperty({ example: 'Aarav' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Sharma' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '2010-08-15' })
  @IsDateString()
  dob: string;

  @ApiProperty({ example: 'Male' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiPropertyOptional({ example: 'B+' })
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiProperty({ example: 'Flat 402, Royal Palms, New Delhi' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: '+91 98765 12345' })
  @IsString()
  @IsNotEmpty()
  emergencyContact: string;

  @ApiPropertyOptional({ example: '/uploads/students/aarav.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiProperty({ example: 'class-uuid-here' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: 'section-uuid-here' })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ example: 'parent-uuid-here' })
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @ApiPropertyOptional({ example: 'StudentPass2026!@' })
  @IsOptional()
  @IsString()
  studentPassword?: string;
}

export class UpdateStudentDto {
  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsInt()
  rollNo?: number;

  @ApiPropertyOptional({ example: 'Aarav' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Flat 505, Palm Heights, New Delhi' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '2012-04-15' })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({ example: 'Male' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: 'O+' })
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional({ example: '+91 98765 00000' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ enum: StudentStatus, example: StudentStatus.ACTIVE })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiPropertyOptional({ example: 'class-uuid-here' })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ example: 'section-uuid-here' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ example: 45000 })
  @IsOptional()
  totalFee?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  discountAmount?: number;
}

