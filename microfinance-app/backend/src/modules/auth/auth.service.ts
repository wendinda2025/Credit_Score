import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Mettre à jour la dernière connexion
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Journaliser la connexion
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.id,
        description: `Connexion de l'utilisateur ${user.username}`,
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    const roles = user.roles.map((ur) => ur.role.code);
    const permissions = user.roles.flatMap((ur) =>
      Array.isArray(ur.role.permissions)
        ? (ur.role.permissions as string[])
        : [],
    );

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      organizationId: user.organizationId,
      roles,
      permissions,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        permissions,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: registerDto.username },
          { email: registerDto.email },
        ],
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Un utilisateur avec ce nom d\'utilisateur ou cet email existe déjà',
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      parseInt(process.env.BCRYPT_ROUNDS || '10'),
    );

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        username: registerDto.username,
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        organizationId: registerDto.organizationId,
        officeId: registerDto.officeId,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const { password: _, ...result } = user;
    return result;
  }
}
