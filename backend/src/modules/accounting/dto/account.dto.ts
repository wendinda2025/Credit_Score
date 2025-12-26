import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

import { AccountingAccountType } from '@prisma/client';

export class CreateAccountingAccountDto {
  @ApiProperty({ example: '1010' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Caisse' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: AccountingAccountType, example: AccountingAccountType.ASSET })
  @IsEnum(AccountingAccountType)
  type!: AccountingAccountType;

  @ApiPropertyOptional({ example: 'XOF' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isHeader?: boolean;
}

