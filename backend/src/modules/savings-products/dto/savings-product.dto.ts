import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateSavingsProductDto {
  @ApiProperty({ example: 'Épargne ordinaire' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'XOF', default: 'XOF' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiPropertyOptional({ example: '3.0', description: 'Taux annuel en % (optionnel)' })
  @IsOptional()
  @IsString()
  interestRateAnnualPercent?: string;
}

