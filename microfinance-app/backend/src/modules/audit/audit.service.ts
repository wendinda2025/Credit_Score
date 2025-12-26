import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, filters?: any) {
    const where: any = { organizationId };

    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters?.action) {
      where.action = filters.action;
    }
    if (filters?.startDate && filters?.endDate) {
      where.timestamp = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: filters?.limit || 100,
    });
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}
