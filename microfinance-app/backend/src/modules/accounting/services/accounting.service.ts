import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateChartOfAccountDto,
  CreateJournalEntryDto,
  AccountBalanceQueryDto,
  TrialBalanceQueryDto,
  FinancialStatementQueryDto,
} from '../dto/accounting.dto';
import { AccountType } from '@prisma/client';

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  // ============ PLAN COMPTABLE (CHART OF ACCOUNTS) ============

  async createAccount(dto: CreateChartOfAccountDto, organizationId: string) {
    // Vérifier l'unicité du code comptable
    const existing = await this.prisma.chartOfAccount.findFirst({
      where: {
        organizationId,
        accountCode: dto.accountCode,
      },
    });

    if (existing) {
      throw new BadRequestException(`Le code comptable ${dto.accountCode} existe déjà`);
    }

    // Vérifier le compte parent si fourni
    if (dto.parentId) {
      const parent = await this.prisma.chartOfAccount.findFirst({
        where: { id: dto.parentId, organizationId },
      });

      if (!parent) {
        throw new NotFoundException(`Compte parent #${dto.parentId} introuvable`);
      }
    }

    return this.prisma.chartOfAccount.create({
      data: {
        ...dto,
        organizationId,
        balance: 0,
      },
    });
  }

  async findAllAccounts(organizationId: string, filters?: any) {
    return this.prisma.chartOfAccount.findMany({
      where: {
        organizationId,
        isActive: filters?.isActive !== undefined ? filters.isActive : undefined,
        type: filters?.type,
      },
      include: {
        parent: {
          select: {
            id: true,
            accountCode: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            accountCode: true,
            name: true,
          },
        },
      },
      orderBy: { accountCode: 'asc' },
    });
  }

  async findOneAccount(id: string, organizationId: string) {
    const account = await this.prisma.chartOfAccount.findFirst({
      where: { id, organizationId },
      include: {
        parent: true,
        children: true,
        debitEntries: {
          include: {
            journalEntry: {
              select: {
                id: true,
                transactionDate: true,
                referenceNumber: true,
                description: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        creditEntries: {
          include: {
            journalEntry: {
              select: {
                id: true,
                transactionDate: true,
                referenceNumber: true,
                description: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!account) {
      throw new NotFoundException(`Compte #${id} introuvable`);
    }

    return account;
  }

  async updateAccount(id: string, dto: Partial<CreateChartOfAccountDto>, organizationId: string) {
    await this.findOneAccount(id, organizationId);

    // Vérifier l'unicité du code si modifié
    if (dto.accountCode) {
      const existing = await this.prisma.chartOfAccount.findFirst({
        where: {
          organizationId,
          accountCode: dto.accountCode,
          NOT: { id },
        },
      });

      if (existing) {
        throw new BadRequestException(`Le code comptable ${dto.accountCode} existe déjà`);
      }
    }

    return this.prisma.chartOfAccount.update({
      where: { id },
      data: dto,
    });
  }

  async deleteAccount(id: string, organizationId: string) {
    const account = await this.findOneAccount(id, organizationId);

    // Vérifier qu'il n'y a pas d'écritures
    const entriesCount = await this.prisma.journalEntryLine.count({
      where: { accountId: id },
    });

    if (entriesCount > 0) {
      throw new BadRequestException('Impossible de supprimer un compte avec des écritures');
    }

    // Vérifier qu'il n'y a pas de comptes enfants
    if (account.children && account.children.length > 0) {
      throw new BadRequestException('Impossible de supprimer un compte avec des sous-comptes');
    }

    return this.prisma.chartOfAccount.delete({
      where: { id },
    });
  }

  // ============ ÉCRITURES COMPTABLES (JOURNAL ENTRIES) ============

  async createJournalEntry(dto: CreateJournalEntryDto, organizationId: string, createdById: string) {
    // Validation : vérifier l'équilibre débit/crédit (principe de la partie double)
    const totalDebit = dto.lines
      .filter((l) => l.type === 'DEBIT')
      .reduce((sum, l) => sum + l.amount, 0);

    const totalCredit = dto.lines
      .filter((l) => l.type === 'CREDIT')
      .reduce((sum, l) => sum + l.amount, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `L'écriture n'est pas équilibrée. Débit: ${totalDebit}, Crédit: ${totalCredit}`,
      );
    }

    // Vérifier que tous les comptes existent et autorisent les écritures manuelles
    for (const line of dto.lines) {
      const account = await this.prisma.chartOfAccount.findFirst({
        where: { id: line.accountId, organizationId },
      });

      if (!account) {
        throw new NotFoundException(`Compte #${line.accountId} introuvable`);
      }

      if (!account.manualEntriesAllowed) {
        throw new BadRequestException(
          `Le compte ${account.accountCode} - ${account.name} n'autorise pas les écritures manuelles`,
        );
      }
    }

    // Créer l'écriture dans une transaction
    return this.prisma.$transaction(async (tx) => {
      // Générer un numéro de référence si non fourni
      const referenceNumber = dto.referenceNumber || await this.generateReferenceNumber(organizationId);

      // Créer l'écriture principale
      const journalEntry = await tx.journalEntry.create({
        data: {
          organizationId,
          transactionDate: dto.transactionDate,
          referenceNumber,
          description: dto.description,
          totalDebit,
          totalCredit,
          createdById,
        },
      });

      // Créer les lignes d'écriture
      for (const line of dto.lines) {
        await tx.journalEntryLine.create({
          data: {
            journalEntryId: journalEntry.id,
            accountId: line.accountId,
            debit: line.type === 'DEBIT' ? line.amount : 0,
            credit: line.type === 'CREDIT' ? line.amount : 0,
            description: line.description,
          },
        });

        // Mettre à jour le solde du compte
        const updateAmount = line.type === 'DEBIT' ? line.amount : -line.amount;
        
        await tx.chartOfAccount.update({
          where: { id: line.accountId },
          data: {
            balance: { increment: updateAmount },
          },
        });
      }

      return this.findOneJournalEntry(journalEntry.id, organizationId);
    });
  }

  async findAllJournalEntries(organizationId: string, filters?: any) {
    return this.prisma.journalEntry.findMany({
      where: {
        organizationId,
        transactionDate: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
      },
      include: {
        lines: {
          include: {
            account: {
              select: {
                id: true,
                accountCode: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    });
  }

  async findOneJournalEntry(id: string, organizationId: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, organizationId },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Écriture #${id} introuvable`);
    }

    return entry;
  }

  async reverseJournalEntry(id: string, organizationId: string, reversalDate: Date, createdById: string) {
    const originalEntry = await this.findOneJournalEntry(id, organizationId);

    // Créer une écriture d'annulation (inverser débit/crédit)
    const reversalLines = originalEntry.lines.map((line) => ({
      accountId: line.accountId,
      type: (line.debit > 0 ? 'CREDIT' : 'DEBIT') as 'DEBIT' | 'CREDIT',
      amount: line.debit > 0 ? line.debit : line.credit,
      description: `Annulation: ${line.description || ''}`,
    }));

    return this.createJournalEntry(
      {
        transactionDate: reversalDate,
        description: `Annulation de l'écriture ${originalEntry.referenceNumber}`,
        lines: reversalLines,
      },
      organizationId,
      createdById,
    );
  }

  // ============ RAPPORTS COMPTABLES ============

  /**
   * Balance générale : liste tous les comptes avec leurs soldes
   */
  async getTrialBalance(organizationId: string, dto: TrialBalanceQueryDto) {
    const accounts = await this.prisma.chartOfAccount.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      include: {
        debitEntries: {
          where: {
            journalEntry: {
              transactionDate: { lte: dto.asOfDate },
            },
          },
          select: { debit: true },
        },
        creditEntries: {
          where: {
            journalEntry: {
              transactionDate: { lte: dto.asOfDate },
            },
          },
          select: { credit: true },
        },
      },
      orderBy: { accountCode: 'asc' },
    });

    const balances = accounts.map((account) => {
      const totalDebit = account.debitEntries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = account.creditEntries.reduce((sum, e) => sum + e.credit, 0);
      const balance = totalDebit - totalCredit;

      return {
        accountCode: account.accountCode,
        accountName: account.name,
        accountType: account.type,
        debit: totalDebit,
        credit: totalCredit,
        balance,
        debitBalance: balance > 0 ? balance : 0,
        creditBalance: balance < 0 ? Math.abs(balance) : 0,
      };
    });

    const totals = {
      totalDebit: balances.reduce((sum, b) => sum + b.debit, 0),
      totalCredit: balances.reduce((sum, b) => sum + b.credit, 0),
      totalDebitBalance: balances.reduce((sum, b) => sum + b.debitBalance, 0),
      totalCreditBalance: balances.reduce((sum, b) => sum + b.creditBalance, 0),
    };

    return {
      asOfDate: dto.asOfDate,
      accounts: balances,
      totals,
      isBalanced: Math.abs(totals.totalDebit - totals.totalCredit) < 0.01,
    };
  }

  /**
   * Grand livre : détail des écritures par compte
   */
  async getLedger(organizationId: string, dto: AccountBalanceQueryDto) {
    const where: any = {
      organizationId,
    };

    if (dto.accountId) {
      where.id = dto.accountId;
    }

    const accounts = await this.prisma.chartOfAccount.findMany({
      where,
      include: {
        debitEntries: {
          where: {
            journalEntry: {
              transactionDate: {
                gte: dto.startDate,
                lte: dto.endDate,
              },
            },
          },
          include: {
            journalEntry: {
              select: {
                transactionDate: true,
                referenceNumber: true,
                description: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        creditEntries: {
          where: {
            journalEntry: {
              transactionDate: {
                gte: dto.startDate,
                lte: dto.endDate,
              },
            },
          },
          include: {
            journalEntry: {
              select: {
                transactionDate: true,
                referenceNumber: true,
                description: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { accountCode: 'asc' },
    });

    return accounts.map((account) => {
      // Combiner et trier toutes les écritures
      const entries = [
        ...account.debitEntries.map((e) => ({
          date: e.journalEntry.transactionDate,
          reference: e.journalEntry.referenceNumber,
          description: e.description || e.journalEntry.description,
          debit: e.debit,
          credit: 0,
        })),
        ...account.creditEntries.map((e) => ({
          date: e.journalEntry.transactionDate,
          reference: e.journalEntry.referenceNumber,
          description: e.description || e.journalEntry.description,
          debit: 0,
          credit: e.credit,
        })),
      ].sort((a, b) => a.date.getTime() - b.date.getTime());

      // Calculer le solde cumulé
      let runningBalance = 0;
      const entriesWithBalance = entries.map((entry) => {
        runningBalance += entry.debit - entry.credit;
        return {
          ...entry,
          balance: runningBalance,
        };
      });

      return {
        accountCode: account.accountCode,
        accountName: account.name,
        accountType: account.type,
        entries: entriesWithBalance,
        totalDebit: entries.reduce((sum, e) => sum + e.debit, 0),
        totalCredit: entries.reduce((sum, e) => sum + e.credit, 0),
        closingBalance: runningBalance,
      };
    });
  }

  /**
   * Compte de résultat (Profit & Loss)
   */
  async getIncomeStatement(organizationId: string, dto: FinancialStatementQueryDto) {
    // Revenus
    const revenues = await this.getAccountBalancesByType(organizationId, 'INCOME', dto.startDate, dto.endDate);

    // Charges
    const expenses = await this.getAccountBalancesByType(organizationId, 'EXPENSE', dto.startDate, dto.endDate);

    const totalRevenues = revenues.reduce((sum, a) => sum + Math.abs(a.balance), 0);
    const totalExpenses = expenses.reduce((sum, a) => sum + a.balance, 0);
    const netIncome = totalRevenues - totalExpenses;

    return {
      period: {
        startDate: dto.startDate,
        endDate: dto.endDate,
      },
      revenues: {
        accounts: revenues,
        total: totalRevenues,
      },
      expenses: {
        accounts: expenses,
        total: totalExpenses,
      },
      netIncome,
    };
  }

  /**
   * Bilan (Balance Sheet)
   */
  async getBalanceSheet(organizationId: string, dto: TrialBalanceQueryDto) {
    const assets = await this.getAccountBalancesByType(organizationId, 'ASSET', null, dto.asOfDate);
    const liabilities = await this.getAccountBalancesByType(organizationId, 'LIABILITY', null, dto.asOfDate);
    const equity = await this.getAccountBalancesByType(organizationId, 'EQUITY', null, dto.asOfDate);

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + Math.abs(a.balance), 0);
    const totalEquity = equity.reduce((sum, a) => sum + Math.abs(a.balance), 0);

    return {
      asOfDate: dto.asOfDate,
      assets: {
        accounts: assets,
        total: totalAssets,
      },
      liabilities: {
        accounts: liabilities,
        total: totalLiabilities,
      },
      equity: {
        accounts: equity,
        total: totalEquity,
      },
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
  }

  // ============ UTILITAIRES ============

  private async getAccountBalancesByType(
    organizationId: string,
    type: AccountType,
    startDate?: Date,
    endDate?: Date,
  ) {
    const accounts = await this.prisma.chartOfAccount.findMany({
      where: {
        organizationId,
        type,
        isActive: true,
      },
      include: {
        debitEntries: {
          where: {
            journalEntry: {
              transactionDate: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
          select: { debit: true },
        },
        creditEntries: {
          where: {
            journalEntry: {
              transactionDate: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
          select: { credit: true },
        },
      },
      orderBy: { accountCode: 'asc' },
    });

    return accounts.map((account) => {
      const totalDebit = account.debitEntries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = account.creditEntries.reduce((sum, e) => sum + e.credit, 0);
      const balance = totalDebit - totalCredit;

      return {
        accountCode: account.accountCode,
        accountName: account.name,
        balance,
      };
    }).filter(a => Math.abs(a.balance) > 0.01); // Exclure les comptes à zéro
  }

  private async generateReferenceNumber(organizationId: string): Promise<string> {
    const count = await this.prisma.journalEntry.count({ where: { organizationId } });
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `JE-${year}${month}-${String(count + 1).padStart(6, '0')}`;
  }

  // ============ CLÔTURE DE PÉRIODE ============

  async closePeriod(organizationId: string, periodEndDate: Date, createdById: string) {
    // Calculer le résultat net
    const incomeStatement = await this.getIncomeStatement(organizationId, {
      startDate: new Date(periodEndDate.getFullYear(), 0, 1), // Début de l'année
      endDate: periodEndDate,
    });

    // Trouver le compte de résultat (bénéfices non distribués)
    const retainedEarningsAccount = await this.prisma.chartOfAccount.findFirst({
      where: {
        organizationId,
        usage: 'RETAINED_EARNINGS',
      },
    });

    if (!retainedEarningsAccount) {
      throw new NotFoundException('Compte de bénéfices non distribués introuvable');
    }

    // Créer une écriture de clôture
    const lines = [];

    // Fermer les revenus (débiter)
    for (const revenue of incomeStatement.revenues.accounts) {
      const account = await this.prisma.chartOfAccount.findFirst({
        where: { organizationId, accountCode: revenue.accountCode },
      });
      
      lines.push({
        accountId: account.id,
        type: 'DEBIT' as const,
        amount: Math.abs(revenue.balance),
        description: 'Clôture des revenus',
      });
    }

    // Fermer les charges (créditer)
    for (const expense of incomeStatement.expenses.accounts) {
      const account = await this.prisma.chartOfAccount.findFirst({
        where: { organizationId, accountCode: expense.accountCode },
      });
      
      lines.push({
        accountId: account.id,
        type: 'CREDIT' as const,
        amount: expense.balance,
        description: 'Clôture des charges',
      });
    }

    // Transférer le résultat net aux bénéfices non distribués
    lines.push({
      accountId: retainedEarningsAccount.id,
      type: incomeStatement.netIncome > 0 ? ('CREDIT' as const) : ('DEBIT' as const),
      amount: Math.abs(incomeStatement.netIncome),
      description: 'Résultat net de la période',
    });

    return this.createJournalEntry(
      {
        transactionDate: periodEndDate,
        description: `Clôture de la période au ${periodEndDate.toISOString().split('T')[0]}`,
        lines,
      },
      organizationId,
      createdById,
    );
  }
}
