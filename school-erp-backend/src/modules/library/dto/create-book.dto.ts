import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';

export class CreateBookCategoryDto {
  @ApiProperty({ example: 'Science Fiction' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Novels, speculative fiction and futuristic literature' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateBookCategoryDto {
  @ApiPropertyOptional({ example: 'Advanced Robotics' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateBookDto {
  @ApiProperty({ example: 'The C Programming Language' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'category-uuid-here', description: 'Database ID of the BookCategory' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 5, description: 'Total physical copies acquired' })
  @IsInt()
  @Min(1)
  totalCopies: number;

  @ApiPropertyOptional({ example: 'Shelf CS-04' })
  @IsOptional()
  @IsString()
  rackLocation?: string;

  // Optional fields for backward compatibility and metadata
  @ApiPropertyOptional({ example: '978-0131103627' })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiPropertyOptional({ example: 'Brian W. Kernighan, Dennis M. Ritchie' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ example: 'Prentice Hall' })
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'BC-2026-9041' })
  @IsOptional()
  @IsString()
  barcode?: string;
}

export class UpdateBookDto {
  @ApiPropertyOptional({ example: 'The C Programming Language (2nd Ed)' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'category-uuid-here' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalCopies?: number;

  @ApiPropertyOptional({ example: 'Shelf CS-05' })
  @IsOptional()
  @IsString()
  rackLocation?: string;

  @ApiPropertyOptional({ example: '978-0131103627' })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiPropertyOptional({ example: 'Brian W. Kernighan' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ example: 'Prentice Hall' })
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class IssueBookDto {
  @ApiProperty({ example: 'book-uuid-here' })
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @ApiPropertyOptional({ example: 'student-uuid-here' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ example: 'staff-uuid-here' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiProperty({ example: 14, description: 'Number of loan days (standard 14 days)' })
  @IsInt()
  @Min(1)
  loanDays: number;
}

export class ReturnBookDto {
  @ApiPropertyOptional({ example: 50.0, description: 'Overdue fine assessed (INR)' })
  @IsOptional()
  fineAmount?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  finePaid?: boolean;

  @ApiPropertyOptional({ example: 'Returned in good condition' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
