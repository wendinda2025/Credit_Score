import { IsString, IsEnum, IsOptional, IsDate, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditAction } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuditLogDto {
  @ApiProperty({ enum: AuditAction })
  @IsEnum(AuditAction)
  action: AuditAction;

  @ApiProperty()
  @IsString()
  entityType: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiProperty()
  @IsObject()
  @IsOptional()
  oldValue?: any;

  @ApiProperty()
  @IsObject()
  @IsOptional()
  newValue?: any;

  @ApiProperty()
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  userAgent?: string;
}

export class AuditLogQueryDto {
  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @ApiProperty()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiProperty({ enum: AuditAction })
  @IsEnum(AuditAction)
  @IsOptional()
  action?: AuditAction;
}
