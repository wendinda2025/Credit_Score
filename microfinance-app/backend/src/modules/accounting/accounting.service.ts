import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateChartOfAccountDto,
  CreateJournalEntryDto,
} from './dto/accounting.dto';
import Decimal from 'decimal.js';
import { TransactionType } from '@prisma/client';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async generateEntryNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.journalEntry.count({
      where: {
        organizationId,
        entryDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
    return `JE-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  // ========== PLAN COMPTABLE ==========

  async createChartOfAccount(createDto: CreateChartOfAccountDto) {
    // Vérifier l'unicité du code
    const existing = await this.prisma.chartOfAccount.findFirst({
      where: {
        organizationId: createDto.organizationId,
        code: createDto.code,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Un compte avec ce code existe déjà',
      );
    }

    // Déterminer le niveau
    let level = 1;
    if (createDto.parentId) {
      const parent = await this.prisma.chartOfAccount.findUnique({
        where: { id: createDto.parentId },
      });
      if (parent) {
        level = parent.level + 1;
      }
    }

    return this.prisma.chartOfAccount.create({
      data: {
        ...createDto,
        level,
      },
    });
  }

  async findAllChartOfAccounts(organizationId: string) {
    return this.prisma.chartOfAccount.findMany({
      where: { organizationId, isActive: true },
      include: {
        parent: true,
        children: true,
      },
      orderBy: { code: 'asc' },
    });
  }

  // ========== ÉCRITURES COMPTABLES ==========

  async createJournalEntry(
    createDto: CreateJournalEntryDto,
    userId: string,
  ) {
    // Vérifier que les comptes existent
    const debitAccount = await this.prisma.chartOfAccount.findUnique({
      where: { id: createDto.debitAccountId },
    });

    const creditAccount = await this.prisma.chartOfAccount.findUnique({
      where: { id: createDto.creditAccountId },
    });

    if (!debitAccount || !creditAccount) {
      throw new NotFoundException('Un ou plusieurs comptes introuvables');
    }

    if (!debitAccount.allowTransactions || !creditAccount.allowTransactions) {
      throw new BadRequestException(
        'Les comptes sélectionnés n\'autorisent pas les transactions',
      );
    }

    // Vérifier la partie double (débit = crédit)
    const amount = new Decimal(createDto.amount);
    if (amount.lessThanOrEqualTo(0)) {
      throw new BadRequestException('Le montant doit être positif');
    }

    const entryNumber = await this.generateEntryNumber(
      createDto.organizationId,
    );

    // Créer l'écriture
    const entry = await this.prisma.journalEntry.create({
      data: {
        ...createDto,
        entryNumber,
        amount,
        entryDate: new Date(createDto.entryDate),
        createdBy: userId,
      },
      include: {
        debitAccount: true,
        creditAccount: true,
      },
    });

    // Créer la transaction associée
    await this.prisma.transaction.create({
      data: {
        organizationId: createDto.organizationId,
        transactionNumber: `TXN-${entryNumber}`,
        transactionType: createDto.transactionType || TransactionType.JOURNAL_ENTRY,
        amount,
        description: createDto.description,
        referenceId: createDto.referenceId,
        referenceType: createDto.referenceType,
        userId,
      },
    });

    // Journaliser
    await this.prisma.auditLog.create({
      data: {
        userId,
        organizationId: createDto.organizationId,
        action: 'CREATE',
        entityType: 'JOURNAL_ENTRY',
        entityId: entry.id,
        description: `Création de l'écriture ${entryNumber}`,
      },
    });

    return entry;
  }

  /**
   * Crée automatiquement les écritures comptables pour un décaissement de prêt
   */
  async createLoanDisbursementEntries(
    loanId: string,
    organizationId: string,
    amount: Decimal,
    principalAccountId: string,
    cashAccountId: string,
    userId: string,
  ) {
    const description = `Décaissement prêt ${loanId}`;

    return this.createJournalEntry(
      {
        organizationId,
        entryDate: new Date().toISOString(),
        description,
        debitAccountId: principalAccountId,
        creditAccountId: cashAccountId,
        amount: amount.toNumber(),
        transactionType: TransactionType.LOAN_DISBURSEMENT,
        referenceId: loanId,
        referenceType: 'LOAN',
      },
      userId,
    );
  }

  /**
   * Crée automatiquement les écritures comptables pour un remboursement de prêt
   */
  async createLoanRepaymentEntries(
    loanId: string,
    organizationId: string,
    principalPaid: Decimal,
    interestPaid: Decimal,
    principalAccountId: string,
    interestAccountId: string,
    cashAccountId: string,
    userId: string,
  ) {
    const description = `Remboursement prêt ${loanId}`;

    // Écriture pour le principal
    if (principalPaid.greaterThan(0)) {
      await this.createJournalEntry(
        {
          organizationId,
          entryDate: new Date().toISOString(),
          description: `${description} - Principal`,
          debitAccountId: cashAccountId,
          creditAccountId: principalAccountId,
          amount: principalPaid.toNumber(),
          transactionType: TransactionType.LOAN_REPAYMENT,
          referenceId: loanId,
          referenceType: 'LOAN',
        },
        userId,
      );
    }

    // Écriture pour les intérêts
    if (interestPaid.greaterThan(0)) {
      await this.createJournalEntry(
        {
          organizationId,
          entryDate: new Date().toISOString(),
          description: `${description} - Intérêts`,
          debitAccountId: cashAccountId,
          creditAccountId: interestAccountId,
          amount: interestPaid.toNumber(),
          transactionType: TransactionType.LOAN_INTEREST,
          referenceId: loanId,
          referenceType: 'LOAN',
        },
        userId,
      );
    }
  }

  // ========== RAPPORTS COMPTABLES ==========

  async getBalanceSheet(organizationId: string, asOfDate: Date) {
    const accounts = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, isActive: true },
    });

    const balances = await Promise.all(
      accounts.map(async (account) => {
        const debitTotal = await this.prisma.journalEntry.aggregate({
          where: {
            debitAccountId: account.id,
            entryDate: { lte: asOfDate },
            isReversed: false,
          },
          _sum: { amount: true },
        });

        const creditTotal = await this.prisma.journalEntry.aggregate({
          where: {
            creditAccountId: account.id,
            entryDate: { lte: asOfDate },
            isReversed: false,
          },
          _sum: { amount: true },
        });

        const debit = debitTotal._sum.amount || new Decimal(0);
        const credit = creditTotal._sum.amount || new Decimal(0);

        let balance = debit.minus(credit);

        // Pour les comptes de passif et revenus, inverser
        if (
          account.type === 'LIABILITY' ||
          account.type === 'EQUITY' ||
          account.type === 'INCOME'
        ) {
          balance = credit.minus(debit);
        }

        return {
          account,
          balance,
        };
      }),
    );

    return balances;
  }

  async getGeneralLedger(
    organizationId: string,
    accountId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const account = await this.prisma.chartOfAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Compte introuvable');
    }

    const debitEntries = await this.prisma.journalEntry.findMany({
      where: {
        debitAccountId: accountId,
        entryDate: { gte: startDate, lte: endDate },
        isReversed: false,
      },
      include: {
        creditAccount: true,
      },
      orderBy: { entryDate: 'asc' },
    });

    const creditEntries = await this.prisma.journalEntry.findMany({
      where: {
        creditAccountId: accountId,
        entryDate: { gte: startDate, lte: endDate },
        isReversed: false,
      },
      include: {
        debitAccount: true,
      },
      orderBy: { entryDate: 'asc' },
    });

    return {
      account,
      debitEntries,
      creditEntries,
    };
  }
}
