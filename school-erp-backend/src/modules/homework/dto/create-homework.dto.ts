import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min } from 'class-validator';
import { HomeworkTargetType } from '@prisma/client';

export class CreateHomeworkDto {
  @ApiProperty({ example: 'Quadratic Equations Exercise 4.2' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Complete exercises 1 through 15 from page 88.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'class-uuid-here' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: 'section-uuid-here' })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ example: 'subject-uuid-here' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiPropertyOptional({ enum: HomeworkTargetType, default: HomeworkTargetType.CLASS_SECTION })
  @IsOptional()
  @IsEnum(HomeworkTargetType)
  targetType?: HomeworkTargetType;

  @ApiPropertyOptional({ example: 'student-uuid-here', description: 'Required only when targetType is INDIVIDUAL_STUDENT' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({ example: '2026-11-05T23:59:59.000Z' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: 'https://example.com/homework-sheet.pdf' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class UpdateHomeworkDto {
  @ApiPropertyOptional({ example: 'Updated title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated instructions' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2026-11-08T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isArchived?: boolean;
}

export class SubmitHomeworkDto {
  @ApiPropertyOptional({ example: 'Here are the solved steps and final answers for problem 1-15.' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'https://example.com/aarav_solution.pdf' })
  @IsOptional()
  @IsString()
  fileUrl?: string;
}

export class EvaluateSubmissionDto {
  @ApiPropertyOptional({ example: 9.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  marks?: number;

  @ApiPropertyOptional({ example: 'Excellent derivation, keep it up.' })
  @IsOptional()
  @IsString()
  feedback?: string;
}

