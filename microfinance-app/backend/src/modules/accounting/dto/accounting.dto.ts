import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountType, AccountUsage } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChartOfAccountDto {
  @ApiProperty()
  @IsString()
  accountCode: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiProperty({ enum: AccountUsage })
  @IsEnum(AccountUsage)
  usage: AccountUsage;

  @ApiProperty()
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  manualEntriesAllowed?: boolean;
}

export class JournalEntryLineDto {
  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiProperty()
  @IsEnum(['DEBIT', 'CREDIT'])
  type: 'DEBIT' | 'CREDIT';

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  transactionDate: Date;

  @ApiProperty()
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [JournalEntryLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines: JournalEntryLineDto[];
}

export class AccountBalanceQueryDto {
  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @ApiProperty()
  @IsString()
  @IsOptional()
  accountId?: string;
}

export class TrialBalanceQueryDto {
  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  asOfDate: Date;
}

export class FinancialStatementQueryDto {
  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;
}
