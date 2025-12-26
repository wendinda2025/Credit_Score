import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateGLAccountDto,
  UpdateGLAccountDto,
  CreateJournalEntryDto,
  ReverseJournalEntryDto,
  GLAccountQueryDto,
  JournalEntryQueryDto,
  ClosePeriodDto,
} from './dto/accounting.dto';
import { createPaginatedResponse } from '../../common/dto/pagination.dto';
import { AccountType, AccountUsage, Prisma } from '@prisma/client';

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // PLAN COMPTABLE (GL ACCOUNTS)
  // ============================================

  async createGLAccount(dto: CreateGLAccountDto) {
    // Vérifier l'unicité du code
    const existing = await this.prisma.gLAccount.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Un compte avec ce code existe déjà');
    }

    // Si parent spécifié, vérifier et calculer le niveau
    let level = 1;
    let fullCode = dto.code;

    if (dto.parentId) {
      const parent = await this.prisma.gLAccount.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Compte parent non trouvé');
      }

      if (parent.usage !== AccountUsage.HEADER) {
        throw new BadRequestException('Le compte parent doit être de type HEADER');
      }

      level = parent.level + 1;
      fullCode = `${parent.fullCode}.${dto.code}`;
    }

    return this.prisma.gLAccount.create({
      data: {
        ...dto,
        level,
        fullCode,
      },
    });
  }

  async findAllGLAccounts(query: GLAccountQueryDto) {
    const { search, accountType, usage, includeInactive } = query;

    const where: Prisma.GLAccountWhereInput = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (accountType) {
      where.accountType = accountType;
    }

    if (usage) {
      where.usage = usage;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const accounts = await this.prisma.gLAccount.findMany({
      where,
      orderBy: { fullCode: 'asc' },
      include: {
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    return accounts;
  }

  async findGLAccountById(id: string) {
    const account = await this.prisma.gLAccount.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Compte non trouvé');
    }

    return account;
  }

  async updateGLAccount(id: string, dto: UpdateGLAccountDto) {
    await this.findGLAccountById(id);
    return this.prisma.gLAccount.update({
      where: { id },
      data: dto,
    });
  }

  // ============================================
  // ÉCRITURES COMPTABLES
  // ============================================

  async createJournalEntry(dto: CreateJournalEntryDto, userId: string) {
    const transactionDate = new Date(dto.transactionDate);

    // Vérifier que la période n'est pas clôturée
    const closure = await this.prisma.accountingClosure.findFirst({
      where: {
        closingDate: { gte: transactionDate },
      },
    });

    if (closure) {
      throw new BadRequestException('La période comptable est clôturée');
    }

    // Vérifier l'équilibre de l'écriture (Débits = Crédits)
    let totalDebits = new Decimal(0);
    let totalCredits = new Decimal(0);

    for (const line of dto.lines) {
      totalDebits = totalDebits.plus(line.debitAmount);
      totalCredits = totalCredits.plus(line.creditAmount);

      // Vérifier que chaque ligne a soit un débit soit un crédit
      if (line.debitAmount > 0 && line.creditAmount > 0) {
        throw new BadRequestException('Une ligne ne peut pas avoir à la fois un débit et un crédit');
      }

      if (line.debitAmount === 0 && line.creditAmount === 0) {
        throw new BadRequestException('Chaque ligne doit avoir un débit ou un crédit');
      }

      // Vérifier que le compte existe et autorise les écritures
      const account = await this.prisma.gLAccount.findUnique({
        where: { id: line.glAccountId },
      });

      if (!account) {
        throw new NotFoundException(`Compte ${line.glAccountId} non trouvé`);
      }

      if (account.usage === AccountUsage.HEADER) {
        throw new BadRequestException(`Le compte ${account.code} est un compte de titre, pas de détail`);
      }

      if (!account.manualEntriesAllowed && dto.entityType === 'MANUAL') {
        throw new BadRequestException(`Les écritures manuelles ne sont pas autorisées sur le compte ${account.code}`);
      }
    }

    // Vérifier l'équilibre
    if (!totalDebits.equals(totalCredits)) {
      throw new BadRequestException(
        `L'écriture n'est pas équilibrée: Débits=${totalDebits}, Crédits=${totalCredits}`
      );
    }

    // Créer l'écriture
    const transactionId = uuidv4();

    const journalEntry = await this.prisma.journalEntry.create({
      data: {
        transactionId,
        transactionDate,
        description: dto.description,
        entityType: dto.entityType,
        entityId: dto.entityId || '',
        transactionType: dto.transactionType,
        currencyCode: dto.currencyCode || 'XOF',
        createdById: userId,
        lines: {
          create: dto.lines.map((line) => ({
            glAccountId: line.glAccountId,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            description: line.description,
          })),
        },
      },
      include: {
        lines: {
          include: {
            glAccount: {
              select: {
                id: true,
                code: true,
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
    });

    return journalEntry;
  }

  async findAllJournalEntries(query: JournalEntryQueryDto) {
    const { search, fromDate, toDate, glAccountId, includeReversed, sortBy, sortOrder } = query;

    const where: Prisma.JournalEntryWhereInput = {};

    if (!includeReversed) {
      where.isReversed = false;
    }

    if (fromDate || toDate) {
      where.transactionDate = {};
      if (fromDate) {
        where.transactionDate.gte = new Date(fromDate);
      }
      if (toDate) {
        where.transactionDate.lte = new Date(toDate);
      }
    }

    if (glAccountId) {
      where.lines = {
        some: {
          glAccountId,
        },
      };
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { transactionId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [entries, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { transactionDate: 'desc' },
        include: {
          lines: {
            include: {
              glAccount: {
                select: {
                  id: true,
                  code: true,
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
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    return createPaginatedResponse(entries, total, query.page || 1, query.limit || 20);
  }

  async findJournalEntryById(id: string) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            glAccount: true,
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
    });

    if (!entry) {
      throw new NotFoundException('Écriture non trouvée');
    }

    return entry;
  }

  async reverseJournalEntry(id: string, dto: ReverseJournalEntryDto, userId: string) {
    const entry = await this.findJournalEntryById(id);

    if (entry.isReversed) {
      throw new BadRequestException('Cette écriture a déjà été extournée');
    }

    const transactionDate = new Date();

    // Créer l'écriture d'extourne (inverser débits et crédits)
    const reversalLines = entry.lines.map((line) => ({
      glAccountId: line.glAccountId,
      debitAmount: Number(line.creditAmount),
      creditAmount: Number(line.debitAmount),
      description: `Extourne: ${line.description || ''}`,
    }));

    const reversalEntry = await this.prisma.$transaction(async (tx) => {
      // Créer l'écriture d'extourne
      const reversal = await tx.journalEntry.create({
        data: {
          transactionId: uuidv4(),
          transactionDate,
          description: `Extourne de ${entry.transactionId}: ${dto.reason}`,
          entityType: entry.entityType,
          entityId: entry.entityId,
          transactionType: 'REVERSAL',
          currencyCode: entry.currencyCode,
          createdById: userId,
          lines: {
            create: reversalLines,
          },
        },
        include: {
          lines: {
            include: {
              glAccount: true,
            },
          },
        },
      });

      // Marquer l'écriture originale comme extournée
      await tx.journalEntry.update({
        where: { id },
        data: {
          isReversed: true,
          reversalEntryId: reversal.id,
          reversalDate: transactionDate,
          reversalReason: dto.reason,
        },
      });

      return reversal;
    });

    return reversalEntry;
  }

  // ============================================
  // ÉTATS FINANCIERS
  // ============================================

  /**
   * Balance de vérification
   */
  async getTrialBalance(asOfDate: Date) {
    const accounts = await this.prisma.gLAccount.findMany({
      where: {
        usage: AccountUsage.DETAIL,
        isActive: true,
      },
      orderBy: { fullCode: 'asc' },
    });

    const result = [];

    for (const account of accounts) {
      // Calculer les totaux des écritures jusqu'à la date
      const aggregation = await this.prisma.journalEntryLine.aggregate({
        where: {
          glAccountId: account.id,
          journalEntry: {
            transactionDate: { lte: asOfDate },
            isReversed: false,
          },
        },
        _sum: {
          debitAmount: true,
          creditAmount: true,
        },
      });

      const totalDebits = new Decimal(aggregation._sum.debitAmount || 0);
      const totalCredits = new Decimal(aggregation._sum.creditAmount || 0);
      const balance = totalDebits.minus(totalCredits);

      // Inclure seulement les comptes avec mouvement
      if (!totalDebits.isZero() || !totalCredits.isZero()) {
        result.push({
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          accountType: account.accountType,
          debitBalance: balance.isPositive() ? balance.toNumber() : 0,
          creditBalance: balance.isNegative() ? balance.abs().toNumber() : 0,
        });
      }
    }

    // Calculer les totaux
    const totals = result.reduce(
      (acc, item) => ({
        totalDebits: acc.totalDebits + item.debitBalance,
        totalCredits: acc.totalCredits + item.creditBalance,
      }),
      { totalDebits: 0, totalCredits: 0 }
    );

    return {
      asOfDate,
      accounts: result,
      totals,
      isBalanced: Math.abs(totals.totalDebits - totals.totalCredits) < 0.01,
    };
  }

  /**
   * Grand livre d'un compte
   */
  async getGeneralLedger(accountId: string, fromDate: Date, toDate: Date) {
    const account = await this.findGLAccountById(accountId);

    // Solde d'ouverture
    const openingAggregation = await this.prisma.journalEntryLine.aggregate({
      where: {
        glAccountId: accountId,
        journalEntry: {
          transactionDate: { lt: fromDate },
          isReversed: false,
        },
      },
      _sum: {
        debitAmount: true,
        creditAmount: true,
      },
    });

    const openingDebits = new Decimal(openingAggregation._sum.debitAmount || 0);
    const openingCredits = new Decimal(openingAggregation._sum.creditAmount || 0);
    const openingBalance = openingDebits.minus(openingCredits);

    // Écritures de la période
    const entries = await this.prisma.journalEntryLine.findMany({
      where: {
        glAccountId: accountId,
        journalEntry: {
          transactionDate: {
            gte: fromDate,
            lte: toDate,
          },
          isReversed: false,
        },
      },
      include: {
        journalEntry: {
          select: {
            transactionId: true,
            transactionDate: true,
            description: true,
          },
        },
      },
      orderBy: {
        journalEntry: {
          transactionDate: 'asc',
        },
      },
    });

    // Construire le grand livre avec solde progressif
    let runningBalance = openingBalance;
    const ledgerEntries = entries.map((entry) => {
      const debit = new Decimal(Number(entry.debitAmount));
      const credit = new Decimal(Number(entry.creditAmount));
      runningBalance = runningBalance.plus(debit).minus(credit);

      return {
        date: entry.journalEntry.transactionDate,
        transactionId: entry.journalEntry.transactionId,
        description: entry.journalEntry.description,
        debit: debit.toNumber(),
        credit: credit.toNumber(),
        balance: runningBalance.toNumber(),
      };
    });

    // Totaux de la période
    const periodTotals = entries.reduce(
      (acc, entry) => ({
        debits: acc.debits + Number(entry.debitAmount),
        credits: acc.credits + Number(entry.creditAmount),
      }),
      { debits: 0, credits: 0 }
    );

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.accountType,
      },
      period: { fromDate, toDate },
      openingBalance: openingBalance.toNumber(),
      entries: ledgerEntries,
      periodTotals,
      closingBalance: runningBalance.toNumber(),
    };
  }

  /**
   * Compte de résultat
   */
  async getIncomeStatement(fromDate: Date, toDate: Date) {
    // Revenus
    const incomeAccounts = await this.getAccountTypeBalances(AccountType.INCOME, fromDate, toDate);
    
    // Charges
    const expenseAccounts = await this.getAccountTypeBalances(AccountType.EXPENSE, fromDate, toDate);

    const totalIncome = incomeAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const netIncome = totalIncome - totalExpenses;

    return {
      period: { fromDate, toDate },
      income: {
        accounts: incomeAccounts,
        total: totalIncome,
      },
      expenses: {
        accounts: expenseAccounts,
        total: totalExpenses,
      },
      netIncome,
      isProfit: netIncome >= 0,
    };
  }

  private async getAccountTypeBalances(type: AccountType, fromDate: Date, toDate: Date) {
    const accounts = await this.prisma.gLAccount.findMany({
      where: {
        accountType: type,
        usage: AccountUsage.DETAIL,
        isActive: true,
      },
      orderBy: { fullCode: 'asc' },
    });

    const result = [];

    for (const account of accounts) {
      const aggregation = await this.prisma.journalEntryLine.aggregate({
        where: {
          glAccountId: account.id,
          journalEntry: {
            transactionDate: {
              gte: fromDate,
              lte: toDate,
            },
            isReversed: false,
          },
        },
        _sum: {
          debitAmount: true,
          creditAmount: true,
        },
      });

      const debits = new Decimal(aggregation._sum.debitAmount || 0);
      const credits = new Decimal(aggregation._sum.creditAmount || 0);
      
      // Pour les revenus, le solde normal est créditeur
      // Pour les charges, le solde normal est débiteur
      const balance = type === AccountType.INCOME
        ? credits.minus(debits).toNumber()
        : debits.minus(credits).toNumber();

      if (balance !== 0) {
        result.push({
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          balance: Math.abs(balance),
        });
      }
    }

    return result;
  }

  /**
   * Clôture de période comptable
   */
  async closePeriod(dto: ClosePeriodDto, userId: string) {
    const closingDate = new Date(dto.closingDate);

    // Vérifier qu'il n'y a pas déjà une clôture pour cette date ou après
    const existingClosure = await this.prisma.accountingClosure.findFirst({
      where: {
        closingDate: { gte: closingDate },
      },
    });

    if (existingClosure) {
      throw new BadRequestException('Une clôture existe déjà pour cette période ou une période ultérieure');
    }

    // Vérifier que la balance est équilibrée
    const trialBalance = await this.getTrialBalance(closingDate);
    if (!trialBalance.isBalanced) {
      throw new BadRequestException('La balance de vérification n\'est pas équilibrée');
    }

    const closure = await this.prisma.accountingClosure.create({
      data: {
        closingDate,
        comments: dto.comments,
        closedById: userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'ACCOUNTING_PERIOD_CLOSED',
        entityType: 'AccountingClosure',
        entityId: closure.id,
        newValues: { closingDate },
      },
    });

    return closure;
  }
}
