import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    const roles = user.roles.map((ur) => ur.role.code);
    const permissions = user.roles.flatMap((ur) =>
      Array.isArray(ur.role.permissions)
        ? (ur.role.permissions as string[])
        : [],
    );

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      organizationId: user.organizationId,
      officeId: user.officeId,
      roles,
      permissions,
    };
  }
}
