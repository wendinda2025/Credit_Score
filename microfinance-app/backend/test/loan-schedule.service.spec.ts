import { LoanScheduleService, LoanScheduleParams } from '../src/modules/loans/services/loan-schedule.service';
import { Decimal } from 'decimal.js';
import { InterestMethod, AmortizationType, RepaymentFrequency } from '@prisma/client';

describe('LoanScheduleService', () => {
  let service: LoanScheduleService;

  beforeEach(() => {
    service = new LoanScheduleService();
  });

  describe('generateSchedule', () => {
    it('should generate correct schedule for flat interest method', () => {
      const params: LoanScheduleParams = {
        principal: new Decimal(1000000),
        interestRate: new Decimal(2), // 2% mensuel
        numberOfRepayments: 12,
        disbursementDate: new Date('2024-01-01'),
        interestMethod: InterestMethod.FLAT,
        amortizationType: AmortizationType.EQUAL_INSTALLMENTS,
        repaymentFrequency: RepaymentFrequency.MONTHLY,
      };

      const schedule = service.generateSchedule(params);

      // 12 échéances
      expect(schedule).toHaveLength(12);

      // Vérifier que la première échéance est en février
      expect(schedule[0].dueDate.getMonth()).toBe(1); // Février (0-indexed)

      // Total intérêts = 1,000,000 * 2% * 12 = 240,000
      const totals = service.calculateScheduleTotals(schedule);
      expect(totals.totalPrincipal.toNumber()).toBe(1000000);
      expect(totals.totalInterest.toNumber()).toBe(240000);
      expect(totals.totalRepayment.toNumber()).toBe(1240000);
    });

    it('should generate correct schedule for declining balance EMI', () => {
      const params: LoanScheduleParams = {
        principal: new Decimal(1000000),
        interestRate: new Decimal(2), // 2% mensuel
        numberOfRepayments: 12,
        disbursementDate: new Date('2024-01-01'),
        interestMethod: InterestMethod.DECLINING_BALANCE,
        amortizationType: AmortizationType.EQUAL_INSTALLMENTS,
        repaymentFrequency: RepaymentFrequency.MONTHLY,
      };

      const schedule = service.generateSchedule(params);

      expect(schedule).toHaveLength(12);

      // Vérifier que les intérêts diminuent à chaque échéance
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].interestDue.lessThanOrEqualTo(schedule[i - 1].interestDue)).toBe(true);
      }

      // Vérifier que le principal augmente à chaque échéance
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].principalDue.greaterThanOrEqualTo(schedule[i - 1].principalDue)).toBe(true);
      }

      // Le total du principal doit être égal au montant initial
      const totals = service.calculateScheduleTotals(schedule);
      expect(totals.totalPrincipal.toNumber()).toBe(1000000);

      // Les intérêts totaux doivent être inférieurs à la méthode flat
      expect(totals.totalInterest.lessThan(new Decimal(240000))).toBe(true);
    });

    it('should handle grace periods correctly', () => {
      const params: LoanScheduleParams = {
        principal: new Decimal(500000),
        interestRate: new Decimal(1.5),
        numberOfRepayments: 6,
        disbursementDate: new Date('2024-01-01'),
        interestMethod: InterestMethod.FLAT,
        amortizationType: AmortizationType.EQUAL_INSTALLMENTS,
        repaymentFrequency: RepaymentFrequency.MONTHLY,
        principalGracePeriod: 2,
        interestGracePeriod: 1,
      };

      const schedule = service.generateSchedule(params);

      expect(schedule).toHaveLength(6);

      // Première échéance: pas de principal, pas d'intérêts (grâce totale)
      expect(schedule[0].principalDue.toNumber()).toBe(0);
      expect(schedule[0].interestDue.toNumber()).toBe(0);

      // Deuxième échéance: pas de principal, mais intérêts
      expect(schedule[1].principalDue.toNumber()).toBe(0);
      expect(schedule[1].interestDue.greaterThan(0)).toBe(true);

      // À partir de la 3ème échéance: principal et intérêts
      expect(schedule[2].principalDue.greaterThan(0)).toBe(true);
      expect(schedule[2].interestDue.greaterThan(0)).toBe(true);
    });

    it('should calculate correct due dates for different frequencies', () => {
      const baseParams: Omit<LoanScheduleParams, 'repaymentFrequency'> = {
        principal: new Decimal(100000),
        interestRate: new Decimal(1),
        numberOfRepayments: 4,
        disbursementDate: new Date('2024-01-15'),
        interestMethod: InterestMethod.FLAT,
        amortizationType: AmortizationType.EQUAL_INSTALLMENTS,
      };

      // Test mensuel
      const monthlySchedule = service.generateSchedule({
        ...baseParams,
        repaymentFrequency: RepaymentFrequency.MONTHLY,
      });
      expect(monthlySchedule[0].dueDate.getMonth()).toBe(1); // Février
      expect(monthlySchedule[1].dueDate.getMonth()).toBe(2); // Mars

      // Test hebdomadaire
      const weeklySchedule = service.generateSchedule({
        ...baseParams,
        repaymentFrequency: RepaymentFrequency.WEEKLY,
      });
      const oneWeekLater = new Date('2024-01-22');
      expect(weeklySchedule[0].dueDate.getDate()).toBe(oneWeekLater.getDate());
    });

    it('should ensure schedule totals equal expected repayment', () => {
      const params: LoanScheduleParams = {
        principal: new Decimal(750000),
        interestRate: new Decimal(2.5),
        numberOfRepayments: 18,
        disbursementDate: new Date('2024-01-01'),
        interestMethod: InterestMethod.DECLINING_BALANCE,
        amortizationType: AmortizationType.EQUAL_PRINCIPAL,
        repaymentFrequency: RepaymentFrequency.MONTHLY,
      };

      const schedule = service.generateSchedule(params);
      const totals = service.calculateScheduleTotals(schedule);

      // Le principal total doit être exact
      expect(totals.totalPrincipal.toNumber()).toBe(750000);

      // Vérifier que chaque échéance a des valeurs positives ou nulles
      schedule.forEach((installment) => {
        expect(installment.principalDue.greaterThanOrEqualTo(0)).toBe(true);
        expect(installment.interestDue.greaterThanOrEqualTo(0)).toBe(true);
        expect(installment.totalDue.greaterThanOrEqualTo(0)).toBe(true);
      });
    });
  });

  describe('calculateScheduleTotals', () => {
    it('should correctly sum all installments', () => {
      const params: LoanScheduleParams = {
        principal: new Decimal(200000),
        interestRate: new Decimal(3),
        numberOfRepayments: 6,
        disbursementDate: new Date('2024-01-01'),
        interestMethod: InterestMethod.FLAT,
        amortizationType: AmortizationType.EQUAL_INSTALLMENTS,
        repaymentFrequency: RepaymentFrequency.MONTHLY,
      };

      const schedule = service.generateSchedule(params);
      const totals = service.calculateScheduleTotals(schedule);

      // Vérifier la cohérence
      expect(totals.totalRepayment.equals(
        totals.totalPrincipal.plus(totals.totalInterest)
      )).toBe(true);
    });
  });
});
