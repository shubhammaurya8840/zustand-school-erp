import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';

export class ClassSectionAllocationItem {
  @ApiProperty({ example: 'class-uuid-here' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: 'section-uuid-here' })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiPropertyOptional({ example: 'subject-uuid-here' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ example: ['subject-uuid-1', 'subject-uuid-2'] })
  @IsOptional()
  @IsArray()
  subjectIds?: string[];
}

export class AssignTeacherDto {
  @ApiProperty({ example: 'staff-uuid-here' })
  @IsString()
  @IsNotEmpty()
  teacherId: string;

  @ApiProperty({ example: 'session-uuid-here' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiPropertyOptional({ example: 'class-uuid-here' })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ example: 'section-uuid-here' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ example: ['subject-uuid-1', 'subject-uuid-2'] })
  @IsOptional()
  @IsArray()
  subjectIds?: string[];

  @ApiPropertyOptional({ example: 'subject-uuid-1' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Multiple class/section allocations for this teacher in a single request',
    type: [ClassSectionAllocationItem],
  })
  @IsOptional()
  @IsArray()
  allocations?: ClassSectionAllocationItem[];
}

export class UpdateTeacherAssignmentDto {
  @ApiPropertyOptional({ example: 'staff-uuid-here' })
  @IsOptional()
  @IsString()
  teacherId?: string;

  @ApiPropertyOptional({ example: 'session-uuid-here' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ example: 'class-uuid-here' })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ example: 'section-uuid-here' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ example: 'subject-uuid-here' })
  @IsOptional()
  @IsString()
  subjectId?: string;
}
