import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  InterestCalculationMethod,
  RepaymentFrequency,
} from '@prisma/client';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

export interface AmortizationSchedule {
  installmentNumber: number;
  dueDate: Date;
  principalDue: Decimal;
  interestDue: Decimal;
  totalDue: Decimal;
  principalBalance: Decimal;
}

@Injectable()
export class AmortizationService {
  /**
   * Calcule le calendrier d'amortissement selon la méthode choisie
   */
  calculateSchedule(
    principalAmount: Decimal,
    interestRate: Decimal,
    loanTerm: number, // En jours
    repaymentFrequency: RepaymentFrequency,
    method: InterestCalculationMethod,
    firstRepaymentDate: Date,
  ): AmortizationSchedule[] {
    switch (method) {
      case InterestCalculationMethod.DECLINING:
        return this.calculateDecliningBalance(
          principalAmount,
          interestRate,
          loanTerm,
          repaymentFrequency,
          firstRepaymentDate,
        );
      case InterestCalculationMethod.FLAT:
        return this.calculateFlatRate(
          principalAmount,
          interestRate,
          loanTerm,
          repaymentFrequency,
          firstRepaymentDate,
        );
      default:
        return this.calculateDecliningBalance(
          principalAmount,
          interestRate,
          loanTerm,
          repaymentFrequency,
          firstRepaymentDate,
        );
    }
  }

  /**
   * Méthode dégressive (déclinante) - Méthode la plus courante en microfinance
   */
  private calculateDecliningBalance(
    principalAmount: Decimal,
    interestRate: Decimal,
    loanTerm: number,
    repaymentFrequency: RepaymentFrequency,
    firstRepaymentDate: Date,
  ): AmortizationSchedule[] {
    const schedule: AmortizationSchedule[] = [];
    const numberOfInstallments = this.getNumberOfInstallments(
      loanTerm,
      repaymentFrequency,
    );
    const periodDays = this.getPeriodDays(repaymentFrequency);
    const periodRate = this.calculatePeriodRate(interestRate, periodDays);

    let remainingPrincipal = principalAmount;
    const installmentAmount = this.calculateInstallmentAmount(
      principalAmount,
      periodRate,
      numberOfInstallments,
    );

    for (let i = 1; i <= numberOfInstallments; i++) {
      const interestDue = remainingPrincipal.mul(periodRate);
      const principalDue = installmentAmount.minus(interestDue);
      const dueDate = this.calculateDueDate(
        firstRepaymentDate,
        i,
        repaymentFrequency,
      );

      // Pour le dernier versement, ajuster pour éviter les arrondis
      if (i === numberOfInstallments) {
        const finalPrincipal = remainingPrincipal;
        const finalInterest = remainingPrincipal.mul(periodRate);
        remainingPrincipal = new Decimal(0);
        schedule.push({
          installmentNumber: i,
          dueDate,
          principalDue: finalPrincipal,
          interestDue: finalInterest,
          totalDue: finalPrincipal.plus(finalInterest),
          principalBalance: new Decimal(0),
        });
      } else {
        remainingPrincipal = remainingPrincipal.minus(principalDue);
        schedule.push({
          installmentNumber: i,
          dueDate,
          principalDue,
          interestDue,
          totalDue: installmentAmount,
          principalBalance: remainingPrincipal,
        });
      }
    }

    return schedule;
  }

  /**
   * Méthode à taux fixe (intérêt simple)
   */
  private calculateFlatRate(
    principalAmount: Decimal,
    interestRate: Decimal,
    loanTerm: number,
    repaymentFrequency: RepaymentFrequency,
    firstRepaymentDate: Date,
  ): AmortizationSchedule[] {
    const schedule: AmortizationSchedule[] = [];
    const numberOfInstallments = this.getNumberOfInstallments(
      loanTerm,
      repaymentFrequency,
    );
    const totalInterest = principalAmount.mul(interestRate).mul(loanTerm).div(365);
    const totalAmount = principalAmount.plus(totalInterest);
    const installmentAmount = totalAmount.div(numberOfInstallments);
    const principalPerInstallment = principalAmount.div(numberOfInstallments);
    const interestPerInstallment = totalInterest.div(numberOfInstallments);

    let remainingPrincipal = principalAmount;

    for (let i = 1; i <= numberOfInstallments; i++) {
      const dueDate = this.calculateDueDate(
        firstRepaymentDate,
        i,
        repaymentFrequency,
      );

      if (i === numberOfInstallments) {
        const finalPrincipal = remainingPrincipal;
        remainingPrincipal = new Decimal(0);
        schedule.push({
          installmentNumber: i,
          dueDate,
          principalDue: finalPrincipal,
          interestDue: interestPerInstallment,
          totalDue: finalPrincipal.plus(interestPerInstallment),
          principalBalance: new Decimal(0),
        });
      } else {
        remainingPrincipal = remainingPrincipal.minus(principalPerInstallment);
        schedule.push({
          installmentNumber: i,
          dueDate,
          principalDue: principalPerInstallment,
          interestDue: interestPerInstallment,
          totalDue: installmentAmount,
          principalBalance: remainingPrincipal,
        });
      }
    }

    return schedule;
  }

  /**
   * Calcule le nombre de versements selon la fréquence
   */
  private getNumberOfInstallments(
    loanTerm: number,
    frequency: RepaymentFrequency,
  ): number {
    switch (frequency) {
      case RepaymentFrequency.DAILY:
        return loanTerm;
      case RepaymentFrequency.WEEKLY:
        return Math.ceil(loanTerm / 7);
      case RepaymentFrequency.BIWEEKLY:
        return Math.ceil(loanTerm / 14);
      case RepaymentFrequency.MONTHLY:
        return Math.ceil(loanTerm / 30);
      case RepaymentFrequency.QUARTERLY:
        return Math.ceil(loanTerm / 90);
      case RepaymentFrequency.YEARLY:
        return Math.ceil(loanTerm / 365);
      default:
        return Math.ceil(loanTerm / 30);
    }
  }

  /**
   * Calcule le nombre de jours dans une période
   */
  private getPeriodDays(frequency: RepaymentFrequency): number {
    switch (frequency) {
      case RepaymentFrequency.DAILY:
        return 1;
      case RepaymentFrequency.WEEKLY:
        return 7;
      case RepaymentFrequency.BIWEEKLY:
        return 14;
      case RepaymentFrequency.MONTHLY:
        return 30;
      case RepaymentFrequency.QUARTERLY:
        return 90;
      case RepaymentFrequency.YEARLY:
        return 365;
      default:
        return 30;
    }
  }

  /**
   * Calcule le taux de période
   */
  private calculatePeriodRate(annualRate: Decimal, periodDays: number): Decimal {
    return annualRate.mul(periodDays).div(365);
  }

  /**
   * Calcule le montant de chaque versement (formule d'annuité)
   */
  private calculateInstallmentAmount(
    principal: Decimal,
    periodRate: Decimal,
    numberOfInstallments: number,
  ): Decimal {
    if (periodRate.equals(0)) {
      return principal.div(numberOfInstallments);
    }

    const numerator = periodRate.mul(
      periodRate.plus(1).pow(numberOfInstallments),
    );
    const denominator = periodRate.plus(1).pow(numberOfInstallments).minus(1);
    return principal.mul(numerator.div(denominator));
  }

  /**
   * Calcule la date d'échéance d'un versement
   */
  private calculateDueDate(
    firstDate: Date,
    installmentNumber: number,
    frequency: RepaymentFrequency,
  ): Date {
    switch (frequency) {
      case RepaymentFrequency.DAILY:
        return addDays(firstDate, installmentNumber - 1);
      case RepaymentFrequency.WEEKLY:
        return addWeeks(firstDate, installmentNumber - 1);
      case RepaymentFrequency.BIWEEKLY:
        return addWeeks(firstDate, (installmentNumber - 1) * 2);
      case RepaymentFrequency.MONTHLY:
        return addMonths(firstDate, installmentNumber - 1);
      case RepaymentFrequency.QUARTERLY:
        return addMonths(firstDate, (installmentNumber - 1) * 3);
      case RepaymentFrequency.YEARLY:
        return addYears(firstDate, installmentNumber - 1);
      default:
        return addMonths(firstDate, installmentNumber - 1);
    }
  }
}
