import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ example: 'Class 11' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 13, description: 'Sort order index (e.g. 0 to 14)' })
  @IsInt()
  numericOrder: number;

  @ApiProperty({ example: 'C11' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: 'Science' })
  @IsOptional()
  @IsString()
  stream?: string;

  @ApiPropertyOptional({ example: 'A', description: 'Optional initial section name' })
  @IsOptional()
  @IsString()
  initialSection?: string;

  @ApiPropertyOptional({ example: 40, description: 'Optional initial section capacity' })
  @IsOptional()
  @IsInt()
  initialCapacity?: number;
}

export class CreateSectionDto {
  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsInt()
  capacity?: number;

  @ApiPropertyOptional({ example: 'staff-uuid-here' })
  @IsOptional()
  @IsString()
  classTeacherId?: string;
}
