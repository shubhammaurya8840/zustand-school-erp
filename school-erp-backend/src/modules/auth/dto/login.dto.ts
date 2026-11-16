import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@zustand.edu', description: 'Username or registered email address' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ example: 'AdminSecure2026!@', description: 'Account password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

