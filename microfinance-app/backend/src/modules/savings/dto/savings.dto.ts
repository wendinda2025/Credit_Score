import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';
import { SavingsAccountType, SavingsAccountStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateSavingsProductDto {
  @ApiProperty({ description: 'Code unique', example: 'EPARGNE_STD' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Nom du produit', example: 'Épargne Standard' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Nom court', example: 'ES' })
  @IsString()
  @IsNotEmpty()
  shortName: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Devise', default: 'XOF' })
  @IsString()
  currencyCode: string = 'XOF';

  @ApiProperty({
    description: 'Type de compte',
    enum: SavingsAccountType,
  })
  @IsEnum(SavingsAccountType)
  accountType: SavingsAccountType;

  @ApiPropertyOptional({ description: 'Solde minimum d\'ouverture', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOpeningBalance?: number;

  @ApiPropertyOptional({ description: 'Solde minimum pour intérêts', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minBalanceForInterest?: number;

  @ApiPropertyOptional({ description: 'Taux d\'intérêt annuel (%)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  nominalAnnualInterestRate?: number;

  @ApiPropertyOptional({ description: 'Autoriser retraits', default: true })
  @IsOptional()
  allowWithdrawals?: boolean;

  @ApiPropertyOptional({ description: 'Montant minimum de retrait' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minWithdrawalAmount?: number;
}

export class UpdateSavingsProductDto extends PartialType(CreateSavingsProductDto) {}

export class CreateSavingsAccountDto {
  @ApiProperty({ description: 'ID du client' })
  @IsUUID('4')
  clientId: string;

  @ApiProperty({ description: 'ID du produit d\'épargne' })
  @IsUUID('4')
  savingsProductId: string;

  @ApiProperty({ description: 'ID de l\'agence' })
  @IsUUID('4')
  branchId: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID externe' })
  @IsOptional()
  @IsString()
  externalId?: string;
}

export class DepositDto {
  @ApiProperty({ description: 'Date de la transaction' })
  @IsDateString()
  transactionDate: string;

  @ApiProperty({ description: 'Montant du dépôt', example: 50000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ description: 'Mode de paiement' })
  @IsOptional()
  @IsUUID('4')
  paymentTypeId?: string;

  @ApiPropertyOptional({ description: 'Numéro de reçu' })
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class WithdrawDto {
  @ApiProperty({ description: 'Date de la transaction' })
  @IsDateString()
  transactionDate: string;

  @ApiProperty({ description: 'Montant du retrait', example: 25000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ description: 'Mode de paiement' })
  @IsOptional()
  @IsUUID('4')
  paymentTypeId?: string;

  @ApiPropertyOptional({ description: 'Numéro de reçu' })
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class HoldAmountDto {
  @ApiProperty({ description: 'Montant à bloquer' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Motif du blocage' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class SavingsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par statut', enum: SavingsAccountStatus })
  @IsOptional()
  @IsEnum(SavingsAccountStatus)
  status?: SavingsAccountStatus;

  @ApiPropertyOptional({ description: 'Filtrer par client' })
  @IsOptional()
  @IsUUID('4')
  clientId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par agence' })
  @IsOptional()
  @IsUUID('4')
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par produit' })
  @IsOptional()
  @IsUUID('4')
  savingsProductId?: string;
}
