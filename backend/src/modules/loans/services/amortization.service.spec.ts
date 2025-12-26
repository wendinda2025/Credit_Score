import { Prisma } from '@prisma/client';

import { AmortizationService } from './amortization.service';

describe('AmortizationService', () => {
  it('génère un échéancier dont le principal total = principal', () => {
    const svc = new AmortizationService();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Decimal = (Prisma as any).Decimal as typeof Prisma.Decimal;

    const principal = new Decimal('1000.00');
    const schedule = svc.generateSchedule({
      principal,
      annualInterestRatePercent: new Decimal('24.0'),
      interestType: 'DECLINING_BALANCE',
      repaymentFrequency: 'MONTHLY',
      repaymentEvery: 1,
      numberOfRepayments: 4,
      firstRepaymentDate: new Date('2026-01-01'),
    });

    const totalPrincipal = schedule.reduce((a, i) => a.add(i.principalDue), new Decimal('0'));
    expect(totalPrincipal.toFixed(2)).toBe('1000.00');
    expect(schedule).toHaveLength(4);
  });
});

