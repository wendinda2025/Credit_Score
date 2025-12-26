import { Injectable } from '@nestjs/common';
import { InterestType, Periodicity } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface AmortizationScheduleEntry {
  period: number;
  dueDate: Date;
  principal: number;
  interest: number;
  total: number;
  balance: number;
}

@Injectable()
export class AmortizationService {
  calculateSchedule(
    principal: number,
    interestRate: number, // Taux annuel en %
    duration: number,
    periodicity: Periodicity,
    interestType: InterestType,
    startDate: Date,
  ): AmortizationScheduleEntry[] {
    const schedule: AmortizationScheduleEntry[] = [];
    let balance = principal;
    const ratePerPeriod = this.getRatePerPeriod(interestRate, periodicity);
    const periods = duration; // Supposons que duration est en nombre de périodes pour simplifier, sinon convertir

    // Calcul de l'échéance constante pour amortissement progressif (formule classique)
    // PMT = P * r * (1 + r)^n / ((1 + r)^n - 1)
    let fixedInstallment = 0;
    if (interestType === InterestType.DECLINING_BALANCE && ratePerPeriod > 0) {
      fixedInstallment =
        (principal * ratePerPeriod * Math.pow(1 + ratePerPeriod, periods)) /
        (Math.pow(1 + ratePerPeriod, periods) - 1);
    } else if (interestType === InterestType.FLAT) {
        // Intérêt total = P * r * n (si r est par période) ou P * (R/100) * (durée/12 ou autre)
        // Ici on simplifie : Intérêt total sur la durée / nombre de périodes
        const totalInterest = principal * ratePerPeriod * periods;
        fixedInstallment = (principal + totalInterest) / periods;
    }

    let currentDate = new Date(startDate);

    for (let i = 1; i <= periods; i++) {
      currentDate = this.getNextDueDate(currentDate, periodicity);
      
      let interest = 0;
      let principalComponent = 0;

      if (interestType === InterestType.DECLINING_BALANCE) {
        interest = balance * ratePerPeriod;
        principalComponent = fixedInstallment - interest;
        
        // Ajustement pour la dernière échéance
        if (i === periods || principalComponent > balance) {
            principalComponent = balance;
            fixedInstallment = principalComponent + interest;
        }
      } else if (interestType === InterestType.FLAT) {
        interest = principal * ratePerPeriod;
        principalComponent = (principal / periods); // Capital constant
        // Note: Dans le FLAT, souvent le montant total est divisé. 
        // Ici : Principal constant + Intérêt constant
        fixedInstallment = principalComponent + interest;
      }

      balance -= principalComponent;
      if (balance < 0) balance = 0;

      schedule.push({
        period: i,
        dueDate: new Date(currentDate),
        principal: Number(principalComponent.toFixed(2)),
        interest: Number(interest.toFixed(2)),
        total: Number(fixedInstallment.toFixed(2)),
        balance: Number(balance.toFixed(2)),
      });
    }

    return schedule;
  }

  private getRatePerPeriod(annualRate: number, periodicity: Periodicity): number {
    // annualRate est en %, ex: 12 pour 12%
    const rate = annualRate / 100;
    switch (periodicity) {
      case Periodicity.MONTHLY:
        return rate / 12;
      case Periodicity.WEEKLY:
        return rate / 52;
      case Periodicity.DAILY:
        return rate / 365;
      case Periodicity.YEARLY:
        return rate;
      default:
        return rate / 12;
    }
  }

  private getNextDueDate(date: Date, periodicity: Periodicity): Date {
    const newDate = new Date(date);
    switch (periodicity) {
      case Periodicity.MONTHLY:
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case Periodicity.WEEKLY:
        newDate.setDate(newDate.getDate() + 7);
        break;
      case Periodicity.DAILY:
        newDate.setDate(newDate.getDate() + 1);
        break;
      case Periodicity.YEARLY:
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    return newDate;
  }
}
