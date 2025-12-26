import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SavingsProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private dec(value: string): Prisma.Decimal {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (Prisma as any).Decimal(value);
  }

  async create(orgId: string, input: any) {
    return await this.prisma.savingsProduct.create({
      data: {
        organizationId: orgId,
        name: input.name,
        currencyCode: input.currencyCode ?? 'XOF',
        interestRateAnnualPercent: input.interestRateAnnualPercent
          ? this.dec(input.interestRateAnnualPercent)
          : null,
      },
    });
  }

  async list(orgId: string) {
    return await this.prisma.savingsProduct.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

