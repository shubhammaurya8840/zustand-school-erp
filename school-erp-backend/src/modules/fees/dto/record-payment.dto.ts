import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsPositive, IsOptional } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class RecordFeePaymentDto {
  @ApiProperty({ example: 'student-uuid-here' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ example: 15000.0, description: 'Amount collected in INR' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.UPI })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'UPI-TXN-98432109' })
  @IsOptional()
  @IsString()
  referenceNo?: string;

  @ApiPropertyOptional({ example: 'Term 1 Tuition fee collection' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ReversePaymentDto {
  @ApiProperty({ example: 'Bounced cheque / duplicate manual entry error' })
  @IsString()
  @IsNotEmpty()
  reversalReason: string;
}

export class CreateFeeStructureDto {
  @ApiProperty({ example: 'session-uuid-here' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: 'class-uuid-here' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: 'feehead-uuid-here' })
  @IsString()
  @IsNotEmpty()
  feeHeadId: string;

  @ApiProperty({ example: 18000.0 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: '2026-07-15' })
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({ example: 'QUARTERLY' })
  @IsString()
  @IsNotEmpty()
  frequency: string;
}

