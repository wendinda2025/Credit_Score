import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateLoanDto,
  CreateLoanProductDto,
  UpdateLoanProductDto,
  ApproveLoanDto,
  RejectLoanDto,
  DisburseLoanDto,
  LoanRepaymentDto,
  LoanQueryDto,
  CollateralDto,
  GuarantorDto,
} from './dto/loan.dto';
import { LoanScheduleService, LoanScheduleParams } from './services/loan-schedule.service';
import { createPaginatedResponse } from '../../common/dto/pagination.dto';
import { LoanStatus, LoanTransactionType, Prisma, ClientStatus } from '@prisma/client';

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduleService: LoanScheduleService,
  ) {}

  // ============================================
  // PRODUITS DE PRÊTS
  // ============================================

  async createProduct(dto: CreateLoanProductDto) {
    // Vérifier l'unicité du code
    const existing = await this.prisma.loanProduct.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Un produit avec ce code existe déjà');
    }

    return this.prisma.loanProduct.create({
      data: dto,
    });
  }

  async findAllProducts() {
    return this.prisma.loanProduct.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findProductById(id: string) {
    const product = await this.prisma.loanProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Produit de prêt non trouvé');
    }

    return product;
  }

  async updateProduct(id: string, dto: UpdateLoanProductDto) {
    await this.findProductById(id);
    return this.prisma.loanProduct.update({
      where: { id },
      data: dto,
    });
  }

  // ============================================
  // GESTION DES PRÊTS
  // ============================================

  /**
   * Génère un numéro de compte prêt unique
   */
  private async generateAccountNumber(): Promise<string> {
    const sequence = await this.prisma.numberSequence.upsert({
      where: { entityType: 'LOAN' },
      update: { nextValue: { increment: 1 } },
      create: {
        entityType: 'LOAN',
        prefix: 'LN',
        nextValue: 2,
        padLength: 8,
      },
    });

    const paddedNumber = (sequence.nextValue - 1).toString().padStart(sequence.padLength, '0');
    return `${sequence.prefix}${paddedNumber}`;
  }

  /**
   * Crée une nouvelle demande de prêt
   */
  async create(dto: CreateLoanDto, userId: string) {
    // Vérifier le client
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Client non trouvé');
    }

    if (client.status !== ClientStatus.ACTIVE) {
      throw new BadRequestException('Le client doit être actif pour demander un prêt');
    }

    // Vérifier le produit
    const product = await this.prisma.loanProduct.findUnique({
      where: { id: dto.loanProductId },
    });

    if (!product || !product.isActive) {
      throw new BadRequestException('Produit de prêt non disponible');
    }

    // Valider le montant
    if (dto.principalAmount < Number(product.minPrincipal) ||
        dto.principalAmount > Number(product.maxPrincipal)) {
      throw new BadRequestException(
        `Le montant doit être entre ${product.minPrincipal} et ${product.maxPrincipal}`
      );
    }

    // Valider le taux
    if (dto.interestRate < Number(product.minInterestRate) ||
        dto.interestRate > Number(product.maxInterestRate)) {
      throw new BadRequestException(
        `Le taux doit être entre ${product.minInterestRate}% et ${product.maxInterestRate}%`
      );
    }

    // Valider le nombre d'échéances
    if (dto.numberOfRepayments < product.minTerm ||
        dto.numberOfRepayments > product.maxTerm) {
      throw new BadRequestException(
        `Le nombre d'échéances doit être entre ${product.minTerm} et ${product.maxTerm}`
      );
    }

    const accountNumber = await this.generateAccountNumber();

    // Calculer le calendrier préliminaire pour avoir le total attendu
    const scheduleParams: LoanScheduleParams = {
      principal: new Decimal(dto.principalAmount),
      interestRate: new Decimal(dto.interestRate),
      numberOfRepayments: dto.numberOfRepayments,
      disbursementDate: dto.expectedDisbursementDate 
        ? new Date(dto.expectedDisbursementDate) 
        : new Date(),
      interestMethod: product.interestMethod,
      amortizationType: product.amortizationType,
      repaymentFrequency: product.repaymentFrequency,
      principalGracePeriod: dto.principalGracePeriod || 0,
      interestGracePeriod: dto.interestGracePeriod || 0,
    };

    const schedule = this.scheduleService.generateSchedule(scheduleParams);
    const totals = this.scheduleService.calculateScheduleTotals(schedule);

    // Créer le prêt
    const loan = await this.prisma.loan.create({
      data: {
        accountNumber,
        clientId: dto.clientId,
        loanProductId: dto.loanProductId,
        branchId: dto.branchId,
        loanOfficerId: dto.loanOfficerId,
        principalAmount: dto.principalAmount,
        numberOfRepayments: dto.numberOfRepayments,
        repaymentFrequency: product.repaymentFrequency,
        interestRate: dto.interestRate,
        interestMethod: product.interestMethod,
        amortizationType: product.amortizationType,
        expectedDisbursementDate: dto.expectedDisbursementDate 
          ? new Date(dto.expectedDisbursementDate) 
          : null,
        submittedOn: new Date(),
        status: LoanStatus.PENDING_APPROVAL,
        totalExpectedRepayment: totals.totalRepayment.toNumber(),
        principalGracePeriod: dto.principalGracePeriod || 0,
        interestGracePeriod: dto.interestGracePeriod || 0,
        loanPurpose: dto.loanPurpose,
        notes: dto.notes,
        externalId: dto.externalId,
        currencyCode: product.currencyCode,
      },
      include: {
        client: {
          select: {
            id: true,
            accountNumber: true,
            firstName: true,
            lastName: true,
            businessName: true,
            clientType: true,
          },
        },
        loanProduct: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'LOAN_CREATED',
        entityType: 'Loan',
        entityId: loan.id,
        newValues: { accountNumber: loan.accountNumber, principalAmount: dto.principalAmount },
      },
    });

    return loan;
  }

  /**
   * Récupère tous les prêts avec pagination
   */
  async findAll(query: LoanQueryDto) {
    const { search, status, clientId, branchId, loanProductId, inArrears, sortBy, sortOrder } = query;

    const where: Prisma.LoanWhereInput = {};

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (branchId) where.branchId = branchId;
    if (loanProductId) where.loanProductId = loanProductId;
    if (inArrears) where.daysInArrears = { gt: 0 };

    if (search) {
      where.OR = [
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { client: { firstName: { contains: search, mode: 'insensitive' } } },
        { client: { lastName: { contains: search, mode: 'insensitive' } } },
        { client: { businessName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [loans, total] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              accountNumber: true,
              firstName: true,
              lastName: true,
              businessName: true,
              clientType: true,
            },
          },
          loanProduct: {
            select: {
              id: true,
              name: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.loan.count({ where }),
    ]);

    return createPaginatedResponse(loans, total, query.page || 1, query.limit || 20);
  }

  /**
   * Récupère un prêt par son ID avec tous les détails
   */
  async findOne(id: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        client: true,
        loanProduct: true,
        branch: true,
        schedule: {
          orderBy: { installmentNumber: 'asc' },
        },
        transactions: {
          orderBy: { transactionDate: 'desc' },
          include: {
            paymentType: true,
          },
        },
        collaterals: true,
        guarantors: true,
        charges: {
          include: {
            charge: true,
          },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        disbursedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!loan) {
      throw new NotFoundException('Prêt non trouvé');
    }

    return loan;
  }

  /**
   * Approuve un prêt
   */
  async approve(id: string, dto: ApproveLoanDto, userId: string) {
    const loan = await this.findOne(id);

    if (loan.status !== LoanStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Ce prêt ne peut pas être approuvé');
    }

    const approvedPrincipal = dto.approvedPrincipal || Number(loan.principalAmount);

    // Recalculer le calendrier si le montant a changé
    if (dto.approvedPrincipal && dto.approvedPrincipal !== Number(loan.principalAmount)) {
      const scheduleParams: LoanScheduleParams = {
        principal: new Decimal(approvedPrincipal),
        interestRate: new Decimal(Number(loan.interestRate)),
        numberOfRepayments: loan.numberOfRepayments,
        disbursementDate: loan.expectedDisbursementDate || new Date(),
        interestMethod: loan.interestMethod,
        amortizationType: loan.amortizationType,
        repaymentFrequency: loan.repaymentFrequency,
        principalGracePeriod: loan.principalGracePeriod,
        interestGracePeriod: loan.interestGracePeriod,
      };

      const schedule = this.scheduleService.generateSchedule(scheduleParams);
      const totals = this.scheduleService.calculateScheduleTotals(schedule);

      await this.prisma.loan.update({
        where: { id },
        data: {
          totalExpectedRepayment: totals.totalRepayment.toNumber(),
        },
      });
    }

    const updatedLoan = await this.prisma.loan.update({
      where: { id },
      data: {
        status: LoanStatus.APPROVED,
        approvedPrincipal,
        approvedOn: new Date(),
        approvedById: userId,
        notes: dto.notes ? `${loan.notes || ''}\n[Approbation] ${dto.notes}` : loan.notes,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'LOAN_APPROVED',
        entityType: 'Loan',
        entityId: id,
        oldValues: { status: loan.status },
        newValues: { status: LoanStatus.APPROVED, approvedPrincipal },
      },
    });

    return updatedLoan;
  }

  /**
   * Rejette un prêt
   */
  async reject(id: string, dto: RejectLoanDto, userId: string) {
    const loan = await this.findOne(id);

    if (loan.status !== LoanStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Ce prêt ne peut pas être rejeté');
    }

    const updatedLoan = await this.prisma.loan.update({
      where: { id },
      data: {
        status: LoanStatus.REJECTED,
        rejectionReason: dto.rejectionReason,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'LOAN_REJECTED',
        entityType: 'Loan',
        entityId: id,
        oldValues: { status: loan.status },
        newValues: { status: LoanStatus.REJECTED, reason: dto.rejectionReason },
      },
    });

    return updatedLoan;
  }

  /**
   * Décaisse un prêt
   */
  async disburse(id: string, dto: DisburseLoanDto, userId: string) {
    const loan = await this.findOne(id);

    if (loan.status !== LoanStatus.APPROVED) {
      throw new BadRequestException('Le prêt doit être approuvé avant le décaissement');
    }

    const disbursedAmount = dto.disbursedAmount || Number(loan.approvedPrincipal);
    const disbursementDate = new Date(dto.disbursementDate);

    // Générer le calendrier définitif
    const scheduleParams: LoanScheduleParams = {
      principal: new Decimal(disbursedAmount),
      interestRate: new Decimal(Number(loan.interestRate)),
      numberOfRepayments: loan.numberOfRepayments,
      disbursementDate,
      interestMethod: loan.interestMethod,
      amortizationType: loan.amortizationType,
      repaymentFrequency: loan.repaymentFrequency,
      principalGracePeriod: loan.principalGracePeriod,
      interestGracePeriod: loan.interestGracePeriod,
    };

    const schedule = this.scheduleService.generateSchedule(scheduleParams);
    const totals = this.scheduleService.calculateScheduleTotals(schedule);

    // Calculer la date de maturité
    const expectedMaturityDate = schedule.length > 0 
      ? schedule[schedule.length - 1].dueDate 
      : disbursementDate;

    await this.prisma.$transaction(async (tx) => {
      // Mettre à jour le prêt
      await tx.loan.update({
        where: { id },
        data: {
          status: LoanStatus.ACTIVE,
          disbursedAmount,
          actualDisbursementDate: disbursementDate,
          expectedMaturityDate,
          disbursedById: userId,
          totalExpectedRepayment: totals.totalRepayment.toNumber(),
          principalOutstanding: disbursedAmount,
          interestOutstanding: totals.totalInterest.toNumber(),
          totalOutstanding: totals.totalRepayment.toNumber(),
        },
      });

      // Créer le calendrier de remboursement
      for (const installment of schedule) {
        await tx.loanSchedule.create({
          data: {
            loanId: id,
            installmentNumber: installment.installmentNumber,
            dueDate: installment.dueDate,
            principalDue: installment.principalDue.toNumber(),
            interestDue: installment.interestDue.toNumber(),
            totalDue: installment.totalDue.toNumber(),
            principalOutstanding: installment.principalOutstanding.toNumber(),
            interestOutstanding: installment.interestOutstanding.toNumber(),
            totalOutstanding: installment.totalOutstanding.toNumber(),
          },
        });
      }

      // Créer la transaction de décaissement
      await tx.loanTransaction.create({
        data: {
          loanId: id,
          transactionType: LoanTransactionType.DISBURSEMENT,
          transactionDate: disbursementDate,
          amount: disbursedAmount,
          principalPortion: disbursedAmount,
          outstandingBalance: totals.totalRepayment.toNumber(),
          paymentTypeId: dto.paymentTypeId,
          receiptNumber: dto.receiptNumber,
          notes: dto.notes,
        },
      });

      // Log audit
      await tx.auditLog.create({
        data: {
          userId,
          action: 'LOAN_DISBURSED',
          entityType: 'Loan',
          entityId: id,
          newValues: { disbursedAmount, disbursementDate },
        },
      });
    });

    return this.findOne(id);
  }

  /**
   * Enregistre un remboursement
   */
  async makeRepayment(id: string, dto: LoanRepaymentDto, userId: string) {
    const loan = await this.findOne(id);

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new BadRequestException('Le prêt doit être actif pour recevoir des remboursements');
    }

    const transactionDate = new Date(dto.transactionDate);
    const paymentAmount = new Decimal(dto.amount);

    // Trouver les échéances non payées (ordre FIFO)
    const unpaidInstallments = loan.schedule.filter((s) => !s.isPaid);

    if (unpaidInstallments.length === 0) {
      throw new BadRequestException('Toutes les échéances sont déjà payées');
    }

    let remainingPayment = paymentAmount;
    let totalPrincipalPaid = new Decimal(0);
    let totalInterestPaid = new Decimal(0);
    let totalPenaltiesPaid = new Decimal(0);
    let totalFeesPaid = new Decimal(0);

    // Allouer le paiement aux échéances (Pénalités -> Intérêts -> Principal)
    const installmentUpdates: any[] = [];

    for (const installment of unpaidInstallments) {
      if (remainingPayment.lessThanOrEqualTo(0)) break;

      const penaltiesOutstanding = new Decimal(Number(installment.penaltiesDue)).minus(Number(installment.penaltiesPaid));
      const interestOutstanding = new Decimal(Number(installment.interestOutstanding));
      const principalOutstanding = new Decimal(Number(installment.principalOutstanding));

      let penaltiesPaid = new Decimal(0);
      let interestPaid = new Decimal(0);
      let principalPaid = new Decimal(0);

      // 1. Payer les pénalités
      if (remainingPayment.greaterThan(0) && penaltiesOutstanding.greaterThan(0)) {
        penaltiesPaid = Decimal.min(remainingPayment, penaltiesOutstanding);
        remainingPayment = remainingPayment.minus(penaltiesPaid);
        totalPenaltiesPaid = totalPenaltiesPaid.plus(penaltiesPaid);
      }

      // 2. Payer les intérêts
      if (remainingPayment.greaterThan(0) && interestOutstanding.greaterThan(0)) {
        interestPaid = Decimal.min(remainingPayment, interestOutstanding);
        remainingPayment = remainingPayment.minus(interestPaid);
        totalInterestPaid = totalInterestPaid.plus(interestPaid);
      }

      // 3. Payer le principal
      if (remainingPayment.greaterThan(0) && principalOutstanding.greaterThan(0)) {
        principalPaid = Decimal.min(remainingPayment, principalOutstanding);
        remainingPayment = remainingPayment.minus(principalPaid);
        totalPrincipalPaid = totalPrincipalPaid.plus(principalPaid);
      }

      const newPrincipalPaid = new Decimal(Number(installment.principalPaid)).plus(principalPaid);
      const newInterestPaid = new Decimal(Number(installment.interestPaid)).plus(interestPaid);
      const newPenaltiesPaid = new Decimal(Number(installment.penaltiesPaid)).plus(penaltiesPaid);
      const newTotalPaid = newPrincipalPaid.plus(newInterestPaid).plus(newPenaltiesPaid);

      const newPrincipalOutstanding = new Decimal(Number(installment.principalDue)).minus(newPrincipalPaid);
      const newInterestOutstanding = new Decimal(Number(installment.interestDue)).minus(newInterestPaid);
      const newTotalOutstanding = newPrincipalOutstanding.plus(newInterestOutstanding);

      const isPaid = newTotalOutstanding.lessThanOrEqualTo(0);

      installmentUpdates.push({
        id: installment.id,
        data: {
          principalPaid: newPrincipalPaid.toNumber(),
          interestPaid: newInterestPaid.toNumber(),
          penaltiesPaid: newPenaltiesPaid.toNumber(),
          totalPaid: newTotalPaid.toNumber(),
          principalOutstanding: newPrincipalOutstanding.toNumber(),
          interestOutstanding: newInterestOutstanding.toNumber(),
          totalOutstanding: newTotalOutstanding.toNumber(),
          isPaid,
          paidOn: isPaid ? transactionDate : null,
        },
      });
    }

    // Calculer les nouveaux soldes du prêt
    const newPrincipalRepaid = new Decimal(Number(loan.totalPrincipalRepaid)).plus(totalPrincipalPaid);
    const newInterestRepaid = new Decimal(Number(loan.totalInterestRepaid)).plus(totalInterestPaid);
    const newPenaltiesRepaid = new Decimal(Number(loan.totalPenaltiesRepaid)).plus(totalPenaltiesPaid);
    
    const newPrincipalOutstanding = new Decimal(Number(loan.principalOutstanding)).minus(totalPrincipalPaid);
    const newInterestOutstanding = new Decimal(Number(loan.interestOutstanding)).minus(totalInterestPaid);
    const newTotalOutstanding = newPrincipalOutstanding.plus(newInterestOutstanding);

    // Gérer les trop-perçus
    let overpayment = new Decimal(0);
    if (remainingPayment.greaterThan(0)) {
      overpayment = remainingPayment;
    }

    // Déterminer le nouveau statut
    let newStatus = loan.status;
    if (newTotalOutstanding.lessThanOrEqualTo(0)) {
      newStatus = LoanStatus.CLOSED;
    }

    await this.prisma.$transaction(async (tx) => {
      // Mettre à jour les échéances
      for (const update of installmentUpdates) {
        await tx.loanSchedule.update({
          where: { id: update.id },
          data: update.data,
        });
      }

      // Créer la transaction de remboursement
      await tx.loanTransaction.create({
        data: {
          loanId: id,
          transactionType: LoanTransactionType.REPAYMENT,
          transactionDate,
          amount: dto.amount,
          principalPortion: totalPrincipalPaid.toNumber(),
          interestPortion: totalInterestPaid.toNumber(),
          penaltiesPortion: totalPenaltiesPaid.toNumber(),
          feesPortion: totalFeesPaid.toNumber(),
          overpaymentPortion: overpayment.toNumber(),
          outstandingBalance: newTotalOutstanding.toNumber(),
          paymentTypeId: dto.paymentTypeId,
          receiptNumber: dto.receiptNumber,
          notes: dto.notes,
        },
      });

      // Mettre à jour le prêt
      await tx.loan.update({
        where: { id },
        data: {
          status: newStatus,
          totalPrincipalRepaid: newPrincipalRepaid.toNumber(),
          totalInterestRepaid: newInterestRepaid.toNumber(),
          totalPenaltiesRepaid: newPenaltiesRepaid.toNumber(),
          totalOverpaid: new Decimal(Number(loan.totalOverpaid)).plus(overpayment).toNumber(),
          principalOutstanding: newPrincipalOutstanding.toNumber(),
          interestOutstanding: newInterestOutstanding.toNumber(),
          totalOutstanding: newTotalOutstanding.toNumber(),
          closedOn: newStatus === LoanStatus.CLOSED ? transactionDate : null,
        },
      });

      // Log audit
      await tx.auditLog.create({
        data: {
          userId,
          action: 'LOAN_REPAYMENT',
          entityType: 'Loan',
          entityId: id,
          newValues: {
            amount: dto.amount,
            principal: totalPrincipalPaid.toNumber(),
            interest: totalInterestPaid.toNumber(),
          },
        },
      });
    });

    return this.findOne(id);
  }

  /**
   * Ajoute une garantie au prêt
   */
  async addCollateral(loanId: string, dto: CollateralDto) {
    await this.findOne(loanId);

    return this.prisma.loanCollateral.create({
      data: {
        loanId,
        ...dto,
      },
    });
  }

  /**
   * Ajoute un garant au prêt
   */
  async addGuarantor(loanId: string, dto: GuarantorDto) {
    await this.findOne(loanId);

    return this.prisma.loanGuarantor.create({
      data: {
        loanId,
        ...dto,
      },
    });
  }

  /**
   * Prévisualise le calendrier de remboursement
   */
  async previewSchedule(dto: CreateLoanDto) {
    const product = await this.findProductById(dto.loanProductId);

    const scheduleParams: LoanScheduleParams = {
      principal: new Decimal(dto.principalAmount),
      interestRate: new Decimal(dto.interestRate),
      numberOfRepayments: dto.numberOfRepayments,
      disbursementDate: dto.expectedDisbursementDate 
        ? new Date(dto.expectedDisbursementDate) 
        : new Date(),
      interestMethod: product.interestMethod,
      amortizationType: product.amortizationType,
      repaymentFrequency: product.repaymentFrequency,
      principalGracePeriod: dto.principalGracePeriod || 0,
      interestGracePeriod: dto.interestGracePeriod || 0,
    };

    const schedule = this.scheduleService.generateSchedule(scheduleParams);
    const totals = this.scheduleService.calculateScheduleTotals(schedule);

    return {
      schedule: schedule.map((s) => ({
        ...s,
        principalDue: s.principalDue.toNumber(),
        interestDue: s.interestDue.toNumber(),
        totalDue: s.totalDue.toNumber(),
      })),
      summary: {
        principal: totals.totalPrincipal.toNumber(),
        totalInterest: totals.totalInterest.toNumber(),
        totalRepayment: totals.totalRepayment.toNumber(),
        numberOfInstallments: dto.numberOfRepayments,
        interestMethod: product.interestMethod,
        amortizationType: product.amortizationType,
      },
    };
  }
}
