import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanStatus, ClientStatus } from '@prisma/client';

export interface DashboardMetrics {
  clients: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  loans: {
    totalDisbursed: number;
    totalOutstanding: number;
    activeLoans: number;
    pendingApproval: number;
    inArrears: number;
  };
  savings: {
    totalDeposits: number;
    totalBalance: number;
    activeAccounts: number;
  };
  performance: {
    par30: number; // Portfolio At Risk > 30 days
    par90: number; // Portfolio At Risk > 90 days
    repaymentRate: number;
    disbursementThisMonth: number;
    collectionsThisMonth: number;
  };
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tableau de bord principal
   */
  async getDashboardMetrics(branchId?: string): Promise<DashboardMetrics> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Clients
    const [totalClients, activeClients, newClientsThisMonth] = await Promise.all([
      this.prisma.client.count({
        where: branchId ? { branchId } : undefined,
      }),
      this.prisma.client.count({
        where: {
          status: ClientStatus.ACTIVE,
          ...(branchId ? { branchId } : {}),
        },
      }),
      this.prisma.client.count({
        where: {
          createdAt: { gte: startOfMonth },
          ...(branchId ? { branchId } : {}),
        },
      }),
    ]);

    // Prêts
    const [activeLoans, pendingLoans, loansInArrears] = await Promise.all([
      this.prisma.loan.count({
        where: {
          status: LoanStatus.ACTIVE,
          ...(branchId ? { branchId } : {}),
        },
      }),
      this.prisma.loan.count({
        where: {
          status: LoanStatus.PENDING_APPROVAL,
          ...(branchId ? { branchId } : {}),
        },
      }),
      this.prisma.loan.count({
        where: {
          status: LoanStatus.ACTIVE,
          daysInArrears: { gt: 0 },
          ...(branchId ? { branchId } : {}),
        },
      }),
    ]);

    // Agrégations prêts
    const loanAggregations = await this.prisma.loan.aggregate({
      where: {
        status: LoanStatus.ACTIVE,
        ...(branchId ? { branchId } : {}),
      },
      _sum: {
        disbursedAmount: true,
        totalOutstanding: true,
      },
    });

    // Épargne
    const savingsAggregations = await this.prisma.savingsAccount.aggregate({
      where: {
        status: 'ACTIVE',
        ...(branchId ? { branchId } : {}),
      },
      _sum: {
        totalDeposits: true,
        accountBalance: true,
      },
      _count: true,
    });

    // Performance - PAR
    const [par30Count, par90Count, totalActivePortfolio] = await Promise.all([
      this.prisma.loan.aggregate({
        where: {
          status: LoanStatus.ACTIVE,
          daysInArrears: { gt: 30 },
          ...(branchId ? { branchId } : {}),
        },
        _sum: { totalOutstanding: true },
      }),
      this.prisma.loan.aggregate({
        where: {
          status: LoanStatus.ACTIVE,
          daysInArrears: { gt: 90 },
          ...(branchId ? { branchId } : {}),
        },
        _sum: { totalOutstanding: true },
      }),
      this.prisma.loan.aggregate({
        where: {
          status: LoanStatus.ACTIVE,
          ...(branchId ? { branchId } : {}),
        },
        _sum: { totalOutstanding: true },
      }),
    ]);

    const totalOutstanding = Number(totalActivePortfolio._sum.totalOutstanding || 0);
    const par30 = totalOutstanding > 0
      ? (Number(par30Count._sum.totalOutstanding || 0) / totalOutstanding) * 100
      : 0;
    const par90 = totalOutstanding > 0
      ? (Number(par90Count._sum.totalOutstanding || 0) / totalOutstanding) * 100
      : 0;

    // Décaissements et collectes du mois
    const [disbursementsThisMonth, collectionsThisMonth] = await Promise.all([
      this.prisma.loanTransaction.aggregate({
        where: {
          transactionType: 'DISBURSEMENT',
          transactionDate: { gte: startOfMonth },
          ...(branchId ? { loan: { branchId } } : {}),
        },
        _sum: { amount: true },
      }),
      this.prisma.loanTransaction.aggregate({
        where: {
          transactionType: 'REPAYMENT',
          transactionDate: { gte: startOfMonth },
          ...(branchId ? { loan: { branchId } } : {}),
        },
        _sum: { amount: true },
      }),
    ]);

    // Taux de remboursement
    const [totalExpectedThisMonth, totalCollectedThisMonth] = await Promise.all([
      this.prisma.loanSchedule.aggregate({
        where: {
          dueDate: {
            gte: startOfMonth,
            lte: today,
          },
          ...(branchId ? { loan: { branchId } } : {}),
        },
        _sum: { totalDue: true },
      }),
      this.prisma.loanSchedule.aggregate({
        where: {
          dueDate: {
            gte: startOfMonth,
            lte: today,
          },
          ...(branchId ? { loan: { branchId } } : {}),
        },
        _sum: { totalPaid: true },
      }),
    ]);

    const expectedThisMonth = Number(totalExpectedThisMonth._sum.totalDue || 0);
    const collectedThisMonth = Number(totalCollectedThisMonth._sum.totalPaid || 0);
    const repaymentRate = expectedThisMonth > 0
      ? (collectedThisMonth / expectedThisMonth) * 100
      : 100;

    return {
      clients: {
        total: totalClients,
        active: activeClients,
        newThisMonth: newClientsThisMonth,
      },
      loans: {
        totalDisbursed: Number(loanAggregations._sum.disbursedAmount || 0),
        totalOutstanding: totalOutstanding,
        activeLoans,
        pendingApproval: pendingLoans,
        inArrears: loansInArrears,
      },
      savings: {
        totalDeposits: Number(savingsAggregations._sum.totalDeposits || 0),
        totalBalance: Number(savingsAggregations._sum.accountBalance || 0),
        activeAccounts: savingsAggregations._count,
      },
      performance: {
        par30: Math.round(par30 * 100) / 100,
        par90: Math.round(par90 * 100) / 100,
        repaymentRate: Math.round(repaymentRate * 100) / 100,
        disbursementThisMonth: Number(disbursementsThisMonth._sum.amount || 0),
        collectionsThisMonth: Number(collectionsThisMonth._sum.amount || 0),
      },
    };
  }

  /**
   * Rapport PAR détaillé (Portfolio At Risk)
   */
  async getPARReport(asOfDate: Date, branchId?: string) {
    const loans = await this.prisma.loan.findMany({
      where: {
        status: LoanStatus.ACTIVE,
        daysInArrears: { gt: 0 },
        ...(branchId ? { branchId } : {}),
      },
      include: {
        client: {
          select: {
            accountNumber: true,
            firstName: true,
            lastName: true,
            businessName: true,
            clientType: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { daysInArrears: 'desc' },
    });

    // Grouper par tranches de retard
    const buckets = {
      '1-30': { count: 0, amount: 0 },
      '31-60': { count: 0, amount: 0 },
      '61-90': { count: 0, amount: 0 },
      '91-180': { count: 0, amount: 0 },
      '180+': { count: 0, amount: 0 },
    };

    for (const loan of loans) {
      const outstanding = Number(loan.totalOutstanding);
      const days = loan.daysInArrears;

      if (days <= 30) {
        buckets['1-30'].count++;
        buckets['1-30'].amount += outstanding;
      } else if (days <= 60) {
        buckets['31-60'].count++;
        buckets['31-60'].amount += outstanding;
      } else if (days <= 90) {
        buckets['61-90'].count++;
        buckets['61-90'].amount += outstanding;
      } else if (days <= 180) {
        buckets['91-180'].count++;
        buckets['91-180'].amount += outstanding;
      } else {
        buckets['180+'].count++;
        buckets['180+'].amount += outstanding;
      }
    }

    // Total du portefeuille
    const totalPortfolio = await this.prisma.loan.aggregate({
      where: {
        status: LoanStatus.ACTIVE,
        ...(branchId ? { branchId } : {}),
      },
      _sum: { totalOutstanding: true },
    });

    const totalOutstanding = Number(totalPortfolio._sum.totalOutstanding || 0);

    return {
      asOfDate,
      totalPortfolio: totalOutstanding,
      totalAtRisk: loans.reduce((sum, l) => sum + Number(l.totalOutstanding), 0),
      parRatio: totalOutstanding > 0
        ? (loans.reduce((sum, l) => sum + Number(l.totalOutstanding), 0) / totalOutstanding) * 100
        : 0,
      buckets,
      loans: loans.map((l) => ({
        loanId: l.id,
        accountNumber: l.accountNumber,
        clientName: l.client.clientType === 'INDIVIDUAL'
          ? `${l.client.firstName} ${l.client.lastName}`
          : l.client.businessName,
        branch: l.branch.name,
        disbursedAmount: Number(l.disbursedAmount),
        outstanding: Number(l.totalOutstanding),
        daysInArrears: l.daysInArrears,
        arrearsAmount: Number(l.arrearsAmount),
      })),
    };
  }

  /**
   * Rapport de production des prêts
   */
  async getLoanProductionReport(fromDate: Date, toDate: Date, branchId?: string) {
    const disbursements = await this.prisma.loan.findMany({
      where: {
        status: { in: [LoanStatus.ACTIVE, LoanStatus.CLOSED] },
        actualDisbursementDate: {
          gte: fromDate,
          lte: toDate,
        },
        ...(branchId ? { branchId } : {}),
      },
      include: {
        loanProduct: {
          select: {
            name: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
      },
    });

    // Grouper par produit
    const byProduct: Record<string, { count: number; amount: number }> = {};
    // Grouper par agence
    const byBranch: Record<string, { count: number; amount: number }> = {};

    for (const loan of disbursements) {
      const amount = Number(loan.disbursedAmount);

      // Par produit
      const productName = loan.loanProduct.name;
      if (!byProduct[productName]) {
        byProduct[productName] = { count: 0, amount: 0 };
      }
      byProduct[productName].count++;
      byProduct[productName].amount += amount;

      // Par agence
      const branchName = loan.branch.name;
      if (!byBranch[branchName]) {
        byBranch[branchName] = { count: 0, amount: 0 };
      }
      byBranch[branchName].count++;
      byBranch[branchName].amount += amount;
    }

    const totalCount = disbursements.length;
    const totalAmount = disbursements.reduce((sum, l) => sum + Number(l.disbursedAmount), 0);

    return {
      period: { fromDate, toDate },
      summary: {
        totalLoans: totalCount,
        totalAmount,
        averageAmount: totalCount > 0 ? totalAmount / totalCount : 0,
      },
      byProduct: Object.entries(byProduct).map(([name, data]) => ({
        productName: name,
        ...data,
        percentage: (data.amount / totalAmount) * 100,
      })),
      byBranch: Object.entries(byBranch).map(([name, data]) => ({
        branchName: name,
        ...data,
        percentage: (data.amount / totalAmount) * 100,
      })),
    };
  }

  /**
   * Rapport des collections
   */
  async getCollectionsReport(fromDate: Date, toDate: Date, branchId?: string) {
    const collections = await this.prisma.loanTransaction.findMany({
      where: {
        transactionType: 'REPAYMENT',
        transactionDate: {
          gte: fromDate,
          lte: toDate,
        },
        ...(branchId ? { loan: { branchId } } : {}),
      },
      include: {
        loan: {
          include: {
            branch: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Grouper par jour
    const byDate: Record<string, { count: number; principal: number; interest: number; total: number }> = {};
    
    for (const txn of collections) {
      const dateKey = txn.transactionDate.toISOString().split('T')[0];
      if (!byDate[dateKey]) {
        byDate[dateKey] = { count: 0, principal: 0, interest: 0, total: 0 };
      }
      byDate[dateKey].count++;
      byDate[dateKey].principal += Number(txn.principalPortion);
      byDate[dateKey].interest += Number(txn.interestPortion);
      byDate[dateKey].total += Number(txn.amount);
    }

    const totalCollected = collections.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalPrincipal = collections.reduce((sum, t) => sum + Number(t.principalPortion), 0);
    const totalInterest = collections.reduce((sum, t) => sum + Number(t.interestPortion), 0);

    return {
      period: { fromDate, toDate },
      summary: {
        totalTransactions: collections.length,
        totalCollected,
        principalCollected: totalPrincipal,
        interestCollected: totalInterest,
      },
      byDate: Object.entries(byDate)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }
}
