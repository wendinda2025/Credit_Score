import { BadRequestException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string) {
    const users = await this.prisma.user.findMany({
      where: { organizationId: orgId },
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      status: u.status,
      roles: u.roles.map((r) => r.role.name),
      createdAt: u.createdAt,
    }));
  }

  async create(orgId: string, input: { username: string; password: string; roles: string[] }) {
    const roles = await this.prisma.role.findMany({
      where: { organizationId: orgId, name: { in: input.roles } },
    });
    if (roles.length !== input.roles.length) {
      throw new BadRequestException('Rôle(s) invalide(s).');
    }

    const passwordHash = await argon2.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        organizationId: orgId,
        username: input.username,
        passwordHash,
        status: 'ACTIVE',
        roles: { create: roles.map((r) => ({ roleId: r.id })) },
      },
      include: { roles: { include: { role: true } } },
    });

    return {
      id: user.id,
      username: user.username,
      roles: user.roles.map((r) => r.role.name),
    };
  }
}

