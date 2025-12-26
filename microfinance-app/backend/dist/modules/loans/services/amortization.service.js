"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmortizationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let AmortizationService = class AmortizationService {
    calculateSchedule(principal, interestRate, duration, periodicity, interestType, startDate) {
        const schedule = [];
        let balance = principal;
        const ratePerPeriod = this.getRatePerPeriod(interestRate, periodicity);
        const periods = duration;
        let fixedInstallment = 0;
        if (interestType === client_1.InterestType.DECLINING_BALANCE && ratePerPeriod > 0) {
            fixedInstallment =
                (principal * ratePerPeriod * Math.pow(1 + ratePerPeriod, periods)) /
                    (Math.pow(1 + ratePerPeriod, periods) - 1);
        }
        else if (interestType === client_1.InterestType.FLAT) {
            const totalInterest = principal * ratePerPeriod * periods;
            fixedInstallment = (principal + totalInterest) / periods;
        }
        let currentDate = new Date(startDate);
        for (let i = 1; i <= periods; i++) {
            currentDate = this.getNextDueDate(currentDate, periodicity);
            let interest = 0;
            let principalComponent = 0;
            if (interestType === client_1.InterestType.DECLINING_BALANCE) {
                interest = balance * ratePerPeriod;
                principalComponent = fixedInstallment - interest;
                if (i === periods || principalComponent > balance) {
                    principalComponent = balance;
                    fixedInstallment = principalComponent + interest;
                }
            }
            else if (interestType === client_1.InterestType.FLAT) {
                interest = principal * ratePerPeriod;
                principalComponent = (principal / periods);
                fixedInstallment = principalComponent + interest;
            }
            balance -= principalComponent;
            if (balance < 0)
                balance = 0;
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
    getRatePerPeriod(annualRate, periodicity) {
        const rate = annualRate / 100;
        switch (periodicity) {
            case client_1.Periodicity.MONTHLY:
                return rate / 12;
            case client_1.Periodicity.WEEKLY:
                return rate / 52;
            case client_1.Periodicity.DAILY:
                return rate / 365;
            case client_1.Periodicity.YEARLY:
                return rate;
            default:
                return rate / 12;
        }
    }
    getNextDueDate(date, periodicity) {
        const newDate = new Date(date);
        switch (periodicity) {
            case client_1.Periodicity.MONTHLY:
                newDate.setMonth(newDate.getMonth() + 1);
                break;
            case client_1.Periodicity.WEEKLY:
                newDate.setDate(newDate.getDate() + 7);
                break;
            case client_1.Periodicity.DAILY:
                newDate.setDate(newDate.getDate() + 1);
                break;
            case client_1.Periodicity.YEARLY:
                newDate.setFullYear(newDate.getFullYear() + 1);
                break;
        }
        return newDate;
    }
};
exports.AmortizationService = AmortizationService;
exports.AmortizationService = AmortizationService = __decorate([
    (0, common_1.Injectable)()
], AmortizationService);
//# sourceMappingURL=amortization.service.js.map