import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JournalLineType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';

export class JournalLineInputDto {
  @ApiProperty()
  @IsString()
  accountId!: string;

  @ApiProperty({ enum: JournalLineType })
  @IsEnum(JournalLineType)
  entryType!: JournalLineType;

  @ApiProperty({ example: '10000.00' })
  @IsString()
  amount!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memo?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty({ example: '2025-12-26' })
  @IsDateString()
  transactionDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiProperty({ type: [JournalLineInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineInputDto)
  lines!: JournalLineInputDto[];
}

