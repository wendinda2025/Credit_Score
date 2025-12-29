import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccountType, AccountUsage } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateGLAccountDto {
  @ApiProperty({ description: 'Code du compte', example: '101000' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Nom du compte', example: 'Caisse' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Type de compte',
    enum: AccountType,
    example: AccountType.ASSET,
  })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiPropertyOptional({
    description: 'Usage du compte',
    enum: AccountUsage,
    default: AccountUsage.DETAIL,
  })
  @IsOptional()
  @IsEnum(AccountUsage)
  usage?: AccountUsage;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ID du compte parent' })
  @IsOptional()
  @IsUUID('4')
  parentId?: string;

  @ApiPropertyOptional({ description: 'Autoriser les écritures manuelles', default: true })
  @IsOptional()
  @IsBoolean()
  manualEntriesAllowed?: boolean;
}

export class UpdateGLAccountDto extends PartialType(CreateGLAccountDto) {}

export class JournalEntryLineDto {
  @ApiProperty({ description: 'ID du compte GL' })
  @IsUUID('4')
  glAccountId: string;

  @ApiProperty({ description: 'Montant au débit', default: 0 })
  @IsNumber()
  @Min(0)
  debitAmount: number = 0;

  @ApiProperty({ description: 'Montant au crédit', default: 0 })
  @IsNumber()
  @Min(0)
  creditAmount: number = 0;

  @ApiPropertyOptional({ description: 'Description de la ligne' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty({ description: 'Date de la transaction' })
  @IsDateString()
  transactionDate: string;

  @ApiProperty({ description: 'Description de l\'écriture' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Type d\'entité (LOAN, SAVINGS, MANUAL, etc.)' })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiPropertyOptional({ description: 'ID de l\'entité' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ description: 'Type de transaction' })
  @IsString()
  @IsNotEmpty()
  transactionType: string;

  @ApiPropertyOptional({ description: 'Devise', default: 'XOF' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiProperty({
    description: 'Lignes d\'écriture (doit être équilibré)',
    type: [JournalEntryLineDto],
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'Une écriture doit avoir au moins 2 lignes' })
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines: JournalEntryLineDto[];
}

export class ReverseJournalEntryDto {
  @ApiProperty({ description: 'Motif de l\'extourne' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class GLAccountQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par type', enum: AccountType })
  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @ApiPropertyOptional({ description: 'Filtrer par usage', enum: AccountUsage })
  @IsOptional()
  @IsEnum(AccountUsage)
  usage?: AccountUsage;

  @ApiPropertyOptional({ description: 'Inclure les comptes inactifs' })
  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean;
}

export class JournalEntryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Date de début' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Filtrer par compte GL' })
  @IsOptional()
  @IsUUID('4')
  glAccountId?: string;

  @ApiPropertyOptional({ description: 'Inclure les écritures extournées' })
  @IsOptional()
  @IsBoolean()
  includeReversed?: boolean;
}

export class TrialBalanceQueryDto {
  @ApiProperty({ description: 'Date du bilan' })
  @IsDateString()
  asOfDate: string;
}

export class ClosePeriodDto {
  @ApiProperty({ description: 'Date de clôture' })
  @IsDateString()
  closingDate: string;

  @ApiPropertyOptional({ description: 'Commentaires' })
  @IsOptional()
  @IsString()
  comments?: string;
}
