import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class CreateStaffDto {
  @ApiProperty({ example: 'EMP-2026-088' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ example: 'Vandana' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Verma' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ enum: Role, example: Role.TEACHER })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ example: 'PGT Computer Science' })
  @IsString()
  @IsNotEmpty()
  designation: string;

  @ApiProperty({ example: 'MCA, B.Ed' })
  @IsString()
  @IsNotEmpty()
  qualification: string;

  @ApiProperty({ example: '+91 98111 22233' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'vandana.verma@zustandpublicschool.edu.in' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '1988-06-15' })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  joiningDate: string;

  @ApiProperty({ example: 'Computer Science' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiPropertyOptional({ example: 'StaffPass2026!@' })
  @IsOptional()
  @IsString()
  temporaryPassword?: string;
}

