import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsEnum, Min, Max } from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class CreateTimetablePeriodDto {
  @ApiProperty({ example: 'session-uuid-here' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

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

  @ApiProperty({ example: 'staff-uuid-here' })
  @IsString()
  @IsNotEmpty()
  teacherId: string;

  @ApiProperty({ enum: DayOfWeek, example: DayOfWeek.MONDAY })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(10)
  periodNo: number;

  @ApiProperty({ example: '08:30' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '09:15' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: 'Room 204' })
  @IsString()
  @IsNotEmpty()
  roomNo: string;
}

