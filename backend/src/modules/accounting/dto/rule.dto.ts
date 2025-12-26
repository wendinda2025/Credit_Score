import { ApiProperty } from '@nestjs/swagger';
import { AccountingComponent, AccountingEventType, JournalLineType } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AccountingRuleLineDto {
  @ApiProperty({ enum: JournalLineType, example: JournalLineType.DEBIT })
  @IsEnum(JournalLineType)
  entryType!: JournalLineType;

  @ApiProperty({ enum: AccountingComponent, example: AccountingComponent.TOTAL })
  @IsEnum(AccountingComponent)
  component!: AccountingComponent;

  @ApiProperty()
  @IsString()
  accountId!: string;
}

export class UpsertAccountingRuleDto {
  @ApiProperty({ enum: AccountingEventType })
  @IsEnum(AccountingEventType)
  eventType!: AccountingEventType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [AccountingRuleLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountingRuleLineDto)
  lines!: AccountingRuleLineDto[];
}

