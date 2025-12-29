import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, AssignRolesDto } from './dto/user.dto';
import { PaginationQueryDto, createPaginatedResponse } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Crée un nouvel utilisateur
   */
  async create(createUserDto: CreateUserDto) {
    const { email, password, roleIds, ...userData } = createUserDto;

    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Vérifier que les rôles existent
    if (roleIds && roleIds.length > 0) {
      const roles = await this.prisma.role.findMany({
        where: { id: { in: roleIds } },
      });
      if (roles.length !== roleIds.length) {
        throw new BadRequestException('Un ou plusieurs rôles sont invalides');
      }
    }

    // Hasher le mot de passe
    const saltRounds = this.configService.get('BCRYPT_SALT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur avec ses rôles
    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        ...userData,
        roles: roleIds?.length > 0 ? {
          create: roleIds.map((roleId) => ({
            role: { connect: { id: roleId } },
          })),
        } : undefined,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        branch: true,
      },
    });

    return this.formatUserResponse(user);
  }

  /**
   * Récupère tous les utilisateurs avec pagination
   */
  async findAll(query: PaginationQueryDto) {
    const { search, sortBy, sortOrder } = query;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
          branch: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const formattedUsers = users.map((user) => this.formatUserResponse(user));
    return createPaginatedResponse(formattedUsers, total, query.page || 1, query.limit || 20);
  }

  /**
   * Récupère un utilisateur par son ID
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return this.formatUserResponseWithPermissions(user);
  }

  /**
   * Récupère un utilisateur par son email
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Met à jour un utilisateur
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, roleIds, ...userData } = updateUserDto;

    // Vérifier que l'utilisateur existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier l'unicité de l'email si modifié
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: userData.email.toLowerCase() },
      });
      if (emailExists) {
        throw new ConflictException('Un utilisateur avec cet email existe déjà');
      }
      userData.email = userData.email.toLowerCase();
    }

    // Préparer les données de mise à jour
    const updateData: any = { ...userData };

    // Hasher le nouveau mot de passe si fourni
    if (password) {
      const saltRounds = this.configService.get('BCRYPT_SALT_ROUNDS', 12);
      updateData.passwordHash = await bcrypt.hash(password, saltRounds);
      updateData.passwordChangedAt = new Date();
    }

    // Mettre à jour l'utilisateur
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        branch: true,
      },
    });

    // Mettre à jour les rôles si fournis
    if (roleIds !== undefined) {
      await this.assignRoles(id, { roleIds });
      return this.findOne(id);
    }

    return this.formatUserResponse(user);
  }

  /**
   * Assigne des rôles à un utilisateur
   */
  async assignRoles(userId: string, assignRolesDto: AssignRolesDto) {
    const { roleIds } = assignRolesDto;

    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier que les rôles existent
    if (roleIds.length > 0) {
      const roles = await this.prisma.role.findMany({
        where: { id: { in: roleIds } },
      });
      if (roles.length !== roleIds.length) {
        throw new BadRequestException('Un ou plusieurs rôles sont invalides');
      }
    }

    // Supprimer les anciens rôles et assigner les nouveaux
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({
        where: { userId },
      }),
      ...roleIds.map((roleId) =>
        this.prisma.userRole.create({
          data: {
            userId,
            roleId,
          },
        }),
      ),
    ]);

    return this.findOne(userId);
  }

  /**
   * Supprime un utilisateur
   */
  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Utilisateur supprimé avec succès' };
  }

  /**
   * Active/désactive un utilisateur
   */
  async toggleStatus(id: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }

  /**
   * Récupère tous les rôles
   */
  async findAllRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Formate la réponse utilisateur
   */
  private formatUserResponse(user: any) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
      preferredLocale: user.preferredLocale,
      branchId: user.branchId,
      branchName: user.branch?.name,
      roles: user.roles?.map((ur: any) => ur.role.name) || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Formate la réponse utilisateur avec permissions
   */
  private formatUserResponseWithPermissions(user: any) {
    const permissions = new Set<string>();
    user.roles?.forEach((ur: any) => {
      ur.role.permissions?.forEach((rp: any) => {
        permissions.add(rp.permission.code);
      });
    });

    return {
      ...this.formatUserResponse(user),
      permissions: Array.from(permissions),
    };
  }
}
