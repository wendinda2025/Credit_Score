import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClientStatus, KycDocumentType, LanguageCode } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateIndividualClientDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ example: 'Awa Traoré' })
  @IsString()
  displayName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ enum: LanguageCode, default: LanguageCode.FR })
  @IsOptional()
  @IsEnum(LanguageCode)
  language?: LanguageCode;

  @ApiProperty({ example: 'Awa' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Traoré' })
  @IsString()
  lastName!: string;
}

export class CreateGroupClientDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ example: 'Groupe Solidarité 1' })
  @IsString()
  displayName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingDay?: string;
}

export class CreateBusinessClientDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ example: 'Entreprise SAHEL SARL' })
  @IsString()
  displayName!: string;

  @ApiProperty({ example: 'SAHEL SARL' })
  @IsString()
  legalName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationNo?: string;
}

export class UpdateClientStatusDto {
  @ApiProperty({ enum: ClientStatus })
  @IsEnum(ClientStatus)
  status!: ClientStatus;
}

export class AddKycDocumentDto {
  @ApiProperty({ enum: KycDocumentType })
  @IsEnum(KycDocumentType)
  type!: KycDocumentType;

  @ApiProperty()
  @IsString()
  fileName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;
}

