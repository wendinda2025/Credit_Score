import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RefreshTokenDto, ChangePasswordDto } from './dto/auth.dto';
import { JwtPayload, TokenResponse, AuthenticatedUser } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MINUTES = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Authentifie un utilisateur et retourne les tokens
   */
  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<TokenResponse> {
    const { email, password } = loginDto;

    // Récupérer l'utilisateur avec ses rôles
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        branch: true,
      },
    });

    if (!user) {
      this.logger.warn(`Login attempt with unknown email: ${email}`);
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier si le compte est verrouillé
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      );
      throw new ForbiddenException(
        `Compte temporairement verrouillé. Réessayez dans ${remainingMinutes} minutes.`
      );
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      throw new ForbiddenException('Compte désactivé. Contactez l\'administrateur.');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Incrémenter le compteur d'échecs
      const newFailedCount = user.failedLoginCount + 1;
      const updateData: any = { failedLoginCount: newFailedCount };

      // Verrouiller le compte après trop de tentatives
      if (newFailedCount >= this.MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(
          Date.now() + this.LOCK_DURATION_MINUTES * 60000
        );
        this.logger.warn(`Account locked due to too many failed attempts: ${email}`);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Log de l'audit
      await this.logAuditEvent(
        user.id,
        'LOGIN_FAILED',
        'User',
        user.id,
        null,
        { reason: 'Invalid password', attempt: newFailedCount },
        ipAddress,
        userAgent,
      );

      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Réinitialiser le compteur d'échecs et mettre à jour la dernière connexion
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Extraire les rôles et permissions
    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = new Set<string>();
    user.roles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        permissions.add(rp.permission.code);
      });
    });

    // Générer les tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      roles,
      permissions: Array.from(permissions),
      branchId: user.branchId,
    });

    // Log de l'audit
    await this.logAuditEvent(
      user.id,
      'LOGIN_SUCCESS',
      'User',
      user.id,
      null,
      null,
      ipAddress,
      userAgent,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        permissions: Array.from(permissions),
        branchId: user.branchId,
        branchName: user.branch?.name,
      },
    };
  }

  /**
   * Rafraîchit les tokens d'accès
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<TokenResponse> {
    const { refreshToken } = refreshTokenDto;

    // Vérifier si le refresh token existe et est valide
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
            branch: true,
          },
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }

    if (storedToken.isRevoked) {
      throw new UnauthorizedException('Token de rafraîchissement révoqué');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Token de rafraîchissement expiré');
    }

    if (!storedToken.user.isActive) {
      throw new ForbiddenException('Compte désactivé');
    }

    // Révoquer l'ancien token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Extraire les rôles et permissions
    const user = storedToken.user;
    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = new Set<string>();
    user.roles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        permissions.add(rp.permission.code);
      });
    });

    // Générer de nouveaux tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      roles,
      permissions: Array.from(permissions),
      branchId: user.branchId,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        permissions: Array.from(permissions),
        branchId: user.branchId,
        branchName: user.branch?.name,
      },
    };
  }

  /**
   * Déconnecte un utilisateur (révoque le refresh token)
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId },
        data: { isRevoked: true },
      });
    } else {
      // Révoquer tous les refresh tokens de l'utilisateur
      await this.prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      });
    }

    await this.logAuditEvent(userId, 'LOGOUT', 'User', userId, null, null);
  }

  /**
   * Change le mot de passe d'un utilisateur
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    const saltRounds = this.configService.get('BCRYPT_SALT_ROUNDS', 12);
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    // Révoquer tous les refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    await this.logAuditEvent(
      userId,
      'PASSWORD_CHANGED',
      'User',
      userId,
      null,
      null,
    );
  }

  /**
   * Génère les tokens JWT
   */
  private async generateTokens(payload: JwtPayload): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const accessToken = this.jwtService.sign(payload);

    // Créer et stocker le refresh token
    const refreshToken = uuidv4();
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = this.calculateExpiryDate(refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: payload.sub,
        expiresAt,
      },
    });

    // Nettoyer les anciens tokens révoqués ou expirés
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId: payload.sub,
        OR: [
          { isRevoked: true },
          { expiresAt: { lt: new Date() } },
        ],
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpiresInSeconds(),
    };
  }

  /**
   * Calcule la date d'expiration à partir d'une durée
   */
  private calculateExpiryDate(duration: string): Date {
    const matches = duration.match(/^(\d+)([smhd])$/);
    if (!matches) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours par défaut
    }

    const value = parseInt(matches[1]);
    const unit = matches[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }

  /**
   * Retourne la durée d'expiration en secondes
   */
  private getExpiresInSeconds(): number {
    const expiresIn = this.configService.get('JWT_EXPIRES_IN', '15m');
    const matches = expiresIn.match(/^(\d+)([smhd])$/);
    if (!matches) return 900; // 15 minutes par défaut

    const value = parseInt(matches[1]);
    const unit = matches[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * multipliers[unit];
  }

  /**
   * Log un événement d'audit
   */
  private async logAuditEvent(
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string | null,
    oldValues: any,
    newValues: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        ipAddress,
        userAgent,
      },
    });
  }
}
