import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { NoticeCategory, NoticePriority, TargetAudience } from '@prisma/client';

export class CreateNoticeDto {
  @ApiProperty({ example: 'Annual Sports Day 2026 Schedule & Guidelines' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'The Annual Sports Meet will be held on December 15th at the main school stadium...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: NoticeCategory, example: NoticeCategory.EVENT })
  @IsEnum(NoticeCategory)
  category: NoticeCategory;

  @ApiProperty({ enum: NoticePriority, example: NoticePriority.HIGH })
  @IsEnum(NoticePriority)
  priority: NoticePriority;

  @ApiProperty({ enum: TargetAudience, example: TargetAudience.ALL })
  @IsEnum(TargetAudience)
  targetAudience: TargetAudience;

  @ApiPropertyOptional({ example: 'class-uuid-here' })
  @IsOptional()
  @IsString()
  targetClassId?: string;

  @ApiPropertyOptional({ example: 'section-uuid-here' })
  @IsOptional()
  @IsString()
  targetSectionId?: string;

  @ApiPropertyOptional({ example: '2026-12-20' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

