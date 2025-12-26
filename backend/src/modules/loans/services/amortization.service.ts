import { BadRequestException, Injectable } from '@nestjs/common';
import { LoanInterestType, Prisma, RepaymentFrequency } from '@prisma/client';
import dayjs from 'dayjs';

type Installment = {
  installmentNumber: number;
  dueDate: Date;
  principalDue: Prisma.Decimal;
  interestDue: Prisma.Decimal;
};

@Injectable()
export class AmortizationService {
  private dec(value: string | number | Prisma.Decimal): Prisma.Decimal {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (Prisma as any).Decimal(value);
  }

  private periodsPerYear(freq: RepaymentFrequency, every: number): number {
    const base =
      freq === 'DAILY' ? 365 : freq === 'WEEKLY' ? 52 : freq === 'BIWEEKLY' ? 26 : 12;
    return base / Math.max(1, every);
  }

  private addPeriod(date: dayjs.Dayjs, freq: RepaymentFrequency, every: number): dayjs.Dayjs {
    const e = Math.max(1, every);
    switch (freq) {
      case 'DAILY':
        return date.add(e, 'day');
      case 'WEEKLY':
        return date.add(e, 'week');
      case 'BIWEEKLY':
        return date.add(2 * e, 'week');
      case 'MONTHLY':
      default:
        return date.add(e, 'month');
    }
  }

  generateSchedule(params: {
    principal: Prisma.Decimal;
    annualInterestRatePercent: Prisma.Decimal;
    interestType: LoanInterestType;
    repaymentFrequency: RepaymentFrequency;
    repaymentEvery: number;
    numberOfRepayments: number;
    firstRepaymentDate: Date;
  }): Installment[] {
    if (params.numberOfRepayments <= 0) throw new BadRequestException('Nombre d’échéances invalide.');
    if (params.principal.lte(this.dec(0))) throw new BadRequestException('Principal invalide.');

    // Ici on stocke des "pourcent" (ex: 24 = 24%).
    const annualRate = params.annualInterestRatePercent.div(this.dec(100));
    const ppy = this.periodsPerYear(params.repaymentFrequency, params.repaymentEvery);
    const periodRate = annualRate.div(this.dec(ppy));

    const n = params.numberOfRepayments;
    const principalPerInst = params.principal.div(this.dec(n));
    let outstanding = params.principal;

    const out: Installment[] = [];
    let due = dayjs(params.firstRepaymentDate);

    for (let i = 1; i <= n; i++) {
      const principalDue = i === n ? outstanding : principalPerInst;
      const interestBase = params.interestType === 'FLAT' ? params.principal : outstanding;
      const interestDue = interestBase.mul(periodRate);

      out.push({
        installmentNumber: i,
        dueDate: due.toDate(),
        principalDue: principalDue.toDecimalPlaces(2),
        interestDue: interestDue.toDecimalPlaces(2),
      });

      outstanding = outstanding.sub(principalDue);
      due = this.addPeriod(due, params.repaymentFrequency, params.repaymentEvery);
    }

    return out;
  }
}

