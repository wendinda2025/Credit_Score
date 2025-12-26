import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoanProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private dec(value: string): Prisma.Decimal {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (Prisma as any).Decimal(value);
  }

  async create(orgId: string, input: any) {
    const rate = this.dec(input.interestRateAnnualPercent);
    if (rate.lt(this.dec('0'))) throw new BadRequestException('Taux invalide.');

    return await this.prisma.loanProduct.create({
      data: {
        organizationId: orgId,
        name: input.name,
        currencyCode: input.currencyCode ?? 'XOF',
        interestType: input.interestType,
        interestRateAnnualPercent: rate,
        repaymentFrequency: input.repaymentFrequency,
        repaymentEvery: input.repaymentEvery ?? 1,
        numberOfRepayments: input.numberOfRepayments,
        disbursementFee: input.disbursementFee ? this.dec(input.disbursementFee) : null,
      },
    });
  }

  async list(orgId: string) {
    return await this.prisma.loanProduct.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

