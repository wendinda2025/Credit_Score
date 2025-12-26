import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class OpenSavingsAccountDto {
  @ApiProperty()
  @IsString()
  clientId!: string;

  @ApiProperty()
  @IsString()
  savingsProductId!: string;
}

export class SavingsTransactionDto {
  @ApiProperty({ example: '20000.00' })
  @IsString()
  amount!: string;

  @ApiPropertyOptional({ example: '2025-12-26' })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;
}

