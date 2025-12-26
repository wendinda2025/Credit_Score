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
exports.AccountingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AccountingService = class AccountingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAccount(dto) {
        return this.prisma.ledgerAccount.create({
            data: Object.assign(Object.assign({}, dto), { balance: 0 }),
        });
    }
    async getAccounts() {
        return this.prisma.ledgerAccount.findMany({
            orderBy: { code: 'asc' },
        });
    }
    async recordEntry(dto) {
        if (dto.debitAmount !== dto.creditAmount) {
            throw new common_1.BadRequestException('Debit and Credit amounts must match');
        }
        return this.prisma.$transaction(async (prisma) => {
            const entry = await prisma.journalEntry.create({
                data: {
                    description: dto.description,
                    entryDate: new Date(dto.entryDate),
                    debitAccountId: dto.debitAccountId,
                    debitAmount: dto.debitAmount,
                    creditAccountId: dto.creditAccountId,
                    creditAmount: dto.creditAmount,
                    transactionId: dto.transactionId,
                },
            });
            const debitAccount = await prisma.ledgerAccount.findUnique({ where: { id: dto.debitAccountId } });
            const creditAccount = await prisma.ledgerAccount.findUnique({ where: { id: dto.creditAccountId } });
            if (!debitAccount || !creditAccount)
                throw new common_1.BadRequestException('Invalid accounts');
            let debitBalanceChange = Number(dto.debitAmount);
            if (['LIABILITY', 'EQUITY', 'INCOME'].includes(debitAccount.type)) {
                debitBalanceChange = -debitBalanceChange;
            }
            await prisma.ledgerAccount.update({
                where: { id: dto.debitAccountId },
                data: { balance: { increment: debitBalanceChange } },
            });
            let creditBalanceChange = Number(dto.creditAmount);
            if (['ASSET', 'EXPENSE'].includes(creditAccount.type)) {
                creditBalanceChange = -creditBalanceChange;
            }
            await prisma.ledgerAccount.update({
                where: { id: dto.creditAccountId },
                data: { balance: { increment: creditBalanceChange } },
            });
            return entry;
        });
    }
    async getBalanceSheet() {
        const assets = await this.prisma.ledgerAccount.findMany({ where: { type: 'ASSET' } });
        const liabilities = await this.prisma.ledgerAccount.findMany({ where: { type: 'LIABILITY' } });
        const equity = await this.prisma.ledgerAccount.findMany({ where: { type: 'EQUITY' } });
        return {
            assets,
            liabilities,
            equity,
            totalAssets: assets.reduce((sum, acc) => sum + Number(acc.balance), 0),
            totalLiabilities: liabilities.reduce((sum, acc) => sum + Number(acc.balance), 0),
            totalEquity: equity.reduce((sum, acc) => sum + Number(acc.balance), 0),
        };
    }
};
exports.AccountingService = AccountingService;
exports.AccountingService = AccountingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountingService);
//# sourceMappingURL=accounting.service.js.map