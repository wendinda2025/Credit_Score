import { IsString, IsDate, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum ReportType {
  PORTFOLIO_QUALITY = 'PORTFOLIO_QUALITY',
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  REPAYMENT_COLLECTION = 'REPAYMENT_COLLECTION',
  SAVINGS_SUMMARY = 'SAVINGS_SUMMARY',
  CLIENT_DEMOGRAPHICS = 'CLIENT_DEMOGRAPHICS',
  FINANCIAL_PERFORMANCE = 'FINANCIAL_PERFORMANCE',
}

export enum ReportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  PDF = 'PDF',
  EXCEL = 'EXCEL',
}

export class GenerateReportDto {
  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ enum: ReportFormat })
  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;

  @ApiProperty()
  @IsString()
  @IsOptional()
  groupBy?: string;
}
