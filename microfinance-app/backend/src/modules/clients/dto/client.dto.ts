import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsEmail,
  IsDateString,
  IsNumber,
  IsPositive,
  ValidateIf,
  IsPhoneNumber,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ClientType, ClientStatus, Gender, MaritalStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateClientDto {
  @ApiProperty({
    description: 'Type de client',
    enum: ClientType,
    example: ClientType.INDIVIDUAL,
  })
  @IsEnum(ClientType)
  clientType: ClientType;

  @ApiProperty({
    description: 'ID de l\'agence',
  })
  @IsUUID('4')
  branchId: string;

  // Champs pour individu
  @ApiPropertyOptional({
    description: 'Prénom (requis pour individu)',
    example: 'Amadou',
  })
  @ValidateIf((o) => o.clientType === ClientType.INDIVIDUAL)
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est requis pour un individu' })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Nom de famille (requis pour individu)',
    example: 'Diallo',
  })
  @ValidateIf((o) => o.clientType === ClientType.INDIVIDUAL)
  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis pour un individu' })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Deuxième prénom',
  })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional({
    description: 'Genre',
    enum: Gender,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Date de naissance',
    example: '1985-06-15',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Lieu de naissance',
  })
  @IsOptional()
  @IsString()
  placeOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Nationalité',
    default: 'SN',
  })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({
    description: 'Statut matrimonial',
    enum: MaritalStatus,
  })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  // Champs pour entreprise/groupe
  @ApiPropertyOptional({
    description: 'Nom de l\'entreprise/groupe (requis pour enterprise/group)',
    example: 'Groupe Solidaire Femmes de Dakar',
  })
  @ValidateIf((o) => o.clientType === ClientType.ENTERPRISE || o.clientType === ClientType.GROUP)
  @IsString()
  @IsNotEmpty({ message: 'Le nom de l\'entreprise/groupe est requis' })
  businessName?: string;

  @ApiPropertyOptional({
    description: 'Numéro d\'enregistrement',
  })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({
    description: 'Date de création',
  })
  @IsOptional()
  @IsDateString()
  dateOfIncorporation?: string;

  // Contact
  @ApiProperty({
    description: 'Numéro de téléphone principal',
    example: '+221771234567',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le numéro de téléphone est requis' })
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone alternatif',
  })
  @IsOptional()
  @IsString()
  alternatePhone?: string;

  @ApiPropertyOptional({
    description: 'Email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  // Adresse
  @ApiPropertyOptional({
    description: 'Adresse ligne 1',
  })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional({
    description: 'Adresse ligne 2',
  })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({
    description: 'Ville',
    example: 'Dakar',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Région',
  })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({
    description: 'Code postal',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Pays',
    default: 'SN',
  })
  @IsOptional()
  @IsString()
  country?: string;

  // Profession
  @ApiPropertyOptional({
    description: 'Profession/Activité',
    example: 'Commerçant',
  })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({
    description: 'Employeur',
  })
  @IsOptional()
  @IsString()
  employer?: string;

  @ApiPropertyOptional({
    description: 'Revenu mensuel',
    example: 150000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  monthlyIncome?: number;

  @ApiPropertyOptional({
    description: 'Source de revenu',
  })
  @IsOptional()
  @IsString()
  incomeSource?: string;

  // KYC
  @ApiPropertyOptional({
    description: 'Type de pièce d\'identité',
    example: 'CNI',
  })
  @IsOptional()
  @IsString()
  idType?: string;

  @ApiPropertyOptional({
    description: 'Numéro de pièce d\'identité',
  })
  @IsOptional()
  @IsString()
  idNumber?: string;

  @ApiPropertyOptional({
    description: 'Date d\'expiration de la pièce',
  })
  @IsOptional()
  @IsDateString()
  idExpiryDate?: string;

  @ApiPropertyOptional({
    description: 'Date de délivrance de la pièce',
  })
  @IsOptional()
  @IsDateString()
  idIssuedDate?: string;

  @ApiPropertyOptional({
    description: 'Lieu de délivrance',
  })
  @IsOptional()
  @IsString()
  idIssuedPlace?: string;

  @ApiPropertyOptional({
    description: 'ID externe (système tiers)',
  })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional({
    description: 'Notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateClientDto extends PartialType(CreateClientDto) {}

export class ClientQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrer par type de client',
    enum: ClientType,
  })
  @IsOptional()
  @IsEnum(ClientType)
  clientType?: ClientType;

  @ApiPropertyOptional({
    description: 'Filtrer par statut',
    enum: ClientStatus,
  })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @ApiPropertyOptional({
    description: 'Filtrer par agence',
  })
  @IsOptional()
  @IsUUID('4')
  branchId?: string;
}

export class ChangeClientStatusDto {
  @ApiProperty({
    description: 'Nouveau statut',
    enum: [ClientStatus.ACTIVE, ClientStatus.SUSPENDED, ClientStatus.CLOSED, ClientStatus.REJECTED],
  })
  @IsEnum(ClientStatus)
  status: ClientStatus;

  @ApiPropertyOptional({
    description: 'Motif du changement',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AddGroupMemberDto {
  @ApiProperty({
    description: 'ID du client à ajouter au groupe',
  })
  @IsUUID('4')
  clientId: string;

  @ApiPropertyOptional({
    description: 'Est-ce le leader du groupe?',
    default: false,
  })
  @IsOptional()
  isLeader?: boolean;
}

export class FamilyMemberDto {
  @ApiProperty({
    description: 'Relation avec le client',
    example: 'Époux',
  })
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({
    description: 'Prénom',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Nom',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({
    description: 'Date de naissance',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Téléphone',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Est une personne à charge?',
    default: false,
  })
  @IsOptional()
  isDependent?: boolean;
}
