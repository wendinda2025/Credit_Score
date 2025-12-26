"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const amortization_service_1 = require("./amortization.service");
const accounting_service_1 = require("../../accounting/accounting.service");
const client_1 = require("@prisma/client");
let LoansService = class LoansService {
    constructor(prisma, amortizationService, accountingService) {
        this.prisma = prisma;
        this.amortizationService = amortizationService;
        this.accountingService = accountingService;
    }
    async createProduct(dto) {
        return this.prisma.loanProduct.create({
            data: dto,
        });
    }
    async getProducts() {
        return this.prisma.loanProduct.findMany({
            where: { active: true },
        });
    }
    async createApplication(userId, dto) {
        const product = await this.prisma.loanProduct.findUnique({
            where: { id: dto.productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Loan product not found');
        }
        if (dto.amount < Number(product.minAmount) || (product.maxAmount && dto.amount > Number(product.maxAmount))) {
            throw new common_1.BadRequestException(`Amount must be between ${product.minAmount} and ${product.maxAmount}`);
        }
        const schedule = this.amortizationService.calculateSchedule(dto.amount, dto.interestRate, dto.duration, product.periodicity, product.interestType, new Date());
        return this.prisma.loan.create({
            data: {
                clientId: dto.clientId,
                productId: dto.productId,
                amount: dto.amount,
                interestRate: dto.interestRate,
                duration: dto.duration,
                status: client_1.LoanStatus.PENDING,
                loanOfficerId: userId,
                submittedAt: new Date(),
            },
        });
    }
    async getLoan(id) {
        return this.prisma.loan.findUnique({
            where: { id },
            include: {
                client: true,
                product: true,
                repaymentSchedules: {
                    orderBy: { dueDate: 'asc' },
                },
                transactions: {
                    orderBy: { transactionDate: 'desc' }
                }
            },
        });
    }
    async approveLoan(id, userId) {
        const loan = await this.prisma.loan.findUnique({ where: { id } });
        if (!loan)
            throw new common_1.NotFoundException('Loan not found');
        if (loan.status !== client_1.LoanStatus.PENDING)
            throw new common_1.BadRequestException('Loan is not pending');
        return this.prisma.loan.update({
            where: { id },
            data: {
                status: client_1.LoanStatus.APPROVED,
                approvedAt: new Date(),
                approvedById: userId,
            },
        });
    }
    async disburseLoan(id, userId) {
        const loan = await this.prisma.loan.findUnique({
            where: { id },
            include: { product: true },
        });
        if (!loan)
            throw new common_1.NotFoundException('Loan not found');
        if (loan.status !== client_1.LoanStatus.APPROVED)
            throw new common_1.BadRequestException('Loan is not approved');
        const disbursementDate = new Date();
        const schedule = this.amortizationService.calculateSchedule(Number(loan.amount), Number(loan.interestRate), loan.duration, loan.product.periodicity, loan.product.interestType, disbursementDate);
        return this.prisma.$transaction(async (prisma) => {
            const updatedLoan = await prisma.loan.update({
                where: { id },
                data: {
                    status: client_1.LoanStatus.ACTIVE,
                    disbursedAt: disbursementDate,
                    disbursedById: userId,
                    principalDisbursed: loan.amount,
                    outstandingBalance: loan.amount,
                },
            });
            await prisma.repaymentSchedule.createMany({
                data: schedule.map((s) => ({
                    loanId: id,
                    installmentNumber: s.period,
                    dueDate: s.dueDate,
                    principalDue: s.principal,
                    interestDue: s.interest,
                    totalDue: s.total,
                    principalPaid: 0,
                    interestPaid: 0,
                    penaltyPaid: 0,
                    feePaid: 0,
                    status: client_1.RepaymentStatus.PENDING,
                })),
            });
            await prisma.transaction.create({
                data: {
                    loanId: id,
                    type: 'DISBURSEMENT',
                    amount: loan.amount,
                    transactionDate: disbursementDate,
                    externalId: `DISB-${id}-${Date.now()}`,
                }
            });
            return updatedLoan;
        });
    }
    async repayLoan(id, dto, userId) {
        const loan = await this.prisma.loan.findUnique({
            where: { id },
            include: {
                repaymentSchedules: {
                    where: { status: { not: client_1.RepaymentStatus.PAID } },
                    orderBy: { dueDate: 'asc' },
                },
            },
        });
        if (!loan)
            throw new common_1.NotFoundException('Loan not found');
        if (loan.status !== client_1.LoanStatus.ACTIVE)
            throw new common_1.BadRequestException('Loan is not active');
        let remainingAmount = dto.amount;
        const paymentDate = new Date();
        return this.prisma.$transaction(async (prisma) => {
            for (const schedule of loan.repaymentSchedules) {
                if (remainingAmount <= 0)
                    break;
                const interestPending = Number(schedule.interestDue) - Number(schedule.interestPaid);
                const principalPending = Number(schedule.principalDue) - Number(schedule.principalPaid);
                let interestPayment = 0;
                let principalPayment = 0;
                if (interestPending > 0) {
                    interestPayment = Math.min(remainingAmount, interestPending);
                    remainingAmount -= interestPayment;
                }
                if (remainingAmount > 0 && principalPending > 0) {
                    principalPayment = Math.min(remainingAmount, principalPending);
                    remainingAmount -= principalPayment;
                }
                const totalPaidForSchedule = interestPayment + principalPayment;
                if (totalPaidForSchedule > 0) {
                    const newInterestPaid = Number(schedule.interestPaid) + interestPayment;
                    const newPrincipalPaid = Number(schedule.principalPaid) + principalPayment;
                    const isFullyPaid = newPrincipalPaid >= Number(schedule.principalDue) &&
                        newInterestPaid >= Number(schedule.interestDue);
                    await prisma.repaymentSchedule.update({
                        where: { id: schedule.id },
                        data: {
                            interestPaid: newInterestPaid,
                            principalPaid: newPrincipalPaid,
                            paidDate: paymentDate,
                            status: isFullyPaid ? client_1.RepaymentStatus.PAID : client_1.RepaymentStatus.PARTIAL,
                        }
                    });
                }
            }
            const totalPrincipalPaid = dto.amount - remainingAmount;
            const newOutstanding = Number(loan.outstandingBalance) - (dto.amount - remainingAmount);
            await prisma.transaction.create({
                data: {
                    loanId: id,
                    type: 'REPAYMENT',
                    amount: dto.amount,
                    transactionDate: paymentDate,
                    externalId: `REP-${id}-${Date.now()}`,
                }
            });
            return { message: 'Repayment processed', remainingAmount };
        });
    }
};
exports.LoansService = LoansService;
exports.LoansService = LoansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        amortization_service_1.AmortizationService,
        accounting_service_1.AccountingService])
], LoansService);
//# sourceMappingURL=loans.service.js.map