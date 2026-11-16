import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CreateAcademicSessionDto {
  @ApiProperty({ example: '2026-2027' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2027-03-31T23:59:59.999Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}

