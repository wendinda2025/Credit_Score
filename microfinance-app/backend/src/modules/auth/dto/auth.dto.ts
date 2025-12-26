import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email de l\'utilisateur',
    example: 'admin@microfinance.local',
  })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'L\'email est requis' })
  email: string;

  @ApiProperty({
    description: 'Mot de passe',
    example: 'Admin@123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Token de rafraîchissement',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le token de rafraîchissement est requis' })
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mot de passe actuel',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe actuel est requis' })
  currentPassword: string;

  @ApiProperty({
    description: 'Nouveau mot de passe (min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial)',
    example: 'NewPass@123!',
  })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
    },
  )
  newPassword: string;
}

export class LogoutDto {
  @ApiProperty({
    description: 'Token de rafraîchissement à révoquer (optionnel)',
    required: false,
  })
  @IsString()
  refreshToken?: string;
}
