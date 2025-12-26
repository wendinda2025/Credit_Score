import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLoanProductDto, CreateLoanApplicationDto, DisburseLoanDto, RepayLoanDto } from '../dto/loan.dto';
import { AmortizationService } from './amortization.service';
import { LoanStatus, RepaymentStatus } from '@prisma/client';

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly amortizationService: AmortizationService,
  ) {}

  // ============ PRODUITS DE PRÊT ============

  async createLoanProduct(dto: CreateLoanProductDto, organizationId: string) {
    return this.prisma.loanProduct.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  async findAllLoanProducts(organizationId: string) {
    return this.prisma.loanProduct.findMany({
      where: { organizationId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneLoanProduct(id: string, organizationId: string) {
    const product = await this.prisma.loanProduct.findFirst({
      where: { id, organizationId },
    });

    if (!product) {
      throw new NotFoundException(`Produit de prêt #${id} introuvable`);
    }

    return product;
  }

  async updateLoanProduct(id: string, dto: Partial<CreateLoanProductDto>, organizationId: string) {
    await this.findOneLoanProduct(id, organizationId);

    return this.prisma.loanProduct.update({
      where: { id },
      data: dto,
    });
  }

  async deleteLoanProduct(id: string, organizationId: string) {
    await this.findOneLoanProduct(id, organizationId);

    // Soft delete
    return this.prisma.loanProduct.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ============ DEMANDES DE PRÊT ============

  async createLoanApplication(dto: CreateLoanApplicationDto, organizationId: string, createdById: string) {
    // Vérifier le produit
    const product = await this.findOneLoanProduct(dto.loanProductId, organizationId);

    // Vérifier le client
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, organizationId },
    });

    if (!client) {
      throw new NotFoundException(`Client #${dto.clientId} introuvable`);
    }

    // Validation des montants
    if (dto.principalAmount < product.minPrincipal || dto.principalAmount > product.maxPrincipal) {
      throw new BadRequestException(
        `Le montant doit être entre ${product.minPrincipal} et ${product.maxPrincipal}`,
      );
    }

    if (dto.numberOfInstallments < product.minInstallments || dto.numberOfInstallments > product.maxInstallments) {
      throw new BadRequestException(
        `Le nombre d'échéances doit être entre ${product.minInstallments} et ${product.maxInstallments}`,
      );
    }

    // Créer la demande
    return this.prisma.loan.create({
      data: {
        ...dto,
        organizationId,
        status: 'PENDING',
        createdById,
        accountNumber: await this.generateLoanAccountNumber(organizationId),
      },
      include: {
        client: true,
        loanProduct: true,
      },
    });
  }

  async findAllLoans(organizationId: string, filters?: any) {
    return this.prisma.loan.findMany({
      where: {
        organizationId,
        ...filters,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            accountNumber: true,
          },
        },
        loanProduct: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneLoan(id: string, organizationId: string) {
    const loan = await this.prisma.loan.findFirst({
      where: { id, organizationId },
      include: {
        client: true,
        loanProduct: true,
        repayments: {
          orderBy: { installmentNumber: 'asc' },
        },
        transactions: {
          orderBy: { transactionDate: 'desc' },
        },
      },
    });

    if (!loan) {
      throw new NotFoundException(`Prêt #${id} introuvable`);
    }

    return loan;
  }

  // ============ APPROBATION DE PRÊT ============

  async approveLoan(id: string, organizationId: string, approvedById: string, approvedDate: Date) {
    const loan = await this.findOneLoan(id, organizationId);

    if (loan.status !== 'PENDING') {
      throw new BadRequestException('Seuls les prêts en attente peuvent être approuvés');
    }

    return this.prisma.loan.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById,
        approvedDate,
      },
    });
  }

  async rejectLoan(id: string, organizationId: string, rejectedById: string, rejectionReason: string) {
    const loan = await this.findOneLoan(id, organizationId);

    if (loan.status !== 'PENDING') {
      throw new BadRequestException('Seuls les prêts en attente peuvent être rejetés');
    }

    return this.prisma.loan.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedById,
        rejectionReason,
      },
    });
  }

  // ============ DÉCAISSEMENT ============

  async disburseLoan(id: string, dto: DisburseLoanDto, organizationId: string, disbursedById: string) {
    const loan = await this.findOneLoan(id, organizationId);

    if (loan.status !== 'APPROVED') {
      throw new BadRequestException('Seuls les prêts approuvés peuvent être décaissés');
    }

    // Générer le calendrier d'amortissement
    const schedule = this.amortizationService.calculateRepaymentSchedule(
      loan.principalAmount,
      loan.interestRate,
      loan.numberOfInstallments,
      loan.repaymentFrequency,
      loan.interestMethod,
      dto.disbursementDate,
      loan.fees,
    );

    // Transaction pour décaisser et créer le calendrier
    return this.prisma.$transaction(async (tx) => {
      // Mettre à jour le prêt
      const updatedLoan = await tx.loan.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          disbursedDate: dto.disbursementDate,
          disbursedById,
          disbursementAmount: dto.amount || loan.principalAmount,
        },
      });

      // Créer le calendrier de remboursement
      await tx.loanRepayment.createMany({
        data: schedule.map((item) => ({
          loanId: id,
          installmentNumber: item.installmentNumber,
          dueDate: item.dueDate,
          principalDue: item.principal,
          interestDue: item.interest,
          feesDue: item.fees,
          totalDue: item.total,
          status: 'PENDING' as RepaymentStatus,
        })),
      });

      // Créer la transaction de décaissement
      await tx.loanTransaction.create({
        data: {
          loanId: id,
          transactionType: 'DISBURSEMENT',
          amount: dto.amount || loan.principalAmount,
          transactionDate: dto.disbursementDate,
          paymentMethod: dto.paymentMethod,
          notes: dto.notes,
          createdById: disbursedById,
        },
      });

      // TODO: Créer les écritures comptables
      // Débit: Compte prêt client
      // Crédit: Compte caisse/banque

      return updatedLoan;
    });
  }

  // ============ REMBOURSEMENT ============

  async repayLoan(id: string, dto: RepayLoanDto, organizationId: string, receivedById: string) {
    const loan = await this.findOneLoan(id, organizationId);

    if (loan.status !== 'ACTIVE') {
      throw new BadRequestException('Seuls les prêts actifs peuvent recevoir des remboursements');
    }

    return this.prisma.$transaction(async (tx) => {
      let remainingAmount = dto.amount;

      // Récupérer les échéances en retard d'abord, puis les échéances courantes
      const pendingRepayments = await tx.loanRepayment.findMany({
        where: {
          loanId: id,
          status: { in: ['PENDING', 'PARTIAL'] },
        },
        orderBy: [{ dueDate: 'asc' }, { installmentNumber: 'asc' }],
      });

      // Appliquer le paiement aux échéances
      for (const repayment of pendingRepayments) {
        if (remainingAmount <= 0) break;

        const totalDue =
          repayment.principalDue +
          repayment.interestDue +
          repayment.feesDue +
          (repayment.penaltyDue || 0) -
          repayment.principalPaid -
          repayment.interestPaid -
          repayment.feesPaid -
          (repayment.penaltyPaid || 0);

        if (remainingAmount >= totalDue) {
          // Paiement complet de l'échéance
          await tx.loanRepayment.update({
            where: { id: repayment.id },
            data: {
              principalPaid: repayment.principalDue,
              interestPaid: repayment.interestDue,
              feesPaid: repayment.feesDue,
              penaltyPaid: repayment.penaltyDue || 0,
              paidDate: dto.paymentDate,
              status: 'PAID',
            },
          });

          remainingAmount -= totalDue;
        } else {
          // Paiement partiel - appliquer selon la priorité : pénalités > intérêts > frais > principal
          let amount = remainingAmount;
          let penaltyPaid = repayment.penaltyPaid || 0;
          let interestPaid = repayment.interestPaid;
          let feesPaid = repayment.feesPaid;
          let principalPaid = repayment.principalPaid;

          // 1. Pénalités
          const penaltyDue = (repayment.penaltyDue || 0) - penaltyPaid;
          if (amount > 0 && penaltyDue > 0) {
            const payment = Math.min(amount, penaltyDue);
            penaltyPaid += payment;
            amount -= payment;
          }

          // 2. Intérêts
          const interestDue = repayment.interestDue - interestPaid;
          if (amount > 0 && interestDue > 0) {
            const payment = Math.min(amount, interestDue);
            interestPaid += payment;
            amount -= payment;
          }

          // 3. Frais
          const feesDue = repayment.feesDue - feesPaid;
          if (amount > 0 && feesDue > 0) {
            const payment = Math.min(amount, feesDue);
            feesPaid += payment;
            amount -= payment;
          }

          // 4. Principal
          const principalDue = repayment.principalDue - principalPaid;
          if (amount > 0 && principalDue > 0) {
            const payment = Math.min(amount, principalDue);
            principalPaid += payment;
            amount -= payment;
          }

          await tx.loanRepayment.update({
            where: { id: repayment.id },
            data: {
              principalPaid,
              interestPaid,
              feesPaid,
              penaltyPaid,
              status: 'PARTIAL',
            },
          });

          remainingAmount = 0;
        }
      }

      // Créer la transaction de remboursement
      const transaction = await tx.loanTransaction.create({
        data: {
          loanId: id,
          transactionType: 'REPAYMENT',
          amount: dto.amount,
          transactionDate: dto.paymentDate,
          paymentMethod: dto.paymentMethod,
          reference: dto.reference,
          notes: dto.notes,
          createdById: receivedById,
        },
      });

      // Vérifier si le prêt est entièrement remboursé
      const remainingRepayments = await tx.loanRepayment.count({
        where: {
          loanId: id,
          status: { in: ['PENDING', 'PARTIAL'] },
        },
      });

      if (remainingRepayments === 0) {
        await tx.loan.update({
          where: { id },
          data: {
            status: 'CLOSED',
            closedDate: dto.paymentDate,
          },
        });
      }

      // TODO: Créer les écritures comptables
      // Débit: Compte caisse/banque
      // Crédit: Compte prêt client (principal)
      // Crédit: Compte produits d'intérêts

      return transaction;
    });
  }

  // ============ PÉNALITÉS ============

  async calculateAndApplyPenalties(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Trouver toutes les échéances en retard
    const overdueRepayments = await this.prisma.loanRepayment.findMany({
      where: {
        loan: { organizationId },
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: today },
      },
      include: {
        loan: {
          include: {
            loanProduct: true,
          },
        },
      },
    });

    const updates = [];

    for (const repayment of overdueRepayments) {
      const product = repayment.loan.loanProduct;
      
      if (product.penaltyRate && product.penaltyRate > 0) {
        const daysOverdue = Math.floor(
          (today.getTime() - repayment.dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        const overdueAmount =
          repayment.principalDue +
          repayment.interestDue +
          repayment.feesDue -
          repayment.principalPaid -
          repayment.interestPaid -
          repayment.feesPaid;

        const penalty = this.amortizationService.calculatePenalty(
          overdueAmount,
          daysOverdue,
          product.penaltyRate,
          'PERCENTAGE_OF_AMOUNT',
        );

        updates.push(
          this.prisma.loanRepayment.update({
            where: { id: repayment.id },
            data: {
              penaltyDue: penalty,
              status: 'OVERDUE',
            },
          }),
        );
      }
    }

    await Promise.all(updates);

    return { processed: updates.length };
  }

  // ============ RÉÉCHELONNEMENT ============

  async rescheduleLoan(
    id: string,
    newInstallments: number,
    newInterestRate: number,
    organizationId: string,
    rescheduledById: string,
  ) {
    const loan = await this.findOneLoan(id, organizationId);

    if (loan.status !== 'ACTIVE') {
      throw new BadRequestException('Seuls les prêts actifs peuvent être rééchelonnés');
    }

    // Calculer le solde restant
    const repayments = await this.prisma.loanRepayment.findMany({
      where: { loanId: id },
    });

    const totalPaid = repayments.reduce((sum, r) => sum + r.principalPaid, 0);
    const remainingPrincipal = loan.principalAmount - totalPaid;

    // Générer nouveau calendrier
    const newSchedule = this.amortizationService.calculateRepaymentSchedule(
      remainingPrincipal,
      newInterestRate,
      newInstallments,
      loan.repaymentFrequency,
      loan.interestMethod,
      new Date(),
      0,
    );

    return this.prisma.$transaction(async (tx) => {
      // Annuler les échéances non payées
      await tx.loanRepayment.updateMany({
        where: {
          loanId: id,
          status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // Créer les nouvelles échéances
      await tx.loanRepayment.createMany({
        data: newSchedule.map((item) => ({
          loanId: id,
          installmentNumber: item.installmentNumber,
          dueDate: item.dueDate,
          principalDue: item.principal,
          interestDue: item.interest,
          feesDue: item.fees,
          totalDue: item.total,
          status: 'PENDING' as RepaymentStatus,
        })),
      });

      // Mettre à jour le prêt
      return tx.loan.update({
        where: { id },
        data: {
          interestRate: newInterestRate,
          numberOfInstallments: newInstallments,
          rescheduledDate: new Date(),
        },
      });
    });
  }

  // ============ UTILITAIRES ============

  private async generateLoanAccountNumber(organizationId: string): Promise<string> {
    const count = await this.prisma.loan.count({ where: { organizationId } });
    const orgPrefix = organizationId.substring(0, 4).toUpperCase();
    return `LOAN-${orgPrefix}-${String(count + 1).padStart(6, '0')}`;
  }

  // ============ STATISTIQUES ============

  async getLoanStatistics(organizationId: string) {
    const [totalLoans, activeLoans, totalDisbursed, totalOutstanding, overdueLoans] = await Promise.all([
      this.prisma.loan.count({ where: { organizationId } }),
      this.prisma.loan.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.prisma.loan.aggregate({
        where: { organizationId, status: { in: ['ACTIVE', 'CLOSED'] } },
        _sum: { disbursementAmount: true },
      }),
      this.prisma.loanRepayment.aggregate({
        where: {
          loan: { organizationId, status: 'ACTIVE' },
          status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        },
        _sum: {
          principalDue: true,
          interestDue: true,
          feesDue: true,
          penaltyDue: true,
        },
      }),
      this.prisma.loanRepayment.count({
        where: {
          loan: { organizationId, status: 'ACTIVE' },
          status: 'OVERDUE',
        },
      }),
    ]);

    // Calculer le PAR (Portfolio at Risk)
    const overdueAmount = await this.prisma.loanRepayment.aggregate({
      where: {
        loan: { organizationId, status: 'ACTIVE' },
        status: 'OVERDUE',
      },
      _sum: {
        principalDue: true,
      },
    });

    const par =
      totalOutstanding._sum.principalDue && totalOutstanding._sum.principalDue > 0
        ? ((overdueAmount._sum.principalDue || 0) / totalOutstanding._sum.principalDue) * 100
        : 0;

    return {
      totalLoans,
      activeLoans,
      totalDisbursed: totalDisbursed._sum.disbursementAmount || 0,
      totalOutstanding:
        (totalOutstanding._sum.principalDue || 0) +
        (totalOutstanding._sum.interestDue || 0) +
        (totalOutstanding._sum.feesDue || 0) +
        (totalOutstanding._sum.penaltyDue || 0),
      overdueLoans,
      portfolioAtRisk: Math.round(par * 100) / 100,
    };
  }
}
