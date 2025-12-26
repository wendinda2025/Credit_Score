import { Test, TestingModule } from '@nestjs/testing';
import { AmortizationService } from './amortization.service';
import Decimal from 'decimal.js';
import { RepaymentFrequency, InterestCalculationMethod } from '@prisma/client';

describe('AmortizationService', () => {
  let service: AmortizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmortizationService],
    }).compile();

    service = module.get<AmortizationService>(AmortizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateSchedule - Declining Balance', () => {
    it('should calculate correct schedule for declining balance method', () => {
      const principal = new Decimal(100000);
      const interestRate = new Decimal(0.15); // 15% per year
      const loanTerm = 90; // 90 days
      const frequency = RepaymentFrequency.MONTHLY;
      const method = InterestCalculationMethod.DECLINING;
      const firstDate = new Date('2024-01-01');

      const schedule = service.calculateSchedule(
        principal,
        interestRate,
        loanTerm,
        frequency,
        method,
        firstDate,
      );

      expect(schedule).toBeDefined();
      expect(schedule.length).toBeGreaterThan(0);
      expect(schedule[0].installmentNumber).toBe(1);
      expect(schedule[0].principalDue.toNumber()).toBeGreaterThan(0);
      expect(schedule[0].interestDue.toNumber()).toBeGreaterThan(0);
    });
  });

  describe('calculateSchedule - Flat Rate', () => {
    it('should calculate correct schedule for flat rate method', () => {
      const principal = new Decimal(100000);
      const interestRate = new Decimal(0.15);
      const loanTerm = 90;
      const frequency = RepaymentFrequency.MONTHLY;
      const method = InterestCalculationMethod.FLAT;
      const firstDate = new Date('2024-01-01');

      const schedule = service.calculateSchedule(
        principal,
        interestRate,
        loanTerm,
        frequency,
        method,
        firstDate,
      );

      expect(schedule).toBeDefined();
      expect(schedule.length).toBeGreaterThan(0);
    });
  });
});
