import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Decimal from 'decimal.js';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcule le Portfolio at Risk (PAR)
   * PAR = Montant des prêts en retard / Montant total du portefeuille
   */
  async calculatePAR(organizationId: string, daysPastDue: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysPastDue);

    // Prêts en retard
    const overdueLoans = await this.prisma.loan.findMany({
      where: {
        organizationId,
        status: {
          in: ['DISBURSED', 'ACTIVE'],
        },
        installments: {
          some: {
            dueDate: { lt: cutoffDate },
            isPaid: false,
          },
        },
      },
      include: {
        installments: {
          where: {
            dueDate: { lt: cutoffDate },
            isPaid: false,
          },
        },
      },
    });

    let overdueAmount = new Decimal(0);
    overdueLoans.forEach((loan) => {
      loan.installments.forEach((inst) => {
        const remaining = inst.totalDue.minus(inst.totalPaid);
        overdueAmount = overdueAmount.plus(remaining);
      });
    });

    // Portefeuille total
    const totalPortfolio = await this.prisma.loan.aggregate({
      where: {
        organizationId,
        status: {
          in: ['DISBURSED', 'ACTIVE'],
        },
      },
      _sum: {
        principalAmount: true,
      },
    });

    const totalPortfolioAmount =
      totalPortfolio._sum.principalAmount || new Decimal(0);

    const par =
      totalPortfolioAmount.greaterThan(0)
        ? overdueAmount.div(totalPortfolioAmount).mul(100)
        : new Decimal(0);

    return {
      overdueAmount: overdueAmount.toNumber(),
      totalPortfolio: totalPortfolioAmount.toNumber(),
      par: par.toNumber(),
      overdueLoansCount: overdueLoans.length,
    };
  }

  /**
   * Taux de remboursement
   */
  async calculateRepaymentRate(organizationId: string, startDate: Date, endDate: Date) {
    const loans = await this.prisma.loan.findMany({
      where: {
        organizationId,
        disbursedDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['DISBURSED', 'ACTIVE', 'CLOSED'],
        },
      },
      include: {
        installments: true,
        repayments: true,
      },
    });

    let totalDue = new Decimal(0);
    let totalPaid = new Decimal(0);

    loans.forEach((loan) => {
      loan.installments.forEach((inst) => {
        totalDue = totalDue.plus(inst.totalDue);
        totalPaid = totalPaid.plus(inst.totalPaid);
      });
    });

    const repaymentRate =
      totalDue.greaterThan(0)
        ? totalPaid.div(totalDue).mul(100)
        : new Decimal(0);

    return {
      totalDue: totalDue.toNumber(),
      totalPaid: totalPaid.toNumber(),
      repaymentRate: repaymentRate.toNumber(),
      loansCount: loans.length,
    };
  }

  /**
   * Tableau de bord principal
   */
  async getDashboard(organizationId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Statistiques clients
    const totalClients = await this.prisma.client.count({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
    });

    // Statistiques prêts
    const activeLoans = await this.prisma.loan.count({
      where: {
        organizationId,
        status: {
          in: ['DISBURSED', 'ACTIVE'],
        },
      },
    });

    const totalLoanPortfolio = await this.prisma.loan.aggregate({
      where: {
        organizationId,
        status: {
          in: ['DISBURSED', 'ACTIVE'],
        },
      },
      _sum: {
        principalAmount: true,
      },
    });

    // Prêts du mois
    const loansThisMonth = await this.prisma.loan.count({
      where: {
        organizationId,
        disbursedDate: {
          gte: startOfMonth,
        },
      },
    });

    // Statistiques épargne
    const totalSavingsAccounts = await this.prisma.savingsAccount.count({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
    });

    const totalSavingsBalance = await this.prisma.savingsAccount.aggregate({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      _sum: {
        balance: true,
      },
    });

    // PAR
    const par = await this.calculatePAR(organizationId);

    return {
      clients: {
        total: totalClients,
      },
      loans: {
        active: activeLoans,
        totalPortfolio: totalLoanPortfolio._sum.principalAmount?.toNumber() || 0,
        disbursedThisMonth: loansThisMonth,
      },
      savings: {
        totalAccounts: totalSavingsAccounts,
        totalBalance: totalSavingsBalance._sum.balance?.toNumber() || 0,
      },
      portfolio: {
        par: par.par,
        overdueAmount: par.overdueAmount,
        overdueLoans: par.overdueLoansCount,
      },
    };
  }
}
