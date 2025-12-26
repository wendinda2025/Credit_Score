import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsDecimal,
  IsInt,
  IsEnum,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  LoanStatus,
  RepaymentFrequency,
  InterestCalculationMethod,
} from '@prisma/client';

export class CreateLoanProductDto {
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

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: 'number' })
  @Type(() => Number)
  @IsDecimal()
  minLoanAmount: number;

  @ApiProperty({ type: 'number' })
  @Type(() => Number)
  @IsDecimal()
  maxLoanAmount: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  minLoanTerm: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  maxLoanTerm: number;

  @ApiProperty({ type: 'number' })
  @Type(() => Number)
  @IsDecimal()
  interestRate: number;

  @ApiProperty({ enum: InterestCalculationMethod })
  @IsEnum(InterestCalculationMethod)
  interestCalculationMethod: InterestCalculationMethod;

  @ApiProperty({ enum: RepaymentFrequency })
  @IsEnum(RepaymentFrequency)
  repaymentFrequency: RepaymentFrequency;

  @ApiProperty({ type: 'number', required: false })
  @Type(() => Number)
  @IsDecimal()
  @IsOptional()
  processingFee?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  processingFeeType?: string;

  @ApiProperty({ type: 'number', required: false })
  @Type(() => Number)
  @IsDecimal()
  @IsOptional()
  latePaymentFee?: number;

  @ApiProperty({ type: 'number', required: false })
  @Type(() => Number)
  @IsDecimal()
  @IsOptional()
  penaltyRate?: number;
}

export class CreateLoanDto {
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
  loanProductId: string;

  @ApiProperty({ type: 'number' })
  @Type(() => Number)
  @IsDecimal()
  principalAmount: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  loanTerm: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  firstRepaymentDate?: string;
}

export class ApproveLoanDto {
  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  approvedDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  disbursedDate?: string;
}

export class MakeRepaymentDto {
  @ApiProperty({ type: 'number' })
  @Type(() => Number)
  @IsDecimal()
  principalPaid: number;

  @ApiProperty({ type: 'number' })
  @Type(() => Number)
  @IsDecimal()
  interestPaid: number;

  @ApiProperty({ type: 'number', required: false })
  @Type(() => Number)
  @IsDecimal()
  @IsOptional()
  feesPaid?: number;

  @ApiProperty({ type: 'number', required: false })
  @Type(() => Number)
  @IsDecimal()
  @IsOptional()
  penaltyPaid?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  receiptNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
