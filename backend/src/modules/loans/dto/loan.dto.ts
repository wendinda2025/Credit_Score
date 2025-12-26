import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateLoanDto {
  @ApiProperty()
  @IsString()
  clientId!: string;

  @ApiProperty()
  @IsString()
  loanProductId!: string;

  @ApiProperty({ example: '500000.00' })
  @IsString()
  principal!: string;

  @ApiPropertyOptional({ example: '2025-12-30' })
  @IsOptional()
  @IsDateString()
  expectedDisbursementAt?: string;

  @ApiPropertyOptional({ example: '2026-01-30' })
  @IsOptional()
  @IsDateString()
  firstRepaymentDate?: string;
}

export class ApproveLoanDto {
  @ApiPropertyOptional({ example: '2025-12-26' })
  @IsOptional()
  @IsDateString()
  approvedAt?: string;
}

export class DisburseLoanDto {
  @ApiPropertyOptional({ example: '2025-12-26' })
  @IsOptional()
  @IsDateString()
  disbursedAt?: string;

  @ApiPropertyOptional({ example: '2026-01-30' })
  @IsOptional()
  @IsDateString()
  firstRepaymentDate?: string;
}

export class RepayLoanDto {
  @ApiProperty({ example: '100000.00' })
  @IsString()
  amount!: string;

  @ApiPropertyOptional({ example: '2026-02-01' })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;
}

