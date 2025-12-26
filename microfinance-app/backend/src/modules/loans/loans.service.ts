import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AmortizationService } from './services/amortization.service';
import {
  CreateLoanDto,
  CreateLoanProductDto,
  ApproveLoanDto,
  MakeRepaymentDto,
} from './dto/loan.dto';
import Decimal from 'decimal.js';
import { LoanStatus, RepaymentFrequency } from '@prisma/client';
import { addDays } from 'date-fns';

@Injectable()
export class LoansService {
  constructor(
    private prisma: PrismaService,
    private amortizationService: AmortizationService,
  ) {}

  async generateLoanNumber(organizationId: string): Promise<string> {
    const count = await this.prisma.loan.count({
      where: { organizationId },
    });
    return `LOAN-${String(count + 1).padStart(8, '0')}`;
  }

  // ========== GESTION DES PRODUITS DE PRÊTS ==========

  async createLoanProduct(createDto: CreateLoanProductDto) {
    return this.prisma.loanProduct.create({
      data: {
        ...createDto,
        minLoanAmount: new Decimal(createDto.minLoanAmount),
        maxLoanAmount: new Decimal(createDto.maxLoanAmount),
        defaultLoanAmount: createDto.defaultLoanAmount
          ? new Decimal(createDto.defaultLoanAmount)
          : null,
        interestRate: new Decimal(createDto.interestRate),
        processingFee: createDto.processingFee
          ? new Decimal(createDto.processingFee)
          : null,
        latePaymentFee: createDto.latePaymentFee
          ? new Decimal(createDto.latePaymentFee)
          : null,
        penaltyRate: createDto.penaltyRate
          ? new Decimal(createDto.penaltyRate)
          : null,
      },
    });
  }

  async findAllLoanProducts(organizationId: string) {
    return this.prisma.loanProduct.findMany({
      where: { organizationId, isActive: true },
    });
  }

  // ========== GESTION DES PRÊTS ==========

  async create(createLoanDto: CreateLoanDto, userId: string) {
    // Vérifier le produit de prêt
    const loanProduct = await this.prisma.loanProduct.findUnique({
      where: { id: createLoanDto.loanProductId },
    });

    if (!loanProduct) {
      throw new NotFoundException('Produit de prêt introuvable');
    }

    // Vérifier les limites
    const principalAmount = new Decimal(createLoanDto.principalAmount);
    if (
      principalAmount.lessThan(loanProduct.minLoanAmount) ||
      principalAmount.greaterThan(loanProduct.maxLoanAmount)
    ) {
      throw new BadRequestException(
        `Le montant doit être entre ${loanProduct.minLoanAmount} et ${loanProduct.maxLoanAmount}`,
      );
    }

    if (
      createLoanDto.loanTerm < loanProduct.minLoanTerm ||
      createLoanDto.loanTerm > loanProduct.maxLoanTerm
    ) {
      throw new BadRequestException(
        `La durée doit être entre ${loanProduct.minLoanTerm} et ${loanProduct.maxLoanTerm} jours`,
      );
    }

    // Générer le numéro de prêt
    const loanNumber = await this.generateLoanNumber(createLoanDto.organizationId);

    // Calculer le calendrier d'amortissement
    const firstRepaymentDate = createLoanDto.firstRepaymentDate
      ? new Date(createLoanDto.firstRepaymentDate)
      : addDays(new Date(), 30);

    const schedule = this.amortizationService.calculateSchedule(
      principalAmount,
      loanProduct.interestRate,
      createLoanDto.loanTerm,
      loanProduct.repaymentFrequency,
      loanProduct.interestCalculationMethod,
      firstRepaymentDate,
    );

    const totalInterest = schedule.reduce(
      (sum, inst) => sum.plus(inst.interestDue),
      new Decimal(0),
    );
    const totalAmount = principalAmount.plus(totalInterest);

    // Créer le prêt
    const loan = await this.prisma.loan.create({
      data: {
        ...createLoanDto,
        loanNumber,
        principalAmount,
        interestRate: loanProduct.interestRate,
        totalAmount,
        loanTerm: createLoanDto.loanTerm,
        repaymentFrequency: loanProduct.repaymentFrequency,
        firstRepaymentDate,
        maturityDate: schedule[schedule.length - 1].dueDate,
        status: LoanStatus.PENDING,
        createdBy: userId,
      },
    });

    // Créer les échéances
    await Promise.all(
      schedule.map((inst) =>
        this.prisma.loanInstallment.create({
          data: {
            loanId: loan.id,
            installmentNumber: inst.installmentNumber,
            dueDate: inst.dueDate,
            principalDue: inst.principalDue,
            interestDue: inst.interestDue,
            totalDue: inst.totalDue,
          },
        }),
      ),
    );

    // Journaliser
    await this.prisma.auditLog.create({
      data: {
        userId,
        organizationId: createLoanDto.organizationId,
        action: 'CREATE',
        entityType: 'LOAN',
        entityId: loan.id,
        description: `Création du prêt ${loanNumber}`,
      },
    });

    return this.findOne(loan.id);
  }

  async findAll(organizationId: string, filters?: any) {
    const where: any = { organizationId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }
    if (filters?.loanProductId) {
      where.loanProductId = filters.loanProductId;
    }

    return this.prisma.loan.findMany({
      where,
      include: {
        client: true,
        loanProduct: true,
        office: true,
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        client: true,
        loanProduct: true,
        office: true,
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        approver: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
        repayments: {
          orderBy: { repaymentDate: 'desc' },
        },
      },
    });

    if (!loan) {
      throw new NotFoundException(`Prêt avec l'ID ${id} introuvable`);
    }

    return loan;
  }

  async approve(id: string, approveDto: ApproveLoanDto, userId: string) {
    const loan = await this.findOne(id);

    if (loan.status !== LoanStatus.PENDING) {
      throw new BadRequestException(
        'Seuls les prêts en attente peuvent être approuvés',
      );
    }

    const approvedDate = approveDto.approvedDate
      ? new Date(approveDto.approvedDate)
      : new Date();

    const updated = await this.prisma.loan.update({
      where: { id },
      data: {
        status: LoanStatus.APPROVED,
        approvedDate,
        approvedBy: userId,
      },
    });

    // Journaliser
    await this.prisma.auditLog.create({
      data: {
        userId,
        organizationId: loan.organizationId,
        action: 'APPROVE',
        entityType: 'LOAN',
        entityId: id,
        description: `Approbation du prêt ${loan.loanNumber}`,
      },
    });

    return this.findOne(id);
  }

  async disburse(id: string, userId: string) {
    const loan = await this.findOne(id);

    if (loan.status !== LoanStatus.APPROVED) {
      throw new BadRequestException(
        'Seuls les prêts approuvés peuvent être décaissés',
      );
    }

    const disbursedDate = new Date();

    const updated = await this.prisma.loan.update({
      where: { id },
      data: {
        status: LoanStatus.DISBURSED,
        disbursedDate,
        disbursedBy: userId,
      },
    });

    // TODO: Créer les écritures comptables (décaissement)

    // Journaliser
    await this.prisma.auditLog.create({
      data: {
        userId,
        organizationId: loan.organizationId,
        action: 'DISBURSE',
        entityType: 'LOAN',
        entityId: id,
        description: `Décaissement du prêt ${loan.loanNumber}`,
      },
    });

    return this.findOne(id);
  }

  async makeRepayment(
    id: string,
    repaymentDto: MakeRepaymentDto,
    userId: string,
  ) {
    const loan = await this.findOne(id);

    if (![LoanStatus.DISBURSED, LoanStatus.ACTIVE].includes(loan.status)) {
      throw new BadRequestException(
        'Les remboursements ne peuvent être effectués que sur des prêts décaissés ou actifs',
      );
    }

    const principalPaid = new Decimal(repaymentDto.principalPaid);
    const interestPaid = new Decimal(repaymentDto.interestPaid);
    const feesPaid = repaymentDto.feesPaid
      ? new Decimal(repaymentDto.feesPaid)
      : new Decimal(0);
    const penaltyPaid = repaymentDto.penaltyPaid
      ? new Decimal(repaymentDto.penaltyPaid)
      : new Decimal(0);
    const totalPaid = principalPaid
      .plus(interestPaid)
      .plus(feesPaid)
      .plus(penaltyPaid);

    // Trouver l'échéance correspondante (la première non payée)
    const unpaidInstallment = await this.prisma.loanInstallment.findFirst({
      where: {
        loanId: id,
        isPaid: false,
      },
      orderBy: { installmentNumber: 'asc' },
    });

    // Créer le remboursement
    const repayment = await this.prisma.loanRepayment.create({
      data: {
        loanId: id,
        installmentId: unpaidInstallment?.id,
        principalPaid,
        interestPaid,
        feesPaid,
        penaltyPaid,
        totalPaid,
        paymentMethod: repaymentDto.paymentMethod,
        receiptNumber: repaymentDto.receiptNumber,
        notes: repaymentDto.notes,
        createdBy: userId,
      },
    });

    // Mettre à jour l'échéance si elle existe
    if (unpaidInstallment) {
      await this.prisma.loanInstallment.update({
        where: { id: unpaidInstallment.id },
        data: {
          principalPaid: unpaidInstallment.principalPaid.plus(principalPaid),
          interestPaid: unpaidInstallment.interestPaid.plus(interestPaid),
          feesPaid: unpaidInstallment.feesPaid.plus(feesPaid),
          penaltyPaid: unpaidInstallment.penaltyPaid.plus(penaltyPaid),
          totalPaid: unpaidInstallment.totalPaid.plus(totalPaid),
          isPaid: unpaidInstallment.totalDue.minus(unpaidInstallment.totalPaid).minus(totalPaid).lessThanOrEqualTo(0.01),
          paidDate: new Date(),
        },
      });
    }

    // Vérifier si le prêt est complètement remboursé
    const remainingInstallments = await this.prisma.loanInstallment.count({
      where: {
        loanId: id,
        isPaid: false,
      },
    });

    if (remainingInstallments === 0) {
      await this.prisma.loan.update({
        where: { id },
        data: {
          status: LoanStatus.CLOSED,
          closedDate: new Date(),
        },
      });
    } else {
      await this.prisma.loan.update({
        where: { id },
        data: {
          status: LoanStatus.ACTIVE,
        },
      });
    }

    // TODO: Créer les écritures comptables (remboursement)

    // Journaliser
    await this.prisma.auditLog.create({
      data: {
        userId,
        organizationId: loan.organizationId,
        action: 'REPAYMENT',
        entityType: 'LOAN',
        entityId: id,
        description: `Remboursement de ${totalPaid} pour le prêt ${loan.loanNumber}`,
      },
    });

    return this.findOne(id);
  }
}
