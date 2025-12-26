import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsDecimal,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AccountType, TransactionType } from '@prisma/client';

export class CreateChartOfAccountDto {
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

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty()
  @IsUUID()
  organizationId: string;

  @ApiProperty()
  @IsDateString()
  entryDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsUUID()
  debitAccountId: string;

  @ApiProperty()
  @IsUUID()
  creditAccountId: string;

  @ApiProperty({ type: 'number' })
  @Type(() => Number)
  @IsDecimal()
  amount: number;

  @ApiProperty({ enum: TransactionType, required: false })
  @IsEnum(TransactionType)
  @IsOptional()
  transactionType?: TransactionType;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  referenceId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  referenceType?: string;
}
