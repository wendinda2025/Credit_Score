import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.organization.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            loans: true,
            savingsAccounts: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException(`Organisation #${id} introuvable`);
    }

    return organization;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.findOne(id);

    return this.prisma.organization.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete
    return this.prisma.organization.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStatistics(id: string) {
    const organization = await this.findOne(id);

    const [clients, loans, savingsAccounts, users, totalDisbursed, totalSavings] = await Promise.all([
      this.prisma.client.count({ where: { organizationId: id } }),
      this.prisma.loan.count({ where: { organizationId: id } }),
      this.prisma.savingsAccount.count({ where: { organizationId: id } }),
      this.prisma.user.count({ where: { organizationId: id } }),
      this.prisma.loan.aggregate({
        where: { organizationId: id, status: { in: ['ACTIVE', 'CLOSED'] } },
        _sum: { disbursementAmount: true },
      }),
      this.prisma.savingsAccount.aggregate({
        where: { organizationId: id, status: 'ACTIVE' },
        _sum: { balance: true },
      }),
    ]);

    return {
      organization: {
        id: organization.id,
        name: organization.name,
      },
      statistics: {
        totalClients: clients,
        totalLoans: loans,
        totalSavingsAccounts: savingsAccounts,
        totalUsers: users,
        totalDisbursed: totalDisbursed._sum.disbursementAmount || 0,
        totalSavings: totalSavings._sum.balance || 0,
      },
    };
  }
}
