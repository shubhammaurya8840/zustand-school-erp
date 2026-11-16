import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsInt } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({ example: 'Physics' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'PHY-11' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: 'THEORY' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;
}

export class AssignSubjectToClassDto {
  @ApiProperty({ example: 'class-uuid-here' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: 'subject-uuid-here' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiPropertyOptional({ example: 'staff-uuid-here' })
  @IsOptional()
  @IsString()
  teacherId?: string;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsInt()
  periodsPerWeek?: number;
}

