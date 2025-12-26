import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAuditLogDto, AuditLogQueryDto } from './dto/audit.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enregistrer une action dans le journal d'audit
   */
  async logAction(dto: CreateAuditLogDto, userId: string, organizationId: string) {
    return this.prisma.auditLog.create({
      data: {
        ...dto,
        userId,
        organizationId,
      },
    });
  }

  /**
   * Récupérer les logs d'audit avec filtres
   */
  async findAll(organizationId: string, query: AuditLogQueryDto, page = 1, limit = 50) {
    const where: any = {
      organizationId,
    };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    if (query.action) {
      where.action = query.action;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupérer l'historique d'une entité spécifique
   */
  async getEntityHistory(organizationId: string, entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Statistiques d'audit
   */
  async getStatistics(organizationId: string, startDate: Date, endDate: Date) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        action: true,
        entityType: true,
        userId: true,
      },
    });

    // Grouper par action
    const byAction = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Grouper par type d'entité
    const byEntityType = logs.reduce((acc, log) => {
      acc[log.entityType] = (acc[log.entityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Utilisateurs les plus actifs
    const byUser = logs.reduce((acc, log) => {
      acc[log.userId] = (acc[log.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUsers = Object.entries(byUser)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    return {
      period: {
        startDate,
        endDate,
      },
      totalActions: logs.length,
      byAction,
      byEntityType,
      topUsers,
    };
  }
}
