import { Injectable } from '@nestjs/common';
import { RepaymentFrequency, InterestMethod } from '@prisma/client';

export interface RepaymentScheduleItem {
  installmentNumber: number;
  dueDate: Date;
  principal: number;
  interest: number;
  fees: number;
  penalty: number;
  total: number;
  principalBalance: number;
}

@Injectable()
export class AmortizationService {
  /**
   * Calcule le calendrier d'amortissement complet d'un prêt
   */
  calculateRepaymentSchedule(
    principalAmount: number,
    interestRate: number, // taux annuel
    numberOfInstallments: number,
    frequency: RepaymentFrequency,
    interestMethod: InterestMethod,
    disbursementDate: Date,
    fees: number = 0,
  ): RepaymentScheduleItem[] {
    const schedule: RepaymentScheduleItem[] = [];

    switch (interestMethod) {
      case 'FLAT':
        return this.calculateFlatInterest(
          principalAmount,
          interestRate,
          numberOfInstallments,
          frequency,
          disbursementDate,
          fees,
        );
      case 'DECLINING_BALANCE':
        return this.calculateDecliningBalance(
          principalAmount,
          interestRate,
          numberOfInstallments,
          frequency,
          disbursementDate,
          fees,
        );
      default:
        throw new Error(`Méthode d'intérêt non supportée: ${interestMethod}`);
    }
  }

  /**
   * Méthode d'intérêt forfaitaire (flat rate)
   * Intérêts calculés sur le montant initial pendant toute la durée
   */
  private calculateFlatInterest(
    principal: number,
    annualRate: number,
    installments: number,
    frequency: RepaymentFrequency,
    startDate: Date,
    fees: number,
  ): RepaymentScheduleItem[] {
    const schedule: RepaymentScheduleItem[] = [];
    
    // Calcul du nombre de périodes par an
    const periodsPerYear = this.getPeriodsPerYear(frequency);
    
    // Intérêt total sur la durée
    const totalInterest = (principal * annualRate * installments) / (periodsPerYear * 100);
    
    // Intérêt par période
    const interestPerPeriod = totalInterest / installments;
    
    // Principal par période
    const principalPerPeriod = principal / installments;
    
    // Frais sur la première échéance
    const feesPerPeriod = fees / installments;
    
    let remainingBalance = principal;
    
    for (let i = 1; i <= installments; i++) {
      const dueDate = this.calculateDueDate(startDate, i, frequency);
      const principalDue = i === installments ? remainingBalance : principalPerPeriod;
      
      schedule.push({
        installmentNumber: i,
        dueDate,
        principal: this.round(principalDue),
        interest: this.round(interestPerPeriod),
        fees: i === 1 ? this.round(fees) : 0,
        penalty: 0,
        total: this.round(principalDue + interestPerPeriod + (i === 1 ? fees : 0)),
        principalBalance: this.round(remainingBalance - principalDue),
      });
      
      remainingBalance -= principalDue;
    }
    
    return schedule;
  }

  /**
   * Méthode d'amortissement dégressif (declining balance)
   * Intérêts calculés sur le solde restant dû
   */
  private calculateDecliningBalance(
    principal: number,
    annualRate: number,
    installments: number,
    frequency: RepaymentFrequency,
    startDate: Date,
    fees: number,
  ): RepaymentScheduleItem[] {
    const schedule: RepaymentScheduleItem[] = [];
    
    // Taux périodique
    const periodsPerYear = this.getPeriodsPerYear(frequency);
    const periodicRate = annualRate / (periodsPerYear * 100);
    
    // Calcul du paiement périodique (formule d'annuité)
    const periodicPayment = this.calculatePeriodicPayment(
      principal,
      periodicRate,
      installments,
    );
    
    let remainingBalance = principal;
    
    for (let i = 1; i <= installments; i++) {
      const dueDate = this.calculateDueDate(startDate, i, frequency);
      
      // Intérêt sur le solde restant
      const interest = remainingBalance * periodicRate;
      
      // Principal = paiement - intérêt
      let principalDue = periodicPayment - interest;
      
      // Ajustement pour la dernière échéance
      if (i === installments) {
        principalDue = remainingBalance;
      }
      
      schedule.push({
        installmentNumber: i,
        dueDate,
        principal: this.round(principalDue),
        interest: this.round(interest),
        fees: i === 1 ? this.round(fees) : 0,
        penalty: 0,
        total: this.round(principalDue + interest + (i === 1 ? fees : 0)),
        principalBalance: this.round(remainingBalance - principalDue),
      });
      
      remainingBalance -= principalDue;
    }
    
    return schedule;
  }

  /**
   * Calcule le paiement périodique avec la formule d'annuité
   * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
   */
  private calculatePeriodicPayment(
    principal: number,
    periodicRate: number,
    periods: number,
  ): number {
    if (periodicRate === 0) {
      return principal / periods;
    }
    
    const numerator = periodicRate * Math.pow(1 + periodicRate, periods);
    const denominator = Math.pow(1 + periodicRate, periods) - 1;
    
    return principal * (numerator / denominator);
  }

  /**
   * Calcule la date d'échéance en fonction de la fréquence
   */
  private calculateDueDate(
    startDate: Date,
    installmentNumber: number,
    frequency: RepaymentFrequency,
  ): Date {
    const date = new Date(startDate);
    
    switch (frequency) {
      case 'DAILY':
        date.setDate(date.getDate() + installmentNumber);
        break;
      case 'WEEKLY':
        date.setDate(date.getDate() + installmentNumber * 7);
        break;
      case 'BIWEEKLY':
        date.setDate(date.getDate() + installmentNumber * 14);
        break;
      case 'MONTHLY':
        date.setMonth(date.getMonth() + installmentNumber);
        break;
      case 'QUARTERLY':
        date.setMonth(date.getMonth() + installmentNumber * 3);
        break;
      case 'SEMI_ANNUAL':
        date.setMonth(date.getMonth() + installmentNumber * 6);
        break;
      case 'ANNUAL':
        date.setFullYear(date.getFullYear() + installmentNumber);
        break;
      default:
        throw new Error(`Fréquence non supportée: ${frequency}`);
    }
    
    return date;
  }

  /**
   * Retourne le nombre de périodes par an selon la fréquence
   */
  private getPeriodsPerYear(frequency: RepaymentFrequency): number {
    const mapping = {
      DAILY: 365,
      WEEKLY: 52,
      BIWEEKLY: 26,
      MONTHLY: 12,
      QUARTERLY: 4,
      SEMI_ANNUAL: 2,
      ANNUAL: 1,
    };
    
    return mapping[frequency];
  }

  /**
   * Calcule les pénalités de retard
   */
  calculatePenalty(
    overdueAmount: number,
    daysOverdue: number,
    penaltyRate: number,
    penaltyMethod: 'PERCENTAGE_OF_AMOUNT' | 'FLAT_FEE',
  ): number {
    if (penaltyMethod === 'FLAT_FEE') {
      return penaltyRate;
    }
    
    // Pénalité en pourcentage du montant en retard
    return (overdueAmount * penaltyRate * daysOverdue) / (365 * 100);
  }

  /**
   * Arrondit à 2 décimales
   */
  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Calcule le TEG (Taux Effectif Global)
   */
  calculateAPR(
    principal: number,
    totalInterest: number,
    totalFees: number,
    numberOfDays: number,
  ): number {
    const totalCost = totalInterest + totalFees;
    const dailyRate = totalCost / (principal * numberOfDays);
    const apr = dailyRate * 365 * 100;
    
    return this.round(apr);
  }
}
