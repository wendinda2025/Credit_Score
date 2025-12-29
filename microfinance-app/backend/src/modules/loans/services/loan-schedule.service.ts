import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { InterestMethod, AmortizationType, RepaymentFrequency } from '@prisma/client';

export interface ScheduleInstallment {
  installmentNumber: number;
  dueDate: Date;
  principalDue: Decimal;
  interestDue: Decimal;
  totalDue: Decimal;
  principalOutstanding: Decimal;
  interestOutstanding: Decimal;
  totalOutstanding: Decimal;
}

export interface LoanScheduleParams {
  principal: Decimal;
  interestRate: Decimal; // Taux mensuel en pourcentage
  numberOfRepayments: number;
  disbursementDate: Date;
  interestMethod: InterestMethod;
  amortizationType: AmortizationType;
  repaymentFrequency: RepaymentFrequency;
  principalGracePeriod?: number;
  interestGracePeriod?: number;
}

@Injectable()
export class LoanScheduleService {
  /**
   * Génère le calendrier d'amortissement complet
   */
  generateSchedule(params: LoanScheduleParams): ScheduleInstallment[] {
    const {
      principal,
      interestRate,
      numberOfRepayments,
      disbursementDate,
      interestMethod,
      amortizationType,
      repaymentFrequency,
      principalGracePeriod = 0,
      interestGracePeriod = 0,
    } = params;

    // Convertir le taux en décimal (ex: 2% -> 0.02)
    const rate = interestRate.dividedBy(100);

    switch (interestMethod) {
      case InterestMethod.FLAT:
        return this.generateFlatSchedule(
          principal,
          rate,
          numberOfRepayments,
          disbursementDate,
          repaymentFrequency,
          principalGracePeriod,
          interestGracePeriod,
        );
      case InterestMethod.DECLINING_BALANCE:
        if (amortizationType === AmortizationType.EQUAL_INSTALLMENTS) {
          return this.generateDecliningBalanceEqualInstallments(
            principal,
            rate,
            numberOfRepayments,
            disbursementDate,
            repaymentFrequency,
            principalGracePeriod,
            interestGracePeriod,
          );
        } else {
          return this.generateDecliningBalanceEqualPrincipal(
            principal,
            rate,
            numberOfRepayments,
            disbursementDate,
            repaymentFrequency,
            principalGracePeriod,
            interestGracePeriod,
          );
        }
      default:
        return this.generateDecliningBalanceEqualInstallments(
          principal,
          rate,
          numberOfRepayments,
          disbursementDate,
          repaymentFrequency,
          principalGracePeriod,
          interestGracePeriod,
        );
    }
  }

  /**
   * Méthode FLAT (intérêts calculés sur le capital initial)
   * Total intérêts = Principal × Taux × Nombre d'échéances
   */
  private generateFlatSchedule(
    principal: Decimal,
    rate: Decimal,
    numberOfRepayments: number,
    disbursementDate: Date,
    repaymentFrequency: RepaymentFrequency,
    principalGracePeriod: number,
    interestGracePeriod: number,
  ): ScheduleInstallment[] {
    const schedule: ScheduleInstallment[] = [];
    
    // Total des intérêts sur toute la durée
    const totalInterest = principal.times(rate).times(numberOfRepayments);
    
    // Échéances effectives pour le principal
    const principalInstallments = numberOfRepayments - principalGracePeriod;
    const interestInstallments = numberOfRepayments - interestGracePeriod;
    
    // Principal par échéance
    const principalPerInstallment = principalInstallments > 0 
      ? principal.dividedBy(principalInstallments) 
      : new Decimal(0);
    
    // Intérêt par échéance
    const interestPerInstallment = interestInstallments > 0
      ? totalInterest.dividedBy(interestInstallments)
      : new Decimal(0);

    let remainingPrincipal = principal;
    let dueDate = new Date(disbursementDate);

    for (let i = 1; i <= numberOfRepayments; i++) {
      dueDate = this.calculateNextDueDate(dueDate, repaymentFrequency);

      const isInPrincipalGrace = i <= principalGracePeriod;
      const isInInterestGrace = i <= interestGracePeriod;

      const principalDue = isInPrincipalGrace 
        ? new Decimal(0) 
        : principalPerInstallment;
      
      const interestDue = isInInterestGrace 
        ? new Decimal(0) 
        : interestPerInstallment;

      remainingPrincipal = remainingPrincipal.minus(principalDue);

      const totalDue = principalDue.plus(interestDue);

      schedule.push({
        installmentNumber: i,
        dueDate: new Date(dueDate),
        principalDue: this.roundToTwoDecimals(principalDue),
        interestDue: this.roundToTwoDecimals(interestDue),
        totalDue: this.roundToTwoDecimals(totalDue),
        principalOutstanding: this.roundToTwoDecimals(principalDue),
        interestOutstanding: this.roundToTwoDecimals(interestDue),
        totalOutstanding: this.roundToTwoDecimals(totalDue),
      });
    }

    // Ajuster la dernière échéance pour les arrondis
    this.adjustLastInstallment(schedule, principal, totalInterest);

    return schedule;
  }

  /**
   * Méthode DÉGRESSIF avec échéances constantes (EMI - Equal Monthly Installment)
   * Utilise la formule PMT standard
   */
  private generateDecliningBalanceEqualInstallments(
    principal: Decimal,
    rate: Decimal,
    numberOfRepayments: number,
    disbursementDate: Date,
    repaymentFrequency: RepaymentFrequency,
    principalGracePeriod: number,
    interestGracePeriod: number,
  ): ScheduleInstallment[] {
    const schedule: ScheduleInstallment[] = [];
    
    // Nombre d'échéances effectives
    const effectiveRepayments = numberOfRepayments - principalGracePeriod;
    
    // Calcul de l'échéance constante (EMI)
    // EMI = P × r × (1+r)^n / ((1+r)^n - 1)
    let emi: Decimal;
    
    if (rate.isZero()) {
      emi = principal.dividedBy(effectiveRepayments);
    } else {
      const onePlusR = rate.plus(1);
      const onePlusRPowerN = onePlusR.pow(effectiveRepayments);
      emi = principal
        .times(rate)
        .times(onePlusRPowerN)
        .dividedBy(onePlusRPowerN.minus(1));
    }

    let remainingPrincipal = principal;
    let dueDate = new Date(disbursementDate);
    let totalInterestAccumulated = new Decimal(0);

    for (let i = 1; i <= numberOfRepayments; i++) {
      dueDate = this.calculateNextDueDate(dueDate, repaymentFrequency);

      const isInPrincipalGrace = i <= principalGracePeriod;
      const isInInterestGrace = i <= interestGracePeriod;

      // Intérêt de la période = Solde restant × Taux
      let interestDue = remainingPrincipal.times(rate);
      
      let principalDue: Decimal;
      let totalDue: Decimal;

      if (isInPrincipalGrace) {
        // Période de grâce: seulement intérêts (ou rien si grâce totale)
        principalDue = new Decimal(0);
        interestDue = isInInterestGrace ? new Decimal(0) : interestDue;
        totalDue = interestDue;
      } else {
        // Principal = EMI - Intérêts
        principalDue = emi.minus(interestDue);
        interestDue = isInInterestGrace ? new Decimal(0) : interestDue;
        totalDue = principalDue.plus(interestDue);
        remainingPrincipal = remainingPrincipal.minus(principalDue);
      }

      totalInterestAccumulated = totalInterestAccumulated.plus(interestDue);

      // S'assurer que le solde restant ne devient pas négatif
      if (remainingPrincipal.isNegative()) {
        principalDue = principalDue.plus(remainingPrincipal);
        remainingPrincipal = new Decimal(0);
      }

      schedule.push({
        installmentNumber: i,
        dueDate: new Date(dueDate),
        principalDue: this.roundToTwoDecimals(principalDue),
        interestDue: this.roundToTwoDecimals(interestDue),
        totalDue: this.roundToTwoDecimals(totalDue),
        principalOutstanding: this.roundToTwoDecimals(principalDue),
        interestOutstanding: this.roundToTwoDecimals(interestDue),
        totalOutstanding: this.roundToTwoDecimals(totalDue),
      });
    }

    // Ajuster la dernière échéance
    const lastInstallment = schedule[schedule.length - 1];
    if (remainingPrincipal.greaterThan(0)) {
      lastInstallment.principalDue = this.roundToTwoDecimals(
        new Decimal(lastInstallment.principalDue.toString()).plus(remainingPrincipal)
      );
      lastInstallment.totalDue = this.roundToTwoDecimals(
        new Decimal(lastInstallment.principalDue.toString()).plus(lastInstallment.interestDue)
      );
      lastInstallment.principalOutstanding = lastInstallment.principalDue;
      lastInstallment.totalOutstanding = lastInstallment.totalDue;
    }

    return schedule;
  }

  /**
   * Méthode DÉGRESSIF avec principal constant
   * Principal constant, intérêts dégressifs
   */
  private generateDecliningBalanceEqualPrincipal(
    principal: Decimal,
    rate: Decimal,
    numberOfRepayments: number,
    disbursementDate: Date,
    repaymentFrequency: RepaymentFrequency,
    principalGracePeriod: number,
    interestGracePeriod: number,
  ): ScheduleInstallment[] {
    const schedule: ScheduleInstallment[] = [];
    
    // Nombre d'échéances effectives
    const effectiveRepayments = numberOfRepayments - principalGracePeriod;
    
    // Principal constant par échéance
    const principalPerInstallment = effectiveRepayments > 0
      ? principal.dividedBy(effectiveRepayments)
      : new Decimal(0);

    let remainingPrincipal = principal;
    let dueDate = new Date(disbursementDate);

    for (let i = 1; i <= numberOfRepayments; i++) {
      dueDate = this.calculateNextDueDate(dueDate, repaymentFrequency);

      const isInPrincipalGrace = i <= principalGracePeriod;
      const isInInterestGrace = i <= interestGracePeriod;

      // Intérêt de la période = Solde restant × Taux
      let interestDue = remainingPrincipal.times(rate);
      
      const principalDue = isInPrincipalGrace 
        ? new Decimal(0) 
        : principalPerInstallment;

      interestDue = isInInterestGrace ? new Decimal(0) : interestDue;
      
      remainingPrincipal = remainingPrincipal.minus(principalDue);

      const totalDue = principalDue.plus(interestDue);

      schedule.push({
        installmentNumber: i,
        dueDate: new Date(dueDate),
        principalDue: this.roundToTwoDecimals(principalDue),
        interestDue: this.roundToTwoDecimals(interestDue),
        totalDue: this.roundToTwoDecimals(totalDue),
        principalOutstanding: this.roundToTwoDecimals(principalDue),
        interestOutstanding: this.roundToTwoDecimals(interestDue),
        totalOutstanding: this.roundToTwoDecimals(totalDue),
      });
    }

    // Ajuster la dernière échéance pour les arrondis
    const lastIndex = schedule.length - 1;
    if (remainingPrincipal.greaterThan(0) && lastIndex >= 0) {
      schedule[lastIndex].principalDue = this.roundToTwoDecimals(
        new Decimal(schedule[lastIndex].principalDue.toString()).plus(remainingPrincipal)
      );
      schedule[lastIndex].totalDue = this.roundToTwoDecimals(
        new Decimal(schedule[lastIndex].principalDue.toString()).plus(schedule[lastIndex].interestDue)
      );
      schedule[lastIndex].principalOutstanding = schedule[lastIndex].principalDue;
      schedule[lastIndex].totalOutstanding = schedule[lastIndex].totalDue;
    }

    return schedule;
  }

  /**
   * Calcule la prochaine date d'échéance selon la fréquence
   */
  private calculateNextDueDate(
    currentDate: Date,
    frequency: RepaymentFrequency,
  ): Date {
    const nextDate = new Date(currentDate);

    switch (frequency) {
      case RepaymentFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case RepaymentFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case RepaymentFrequency.BIWEEKLY:
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case RepaymentFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case RepaymentFrequency.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case RepaymentFrequency.SEMI_ANNUALLY:
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case RepaymentFrequency.ANNUALLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }

    return nextDate;
  }

  /**
   * Arrondit à deux décimales
   */
  private roundToTwoDecimals(value: Decimal): Decimal {
    return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  /**
   * Ajuste la dernière échéance pour corriger les erreurs d'arrondi
   */
  private adjustLastInstallment(
    schedule: ScheduleInstallment[],
    totalPrincipal: Decimal,
    totalInterest: Decimal,
  ): void {
    if (schedule.length === 0) return;

    let sumPrincipal = new Decimal(0);
    let sumInterest = new Decimal(0);

    for (const installment of schedule) {
      sumPrincipal = sumPrincipal.plus(installment.principalDue);
      sumInterest = sumInterest.plus(installment.interestDue);
    }

    const lastInstallment = schedule[schedule.length - 1];

    // Ajuster le principal
    const principalDiff = totalPrincipal.minus(sumPrincipal);
    if (!principalDiff.isZero()) {
      lastInstallment.principalDue = this.roundToTwoDecimals(
        new Decimal(lastInstallment.principalDue.toString()).plus(principalDiff)
      );
    }

    // Ajuster les intérêts
    const interestDiff = totalInterest.minus(sumInterest);
    if (!interestDiff.isZero()) {
      lastInstallment.interestDue = this.roundToTwoDecimals(
        new Decimal(lastInstallment.interestDue.toString()).plus(interestDiff)
      );
    }

    // Recalculer le total
    lastInstallment.totalDue = this.roundToTwoDecimals(
      new Decimal(lastInstallment.principalDue.toString()).plus(lastInstallment.interestDue)
    );
    lastInstallment.principalOutstanding = lastInstallment.principalDue;
    lastInstallment.interestOutstanding = lastInstallment.interestDue;
    lastInstallment.totalOutstanding = lastInstallment.totalDue;
  }

  /**
   * Calcule les totaux du calendrier
   */
  calculateScheduleTotals(schedule: ScheduleInstallment[]): {
    totalPrincipal: Decimal;
    totalInterest: Decimal;
    totalRepayment: Decimal;
  } {
    let totalPrincipal = new Decimal(0);
    let totalInterest = new Decimal(0);

    for (const installment of schedule) {
      totalPrincipal = totalPrincipal.plus(installment.principalDue);
      totalInterest = totalInterest.plus(installment.interestDue);
    }

    return {
      totalPrincipal: this.roundToTwoDecimals(totalPrincipal),
      totalInterest: this.roundToTwoDecimals(totalInterest),
      totalRepayment: this.roundToTwoDecimals(totalPrincipal.plus(totalInterest)),
    };
  }
}
