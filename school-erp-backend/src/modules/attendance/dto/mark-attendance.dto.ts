import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsEnum, IsDateString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { StudentAttendanceStatus, StaffAttendanceStatus } from '@prisma/client';

export class SingleStudentAttendanceItemDto {
  @ApiProperty({ example: 'student-uuid-here' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ enum: StudentAttendanceStatus, example: StudentAttendanceStatus.PRESENT })
  @IsEnum(StudentAttendanceStatus)
  status: StudentAttendanceStatus;

  @ApiPropertyOptional({ example: 'Medical leave approved' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class MarkClassAttendanceDto {
  @ApiProperty({ example: 'class-uuid-here' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: 'section-uuid-here' })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ example: '2026-04-24' })
  @IsDateString()
  date: string;

  @ApiProperty({ type: [SingleStudentAttendanceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleStudentAttendanceItemDto)
  attendanceList: SingleStudentAttendanceItemDto[];
}

export class SingleStaffAttendanceItemDto {
  @ApiProperty({ example: 'staff-uuid-here' })
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @ApiProperty({ enum: StaffAttendanceStatus, example: StaffAttendanceStatus.PRESENT })
  @IsEnum(StaffAttendanceStatus)
  status: StaffAttendanceStatus;

  @ApiPropertyOptional({ example: 'On duty at CBSE zonal meeting' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class MarkStaffAttendanceDto {
  @ApiProperty({ example: '2026-04-24' })
  @IsDateString()
  date: string;

  @ApiProperty({ type: [SingleStaffAttendanceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleStaffAttendanceItemDto)
  attendanceList: SingleStaffAttendanceItemDto[];
}

