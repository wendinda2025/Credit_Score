import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrganization() {
    const org = await this.prisma.organization.findFirst();
    if (!org) {
      throw new NotFoundException('Organisation non configurée');
    }
    return org;
  }

  async updateOrganization(id: string, data: any) {
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async createBranch(data: any) {
    const existing = await this.prisma.branch.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new ConflictException('Une agence avec ce code existe déjà');
    }

    const org = await this.getOrganization();
    return this.prisma.branch.create({
      data: {
        ...data,
        organizationId: org.id,
      },
    });
  }

  async findAllBranches() {
    return this.prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findBranchById(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            loans: true,
          },
        },
      },
    });
    if (!branch) {
      throw new NotFoundException('Agence non trouvée');
    }
    return branch;
  }

  async updateBranch(id: string, data: any) {
    await this.findBranchById(id);
    return this.prisma.branch.update({
      where: { id },
      data,
    });
  }

  async getPaymentTypes() {
    return this.prisma.paymentType.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
    });
  }

  async createPaymentType(data: any) {
    return this.prisma.paymentType.create({ data });
  }

  async getCurrencies() {
    return this.prisma.currency.findMany({
      where: { isActive: true },
    });
  }
}
