import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsDecimal,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SavingsAccountStatus } from '@prisma/client';

export class CreateSavingsProductDto {
  @ApiProperty()
  @IsUUID()
  organizationId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: 'number', required: false })
  @Type(() => Number)
  @IsDecimal()
  @IsOptional()
  minBalance?: number;

  @ApiProperty({ type: 'number' })
  @Type(() => Number)
  @IsDecimal()
  interestRate: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  interestCalculation?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  interestPaymentFrequency?: string;
}

export class CreateSavingsAccountDto {
  @ApiProperty()
  @IsUUID()
  organizationId: string;

  @ApiProperty()
  @IsUUID()
  officeId: string;

  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty()
  @IsUUID()
  savingsProductId: string;
}

export class SavingsTransactionDto {
  @ApiProperty({ type: 'number' })
  @Type(() => Number)
  @IsDecimal()
  amount: number;

  @ApiProperty({ enum: ['DEPOSIT', 'WITHDRAWAL'] })
  @IsEnum(['DEPOSIT', 'WITHDRAWAL'])
  transactionType: 'DEPOSIT' | 'WITHDRAWAL';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  referenceNumber?: string;
}
