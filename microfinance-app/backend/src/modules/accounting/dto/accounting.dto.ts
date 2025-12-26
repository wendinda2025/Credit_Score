import { IsString, IsEnum, IsNumber, IsDateString, IsOptional } from 'class-validator';

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateAccountDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(AccountType)
  type: string;
}

export class CreateJournalEntryDto {
  @IsString()
  description: string;

  @IsDateString()
  entryDate: string;

  @IsString()
  debitAccountId: string;

  @IsNumber()
  debitAmount: number;

  @IsString()
  creditAccountId: string;

  @IsNumber()
  creditAmount: number;

  @IsOptional()
  @IsString()
  transactionId?: string;
}
