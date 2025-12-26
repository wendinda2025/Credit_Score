import { IsString, IsNumber, IsEnum, IsOptional, Min, Max, IsDateString } from 'class-validator';
import { InterestType, Periodicity } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateLoanProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  minAmount: number;

  @IsOptional()
  @IsNumber()
  maxAmount?: number;

  @IsNumber()
  minInterest: number;

  @IsOptional()
  @IsNumber()
  maxInterest?: number;

  @IsEnum(InterestType)
  interestType: InterestType;

  @IsEnum(Periodicity)
  periodicity: Periodicity;
}

export class CreateLoanApplicationDto {
  @IsString()
  clientId: string;

  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  interestRate: number;

  @IsNumber()
  @Min(1)
  duration: number; // Number of periods
}

export class RepayLoanDto {
  @IsNumber()
  @Min(0)
  amount: number;
}
