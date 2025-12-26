import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerateReportDto, ReportType } from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReport(organizationId: string, dto: GenerateReportDto) {
    switch (dto.reportType) {
      case ReportType.PORTFOLIO_QUALITY:
        return this.generatePortfolioQualityReport(organizationId, dto.startDate, dto.endDate);
      case ReportType.LOAN_DISBURSEMENT:
        return this.generateLoanDisbursementReport(organizationId, dto.startDate, dto.endDate);
      case ReportType.REPAYMENT_COLLECTION:
        return this.generateRepaymentCollectionReport(organizationId, dto.startDate, dto.endDate);
      case ReportType.SAVINGS_SUMMARY:
        return this.generateSavingsSummaryReport(organizationId, dto.startDate, dto.endDate);
      case ReportType.CLIENT_DEMOGRAPHICS:
        return this.generateClientDemographicsReport(organizationId);
      case ReportType.FINANCIAL_PERFORMANCE:
        return this.generateFinancialPerformanceReport(organizationId, dto.startDate, dto.endDate);
      default:
        throw new Error(`Type de rapport non supporté: ${dto.reportType}`);
    }
  }

  /**
   * Rapport sur la qualité du portefeuille (PAR, taux de remboursement, etc.)
   */
  private async generatePortfolioQualityReport(organizationId: string, startDate: Date, endDate: Date) {
    // Prêts actifs
    const activeLoans = await this.prisma.loan.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      include: {
        repayments: {
          where: {
            dueDate: { lte: endDate },
          },
        },
      },
    });

    // Calcul du PAR (Portfolio at Risk)
    const today = new Date();
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let par30 = 0;
    let par90 = 0;

    for (const loan of activeLoans) {
      for (const repayment of loan.repayments) {
        const outstanding =
          repayment.principalDue +
          repayment.interestDue +
          repayment.feesDue -
          repayment.principalPaid -
          repayment.interestPaid -
          repayment.feesPaid;

        if (outstanding > 0) {
          totalOutstanding += outstanding;

          if (repayment.dueDate < today) {
            const daysOverdue = Math.floor((today.getTime() - repayment.dueDate.getTime()) / (1000 * 60 * 60 * 24));
            totalOverdue += outstanding;

            if (daysOverdue >= 30) {
              par30 += outstanding;
            }
            if (daysOverdue >= 90) {
              par90 += outstanding;
            }
          }
        }
      }
    }

    // Taux de remboursement
    const repaymentsDue = await this.prisma.loanRepayment.aggregate({
      where: {
        loan: { organizationId },
        dueDate: { gte: startDate, lte: endDate },
      },
      _sum: {
        principalDue: true,
        interestDue: true,
      },
    });

    const repaymentsPaid = await this.prisma.loanRepayment.aggregate({
      where: {
        loan: { organizationId },
        dueDate: { gte: startDate, lte: endDate },
      },
      _sum: {
        principalPaid: true,
        interestPaid: true,
      },
    });

    const totalDue = (repaymentsDue._sum.principalDue || 0) + (repaymentsDue._sum.interestDue || 0);
    const totalPaid = (repaymentsPaid._sum.principalPaid || 0) + (repaymentsPaid._sum.interestPaid || 0);
    const repaymentRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

    return {
      reportType: 'PORTFOLIO_QUALITY',
      period: { startDate, endDate },
      generatedAt: new Date(),
      data: {
        activeLoans: activeLoans.length,
        totalOutstanding,
        totalOverdue,
        par: totalOutstanding > 0 ? (totalOverdue / totalOutstanding) * 100 : 0,
        par30: totalOutstanding > 0 ? (par30 / totalOutstanding) * 100 : 0,
        par90: totalOutstanding > 0 ? (par90 / totalOutstanding) * 100 : 0,
        repaymentRate,
      },
    };
  }

  /**
   * Rapport des décaissements de prêts
   */
  private async generateLoanDisbursementReport(organizationId: string, startDate: Date, endDate: Date) {
    const disbursements = await this.prisma.loan.findMany({
      where: {
        organizationId,
        disbursedDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['ACTIVE', 'CLOSED'] },
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            accountNumber: true,
          },
        },
        loanProduct: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { disbursedDate: 'desc' },
    });

    const summary = {
      totalDisbursements: disbursements.length,
      totalAmount: disbursements.reduce((sum, l) => sum + (l.disbursementAmount || 0), 0),
      averageAmount: disbursements.length > 0 
        ? disbursements.reduce((sum, l) => sum + (l.disbursementAmount || 0), 0) / disbursements.length 
        : 0,
    };

    return {
      reportType: 'LOAN_DISBURSEMENT',
      period: { startDate, endDate },
      generatedAt: new Date(),
      summary,
      disbursements: disbursements.map((l) => ({
        accountNumber: l.accountNumber,
        clientName: `${l.client.firstName} ${l.client.lastName}`,
        clientAccountNumber: l.client.accountNumber,
        product: l.loanProduct.name,
        amount: l.disbursementAmount,
        disbursementDate: l.disbursedDate,
        numberOfInstallments: l.numberOfInstallments,
        interestRate: l.interestRate,
      })),
    };
  }

  /**
   * Rapport des encaissements (remboursements)
   */
  private async generateRepaymentCollectionReport(organizationId: string, startDate: Date, endDate: Date) {
    const transactions = await this.prisma.loanTransaction.findMany({
      where: {
        loan: { organizationId },
        transactionType: 'REPAYMENT',
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        loan: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                accountNumber: true,
              },
            },
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    });

    const summary = {
      totalCollections: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
      averageAmount: transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length 
        : 0,
    };

    return {
      reportType: 'REPAYMENT_COLLECTION',
      period: { startDate, endDate },
      generatedAt: new Date(),
      summary,
      collections: transactions.map((t) => ({
        transactionDate: t.transactionDate,
        clientName: `${t.loan.client.firstName} ${t.loan.client.lastName}`,
        loanAccountNumber: t.loan.accountNumber,
        amount: t.amount,
        paymentMethod: t.paymentMethod,
        reference: t.reference,
      })),
    };
  }

  /**
   * Rapport de synthèse de l'épargne
   */
  private async generateSavingsSummaryReport(organizationId: string, startDate: Date, endDate: Date) {
    const accounts = await this.prisma.savingsAccount.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            accountNumber: true,
          },
        },
        savingsProduct: {
          select: {
            name: true,
          },
        },
      },
    });

    // Transactions dans la période
    const transactions = await this.prisma.savingsTransaction.findMany({
      where: {
        savingsAccount: { organizationId },
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const deposits = transactions.filter((t) => t.transactionType === 'DEPOSIT');
    const withdrawals = transactions.filter((t) => t.transactionType === 'WITHDRAWAL');
    const interest = transactions.filter((t) => t.transactionType === 'INTEREST_POSTING');

    const summary = {
      totalAccounts: accounts.length,
      totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
      averageBalance: accounts.length > 0 ? accounts.reduce((sum, a) => sum + a.balance, 0) / accounts.length : 0,
      totalDeposits: deposits.reduce((sum, t) => sum + t.amount, 0),
      totalWithdrawals: withdrawals.reduce((sum, t) => sum + t.amount, 0),
      totalInterestPosted: interest.reduce((sum, t) => sum + t.amount, 0),
      numberOfDeposits: deposits.length,
      numberOfWithdrawals: withdrawals.length,
    };

    return {
      reportType: 'SAVINGS_SUMMARY',
      period: { startDate, endDate },
      generatedAt: new Date(),
      summary,
      accounts: accounts.map((a) => ({
        accountNumber: a.accountNumber,
        clientName: `${a.client.firstName} ${a.client.lastName}`,
        product: a.savingsProduct.name,
        balance: a.balance,
        interestRate: a.nominalAnnualInterestRate,
        activatedDate: a.activatedDate,
      })),
    };
  }

  /**
   * Rapport démographique des clients
   */
  private async generateClientDemographicsReport(organizationId: string) {
    const clients = await this.prisma.client.findMany({
      where: { organizationId },
      select: {
        type: true,
        gender: true,
        status: true,
      },
    });

    const byType = clients.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byGender = clients.reduce((acc, c) => {
      if (c.gender) acc[c.gender] = (acc[c.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = clients.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      reportType: 'CLIENT_DEMOGRAPHICS',
      generatedAt: new Date(),
      data: {
        totalClients: clients.length,
        byType,
        byGender,
        byStatus,
      },
    };
  }

  /**
   * Rapport de performance financière
   */
  private async generateFinancialPerformanceReport(organizationId: string, startDate: Date, endDate: Date) {
    // Revenus d'intérêts
    const interestIncome = await this.prisma.loanRepayment.aggregate({
      where: {
        loan: { organizationId },
        paidDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { interestPaid: true },
    });

    // Revenus de frais
    const feeIncome = await this.prisma.loanRepayment.aggregate({
      where: {
        loan: { organizationId },
        paidDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { feesPaid: true, penaltyPaid: true },
    });

    // Charge d'intérêts sur l'épargne
    const interestExpense = await this.prisma.savingsTransaction.aggregate({
      where: {
        savingsAccount: { organizationId },
        transactionType: 'INTEREST_POSTING',
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
    });

    const totalRevenue = (interestIncome._sum.interestPaid || 0) + (feeIncome._sum.feesPaid || 0) + (feeIncome._sum.penaltyPaid || 0);
    const totalExpense = interestExpense._sum.amount || 0;
    const netIncome = totalRevenue - totalExpense;

    return {
      reportType: 'FINANCIAL_PERFORMANCE',
      period: { startDate, endDate },
      generatedAt: new Date(),
      data: {
        revenue: {
          interestIncome: interestIncome._sum.interestPaid || 0,
          feeIncome: (feeIncome._sum.feesPaid || 0) + (feeIncome._sum.penaltyPaid || 0),
          totalRevenue,
        },
        expenses: {
          interestExpense: totalExpense,
          totalExpense,
        },
        netIncome,
      },
    };
  }

  /**
   * Dashboard général
   */
  async getDashboard(organizationId: string) {
    const [
      clientsCount,
      activeLoansCount,
      activeSavingsCount,
      totalDisbursed,
      totalOutstanding,
      totalSavings,
      overdueLoans,
    ] = await Promise.all([
      this.prisma.client.count({
        where: { organizationId, status: 'ACTIVE' },
      }),
      this.prisma.loan.count({
        where: { organizationId, status: 'ACTIVE' },
      }),
      this.prisma.savingsAccount.count({
        where: { organizationId, status: 'ACTIVE' },
      }),
      this.prisma.loan.aggregate({
        where: { organizationId, status: { in: ['ACTIVE', 'CLOSED'] } },
        _sum: { disbursementAmount: true },
      }),
      this.prisma.loanRepayment.aggregate({
        where: {
          loan: { organizationId, status: 'ACTIVE' },
          status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        },
        _sum: { principalDue: true, interestDue: true },
      }),
      this.prisma.savingsAccount.aggregate({
        where: { organizationId, status: 'ACTIVE' },
        _sum: { balance: true },
      }),
      this.prisma.loanRepayment.count({
        where: {
          loan: { organizationId, status: 'ACTIVE' },
          status: 'OVERDUE',
        },
      }),
    ]);

    // Calcul du PAR
    const overdueAmount = await this.prisma.loanRepayment.aggregate({
      where: {
        loan: { organizationId, status: 'ACTIVE' },
        status: 'OVERDUE',
      },
      _sum: { principalDue: true },
    });

    const totalOutstandingAmount =
      (totalOutstanding._sum.principalDue || 0) + (totalOutstanding._sum.interestDue || 0);

    const par =
      totalOutstandingAmount > 0 ? ((overdueAmount._sum.principalDue || 0) / totalOutstandingAmount) * 100 : 0;

    return {
      overview: {
        totalClients: clientsCount,
        activeLoans: activeLoansCount,
        activeSavingsAccounts: activeSavingsCount,
      },
      loans: {
        totalDisbursed: totalDisbursed._sum.disbursementAmount || 0,
        totalOutstanding: totalOutstandingAmount,
        overdueLoans,
        portfolioAtRisk: Math.round(par * 100) / 100,
      },
      savings: {
        totalBalance: totalSavings._sum.balance || 0,
      },
    };
  }
}
