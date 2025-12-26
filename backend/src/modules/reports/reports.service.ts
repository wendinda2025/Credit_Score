import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private dec(value: string | number | Prisma.Decimal): Prisma.Decimal {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (Prisma as any).Decimal(value);
  }

  async kpis(orgId: string) {
    const today = new Date();

    const outstandingAgg = await this.prisma.loanScheduleInstallment.aggregate({
      where: { loan: { organizationId: orgId, status: 'DISBURSED' } },
      _sum: { principalDue: true, principalPaid: true, interestDue: true, interestPaid: true },
    });

    const principalDue = (outstandingAgg._sum.principalDue ?? this.dec(0)) as unknown as Prisma.Decimal;
    const principalPaid = (outstandingAgg._sum.principalPaid ?? this.dec(0)) as unknown as Prisma.Decimal;
    const interestDue = (outstandingAgg._sum.interestDue ?? this.dec(0)) as unknown as Prisma.Decimal;
    const interestPaid = (outstandingAgg._sum.interestPaid ?? this.dec(0)) as unknown as Prisma.Decimal;

    const outstandingPrincipal = principalDue.sub(principalPaid);
    const outstandingInterest = interestDue.sub(interestPaid);

    const arrearsAgg = await this.prisma.loanScheduleInstallment.aggregate({
      where: { loan: { organizationId: orgId, status: 'DISBURSED' }, dueDate: { lt: today }, completed: false },
      _sum: { principalDue: true, principalPaid: true },
    });
    const arrearsPrincipalDue = (arrearsAgg._sum.principalDue ?? this.dec(0)) as unknown as Prisma.Decimal;
    const arrearsPrincipalPaid = (arrearsAgg._sum.principalPaid ?? this.dec(0)) as unknown as Prisma.Decimal;
    const arrearsPrincipal = arrearsPrincipalDue.sub(arrearsPrincipalPaid);

    const par = outstandingPrincipal.gt(this.dec(0))
      ? arrearsPrincipal.div(outstandingPrincipal).mul(this.dec(100))
      : this.dec(0);

    const since = dayjs().subtract(30, 'day').toDate();
    const repaidAgg = await this.prisma.loanTransaction.aggregate({
      where: { loan: { organizationId: orgId }, type: 'REPAYMENT', transactionDate: { gte: since } },
      _sum: { amount: true },
    });
    const repaid = (repaidAgg._sum.amount ?? this.dec(0)) as unknown as Prisma.Decimal;

    return {
      portfolio: {
        outstandingPrincipal: outstandingPrincipal.toFixed(2),
        outstandingInterest: outstandingInterest.toFixed(2),
        arrearsPrincipal: arrearsPrincipal.toFixed(2),
        parPercent: par.toFixed(2),
      },
      repayment: {
        last30DaysCollected: repaid.toFixed(2),
      },
    };
  }
}

