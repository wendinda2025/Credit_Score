import { InterestType, Periodicity } from '@prisma/client';
export interface AmortizationScheduleEntry {
    period: number;
    dueDate: Date;
    principal: number;
    interest: number;
    total: number;
    balance: number;
}
export declare class AmortizationService {
    calculateSchedule(principal: number, interestRate: number, duration: number, periodicity: Periodicity, interestType: InterestType, startDate: Date): AmortizationScheduleEntry[];
    private getRatePerPeriod;
    private getNextDueDate;
}
