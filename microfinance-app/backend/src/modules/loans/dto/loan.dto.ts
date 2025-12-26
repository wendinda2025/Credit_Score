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
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  LoanStatus,
  InterestMethod,
  AmortizationType,
  RepaymentFrequency,
} from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

// ============================================
// Produits de prêts
// ============================================

export class CreateLoanProductDto {
  @ApiProperty({ description: 'Code unique du produit', example: 'PRET_IND_01' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Nom du produit', example: 'Prêt Individuel Standard' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Nom court', example: 'PIS' })
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

  // Montants
  @ApiProperty({ description: 'Montant minimum', example: 50000 })
  @IsNumber()
  @IsPositive()
  minPrincipal: number;

  @ApiProperty({ description: 'Montant maximum', example: 5000000 })
  @IsNumber()
  @IsPositive()
  maxPrincipal: number;

  @ApiProperty({ description: 'Montant par défaut', example: 100000 })
  @IsNumber()
  @IsPositive()
  defaultPrincipal: number;

  // Taux d'intérêt
  @ApiProperty({ description: 'Taux minimum (%)', example: 1 })
  @IsNumber()
  @Min(0)
  minInterestRate: number;

  @ApiProperty({ description: 'Taux maximum (%)', example: 3 })
  @IsNumber()
  @Min(0)
  maxInterestRate: number;

  @ApiProperty({ description: 'Taux par défaut (%)', example: 2 })
  @IsNumber()
  @Min(0)
  defaultInterestRate: number;

  @ApiProperty({
    description: 'Méthode de calcul des intérêts',
    enum: InterestMethod,
    example: InterestMethod.DECLINING_BALANCE,
  })
  @IsEnum(InterestMethod)
  interestMethod: InterestMethod;

  // Durée
  @ApiProperty({ description: 'Durée minimum (mois)', example: 1 })
  @IsInt()
  @IsPositive()
  minTerm: number;

  @ApiProperty({ description: 'Durée maximum (mois)', example: 24 })
  @IsInt()
  @IsPositive()
  maxTerm: number;

  @ApiProperty({ description: 'Durée par défaut (mois)', example: 12 })
  @IsInt()
  @IsPositive()
  defaultTerm: number;

  @ApiProperty({
    description: 'Fréquence de remboursement',
    enum: RepaymentFrequency,
    example: RepaymentFrequency.MONTHLY,
  })
  @IsEnum(RepaymentFrequency)
  repaymentFrequency: RepaymentFrequency;

  @ApiProperty({
    description: 'Type d\'amortissement',
    enum: AmortizationType,
    example: AmortizationType.EQUAL_INSTALLMENTS,
  })
  @IsEnum(AmortizationType)
  amortizationType: AmortizationType;

  // Frais
  @ApiPropertyOptional({ description: 'Type de frais de dossier', default: 'PERCENTAGE' })
  @IsOptional()
  @IsString()
  processingFeeType?: string;

  @ApiPropertyOptional({ description: 'Montant frais de dossier', default: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  processingFeeAmount?: number;

  // Pénalités
  @ApiPropertyOptional({ description: 'Type de pénalité', default: 'PERCENTAGE' })
  @IsOptional()
  @IsString()
  penaltyType?: string;

  @ApiPropertyOptional({ description: 'Taux de pénalité', default: 0.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  penaltyRate?: number;

  @ApiPropertyOptional({ description: 'Jours de grâce avant pénalité', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  gracePeriodDays?: number;

  // Configuration
  @ApiPropertyOptional({ description: 'Autoriser paiements partiels', default: true })
  @IsOptional()
  allowPartialPayments?: boolean;

  @ApiPropertyOptional({ description: 'Autoriser remboursement anticipé', default: true })
  @IsOptional()
  allowPrepayments?: boolean;

  @ApiPropertyOptional({ description: 'Garantie requise', default: false })
  @IsOptional()
  requiresCollateral?: boolean;

  @ApiPropertyOptional({ description: 'Garant requis', default: false })
  @IsOptional()
  requiresGuarantor?: boolean;
}

export class UpdateLoanProductDto extends PartialType(CreateLoanProductDto) {}

// ============================================
// Prêts
// ============================================

export class CreateLoanDto {
  @ApiProperty({ description: 'ID du client' })
  @IsUUID('4')
  clientId: string;

  @ApiProperty({ description: 'ID du produit de prêt' })
  @IsUUID('4')
  loanProductId: string;

  @ApiProperty({ description: 'ID de l\'agence' })
  @IsUUID('4')
  branchId: string;

  @ApiPropertyOptional({ description: 'ID de l\'agent de crédit' })
  @IsOptional()
  @IsUUID('4')
  loanOfficerId?: string;

  @ApiProperty({ description: 'Montant demandé', example: 500000 })
  @IsNumber()
  @IsPositive()
  principalAmount: number;

  @ApiProperty({ description: 'Nombre d\'échéances', example: 12 })
  @IsInt()
  @IsPositive()
  numberOfRepayments: number;

  @ApiProperty({ description: 'Taux d\'intérêt mensuel (%)', example: 2 })
  @IsNumber()
  @Min(0)
  interestRate: number;

  @ApiPropertyOptional({ description: 'Date de décaissement prévue' })
  @IsOptional()
  @IsDateString()
  expectedDisbursementDate?: string;

  @ApiPropertyOptional({ description: 'Objet du prêt', example: 'Fonds de roulement' })
  @IsOptional()
  @IsString()
  loanPurpose?: string;

  @ApiPropertyOptional({ description: 'Période de grâce principal (mois)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  principalGracePeriod?: number;

  @ApiPropertyOptional({ description: 'Période de grâce intérêts (mois)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  interestGracePeriod?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID externe' })
  @IsOptional()
  @IsString()
  externalId?: string;
}

export class ApproveLoanDto {
  @ApiPropertyOptional({ description: 'Montant approuvé (si différent du demandé)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  approvedPrincipal?: number;

  @ApiPropertyOptional({ description: 'Notes d\'approbation' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectLoanDto {
  @ApiProperty({ description: 'Motif du rejet' })
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}

export class DisburseLoanDto {
  @ApiProperty({ description: 'Date de décaissement' })
  @IsDateString()
  disbursementDate: string;

  @ApiPropertyOptional({ description: 'Montant décaissé (si différent de l\'approuvé)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  disbursedAmount?: number;

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

export class LoanRepaymentDto {
  @ApiProperty({ description: 'Date du remboursement' })
  @IsDateString()
  transactionDate: string;

  @ApiProperty({ description: 'Montant du remboursement', example: 50000 })
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

export class CollateralDto {
  @ApiProperty({ description: 'Type de garantie', example: 'Véhicule' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Valeur estimée', example: 1000000 })
  @IsNumber()
  @IsPositive()
  value: number;
}

export class GuarantorDto {
  @ApiProperty({ description: 'Prénom' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Nom' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Relation avec l\'emprunteur' })
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({ description: 'Téléphone' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Adresse' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Montant garanti', example: 500000 })
  @IsNumber()
  @IsPositive()
  guaranteeAmount: number;
}

export class LoanQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par statut', enum: LoanStatus })
  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

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
  loanProductId?: string;

  @ApiPropertyOptional({ description: 'Prêts en retard uniquement' })
  @IsOptional()
  inArrears?: boolean;
}

export class RescheduleLoanDto {
  @ApiProperty({ description: 'Date de début du nouveau calendrier' })
  @IsDateString()
  rescheduleFromDate: string;

  @ApiPropertyOptional({ description: 'Nouveau taux d\'intérêt' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  newInterestRate?: number;

  @ApiPropertyOptional({ description: 'Nouvelles échéances' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  newNumberOfRepayments?: number;

  @ApiProperty({ description: 'Motif du rééchelonnement' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
