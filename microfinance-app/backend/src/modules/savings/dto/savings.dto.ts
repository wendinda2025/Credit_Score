import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SavingsProductType, TransactionType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSavingsProductDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  shortName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: SavingsProductType })
  @IsEnum(SavingsProductType)
  productType: SavingsProductType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  interestRate: number; // Taux d'intérêt annuel

  @ApiProperty()
  @IsNumber()
  @Min(0)
  minBalance: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  minOpeningBalance?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  withdrawalFee?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyMaintenanceFee?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxWithdrawalAmount?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxWithdrawalsPerMonth?: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  allowOverdraft?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateSavingsAccountDto {
  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiProperty()
  @IsString()
  savingsProductId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  nominalAnnualInterestRate?: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  activationDate?: Date;
}

export class DepositDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  transactionDate: Date;

  @ApiProperty()
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class WithdrawalDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  transactionDate: Date;

  @ApiProperty()
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class InterestCalculationDto {
  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  calculationDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  postingDate: Date;
}
