import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoanInterestType, RepaymentFrequency } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateLoanProductDto {
  @ApiProperty({ example: 'Prêt commerce - Mensuel' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'XOF', default: 'XOF' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiProperty({ enum: LoanInterestType, default: LoanInterestType.DECLINING_BALANCE })
  @IsEnum(LoanInterestType)
  interestType!: LoanInterestType;

  @ApiProperty({ example: '0.24', description: 'Taux annuel (ex: 0.24 pour 24%)' })
  @IsString()
  interestRateAnnualPercent!: string;

  @ApiProperty({ enum: RepaymentFrequency, default: RepaymentFrequency.MONTHLY })
  @IsEnum(RepaymentFrequency)
  repaymentFrequency!: RepaymentFrequency;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  repaymentEvery?: number;

  @ApiProperty({ example: 6 })
  @IsInt()
  @Min(1)
  numberOfRepayments!: number;

  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @IsString()
  disbursementFee?: string;
}

