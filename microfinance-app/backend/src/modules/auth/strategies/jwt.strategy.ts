import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Vérifier que l'utilisateur existe toujours et est actif
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true, passwordChangedAt: true },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }

    // Vérifier si le token a été émis avant le changement de mot de passe
    if (user.passwordChangedAt && payload.iat) {
      const passwordChangedTimestamp = Math.floor(
        user.passwordChangedAt.getTime() / 1000
      );
      if (payload.iat < passwordChangedTimestamp) {
        throw new UnauthorizedException(
          'Mot de passe modifié. Veuillez vous reconnecter.'
        );
      }
    }

    return payload;
  }
}
