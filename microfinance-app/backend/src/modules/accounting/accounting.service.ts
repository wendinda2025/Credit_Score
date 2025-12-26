import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto, CreateJournalEntryDto } from './dto/accounting.dto';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async createAccount(dto: CreateAccountDto) {
    return this.prisma.ledgerAccount.create({
      data: {
        ...dto,
        balance: 0,
      },
    });
  }

  async getAccounts() {
    return this.prisma.ledgerAccount.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async recordEntry(dto: CreateJournalEntryDto) {
    if (dto.debitAmount !== dto.creditAmount) {
      throw new BadRequestException('Debit and Credit amounts must match');
    }

    return this.prisma.$transaction(async (prisma) => {
      // 1. Create Journal Entry
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

      // 2. Update Account Balances
      // Asset/Expense: Debit increases, Credit decreases
      // Liability/Equity/Income: Credit increases, Debit decreases
      
      const debitAccount = await prisma.ledgerAccount.findUnique({ where: { id: dto.debitAccountId } });
      const creditAccount = await prisma.ledgerAccount.findUnique({ where: { id: dto.creditAccountId } });

      if (!debitAccount || !creditAccount) throw new BadRequestException('Invalid accounts');

      // Update Debit Account
      let debitBalanceChange = Number(dto.debitAmount);
      if (['LIABILITY', 'EQUITY', 'INCOME'].includes(debitAccount.type)) {
        debitBalanceChange = -debitBalanceChange;
      }
      await prisma.ledgerAccount.update({
        where: { id: dto.debitAccountId },
        data: { balance: { increment: debitBalanceChange } },
      });

      // Update Credit Account
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
    // Simplified Balance Sheet logic
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
}
