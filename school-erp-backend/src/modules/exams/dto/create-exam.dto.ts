import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsDateString, IsNumber, IsPositive, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ExamType } from '@prisma/client';

export class CreateExamDto {
  @ApiProperty({ example: 'session-uuid-here' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: 'Mid-Term Examination 2026' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ExamType, example: ExamType.HALF_YEARLY })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const v = value.toUpperCase().trim();
      if (v === 'MID_TERM') return ExamType.HALF_YEARLY;
      if (v === 'FINAL') return ExamType.ANNUAL;
      if (v === 'PERIODIC_TEST') return ExamType.UNIT_TEST;
      return v;
    }
    return value;
  })
  @IsEnum(ExamType)
  type: ExamType;

  @ApiProperty({ example: '2026-09-15' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-09-30' })
  @IsDateString()
  endDate: string;
}

export class CreateExamScheduleDto {
  @ApiProperty({ example: 'exam-uuid-here' })
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiProperty({ example: 'class-uuid-here' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: 'subject-uuid-here' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: '2026-09-16' })
  @IsDateString()
  examDate: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: 100.0 })
  @IsNumber()
  @IsPositive()
  maxMarks: number;

  @ApiProperty({ example: 33.0 })
  @IsNumber()
  @IsPositive()
  passMarks: number;
}

export class StudentMarkItemDto {
  @ApiProperty({ example: 'student-uuid-here' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ example: 85.5 })
  @IsNumber()
  marksObtained: number;

  @ApiPropertyOptional({ example: 'Excellent performance' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class RecordMarksDto {
  @ApiProperty({ example: 'schedule-uuid-here' })
  @IsString()
  @IsNotEmpty()
  examScheduleId: string;

  @ApiProperty({ type: [StudentMarkItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentMarkItemDto)
  marksList: StudentMarkItemDto[];
}

