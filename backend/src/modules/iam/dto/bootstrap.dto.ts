import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class BootstrapDto {
  @ApiProperty({ example: "MFI Démo (Afrique de l'Ouest)", required: false })
  @IsOptional()
  @IsString()
  organizationName?: string;

  @ApiProperty({ example: 'admin', required: false })
  @IsOptional()
  @IsString()
  adminUsername?: string;

  @ApiProperty({ example: 'ChangeMe123!', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  adminPassword?: string;
}

