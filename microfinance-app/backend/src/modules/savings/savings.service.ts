import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSavingsProductDto,
  UpdateSavingsProductDto,
  CreateSavingsAccountDto,
  DepositDto,
  WithdrawDto,
  HoldAmountDto,
  SavingsQueryDto,
} from './dto/savings.dto';
import { createPaginatedResponse } from '../../common/dto/pagination.dto';
import { SavingsAccountStatus, SavingsTransactionType, ClientStatus, Prisma } from '@prisma/client';

@Injectable()
export class SavingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // PRODUITS D'ÉPARGNE
  // ============================================

  async createProduct(dto: CreateSavingsProductDto) {
    const existing = await this.prisma.savingsProduct.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Un produit avec ce code existe déjà');
    }

    return this.prisma.savingsProduct.create({
      data: dto,
    });
  }

  async findAllProducts() {
    return this.prisma.savingsProduct.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findProductById(id: string) {
    const product = await this.prisma.savingsProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Produit d\'épargne non trouvé');
    }

    return product;
  }

  async updateProduct(id: string, dto: UpdateSavingsProductDto) {
    await this.findProductById(id);
    return this.prisma.savingsProduct.update({
      where: { id },
      data: dto,
    });
  }

  // ============================================
  // COMPTES D'ÉPARGNE
  // ============================================

  private async generateAccountNumber(): Promise<string> {
    const sequence = await this.prisma.numberSequence.upsert({
      where: { entityType: 'SAVINGS' },
      update: { nextValue: { increment: 1 } },
      create: {
        entityType: 'SAVINGS',
        prefix: 'SA',
        nextValue: 2,
        padLength: 8,
      },
    });

    const paddedNumber = (sequence.nextValue - 1).toString().padStart(sequence.padLength, '0');
    return `${sequence.prefix}${paddedNumber}`;
  }

  async createAccount(dto: CreateSavingsAccountDto, userId: string) {
    // Vérifier le client
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Client non trouvé');
    }

    if (client.status !== ClientStatus.ACTIVE) {
      throw new BadRequestException('Le client doit être actif');
    }

    // Vérifier le produit
    const product = await this.findProductById(dto.savingsProductId);

    const accountNumber = await this.generateAccountNumber();

    const account = await this.prisma.savingsAccount.create({
      data: {
        accountNumber,
        clientId: dto.clientId,
        savingsProductId: dto.savingsProductId,
        branchId: dto.branchId,
        currencyCode: product.currencyCode,
        nominalAnnualInterestRate: product.nominalAnnualInterestRate,
        status: SavingsAccountStatus.PENDING_APPROVAL,
        submittedOn: new Date(),
        notes: dto.notes,
        externalId: dto.externalId,
      },
      include: {
        client: {
          select: {
            id: true,
            accountNumber: true,
            firstName: true,
            lastName: true,
            businessName: true,
          },
        },
        savingsProduct: {
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
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SAVINGS_ACCOUNT_CREATED',
        entityType: 'SavingsAccount',
        entityId: account.id,
        newValues: { accountNumber },
      },
    });

    return account;
  }

  async findAll(query: SavingsQueryDto) {
    const { search, status, clientId, branchId, savingsProductId, sortBy, sortOrder } = query;

    const where: Prisma.SavingsAccountWhereInput = {};

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (branchId) where.branchId = branchId;
    if (savingsProductId) where.savingsProductId = savingsProductId;

    if (search) {
      where.OR = [
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { client: { firstName: { contains: search, mode: 'insensitive' } } },
        { client: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [accounts, total] = await Promise.all([
      this.prisma.savingsAccount.findMany({
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
            },
          },
          savingsProduct: {
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
      this.prisma.savingsAccount.count({ where }),
    ]);

    return createPaginatedResponse(accounts, total, query.page || 1, query.limit || 20);
  }

  async findOne(id: string) {
    const account = await this.prisma.savingsAccount.findUnique({
      where: { id },
      include: {
        client: true,
        savingsProduct: true,
        branch: true,
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 50,
          include: {
            paymentType: true,
          },
        },
        holds: {
          where: { isActive: true },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Compte d\'épargne non trouvé');
    }

    return account;
  }

  async activate(id: string, userId: string) {
    const account = await this.findOne(id);

    if (account.status !== SavingsAccountStatus.PENDING_APPROVAL &&
        account.status !== SavingsAccountStatus.APPROVED) {
      throw new BadRequestException('Ce compte ne peut pas être activé');
    }

    const updatedAccount = await this.prisma.savingsAccount.update({
      where: { id },
      data: {
        status: SavingsAccountStatus.ACTIVE,
        approvedOn: account.status === SavingsAccountStatus.PENDING_APPROVAL ? new Date() : account.approvedOn,
        activatedOn: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SAVINGS_ACCOUNT_ACTIVATED',
        entityType: 'SavingsAccount',
        entityId: id,
        oldValues: { status: account.status },
        newValues: { status: SavingsAccountStatus.ACTIVE },
      },
    });

    return updatedAccount;
  }

  async deposit(id: string, dto: DepositDto, userId: string) {
    const account = await this.findOne(id);

    if (account.status !== SavingsAccountStatus.ACTIVE) {
      throw new BadRequestException('Le compte doit être actif');
    }

    const transactionDate = new Date(dto.transactionDate);
    const amount = new Decimal(dto.amount);
    const newBalance = new Decimal(Number(account.accountBalance)).plus(amount);
    const newAvailableBalance = new Decimal(Number(account.availableBalance)).plus(amount);

    await this.prisma.$transaction(async (tx) => {
      // Créer la transaction
      await tx.savingsTransaction.create({
        data: {
          savingsAccountId: id,
          transactionType: SavingsTransactionType.DEPOSIT,
          transactionDate,
          amount: dto.amount,
          runningBalance: newBalance.toNumber(),
          paymentTypeId: dto.paymentTypeId,
          receiptNumber: dto.receiptNumber,
          notes: dto.notes,
        },
      });

      // Mettre à jour le compte
      await tx.savingsAccount.update({
        where: { id },
        data: {
          accountBalance: newBalance.toNumber(),
          availableBalance: newAvailableBalance.toNumber(),
          totalDeposits: new Decimal(Number(account.totalDeposits)).plus(amount).toNumber(),
        },
      });

      // Audit
      await tx.auditLog.create({
        data: {
          userId,
          action: 'SAVINGS_DEPOSIT',
          entityType: 'SavingsAccount',
          entityId: id,
          newValues: { amount: dto.amount, newBalance: newBalance.toNumber() },
        },
      });
    });

    return this.findOne(id);
  }

  async withdraw(id: string, dto: WithdrawDto, userId: string) {
    const account = await this.findOne(id);

    if (account.status !== SavingsAccountStatus.ACTIVE) {
      throw new BadRequestException('Le compte doit être actif');
    }

    const amount = new Decimal(dto.amount);
    const availableBalance = new Decimal(Number(account.availableBalance));

    if (amount.greaterThan(availableBalance)) {
      throw new BadRequestException('Solde disponible insuffisant');
    }

    const product = await this.findProductById(account.savingsProductId);
    if (!product.allowWithdrawals) {
      throw new BadRequestException('Les retraits ne sont pas autorisés sur ce type de compte');
    }

    if (product.minWithdrawalAmount && dto.amount < Number(product.minWithdrawalAmount)) {
      throw new BadRequestException(`Le montant minimum de retrait est ${product.minWithdrawalAmount}`);
    }

    const transactionDate = new Date(dto.transactionDate);
    const newBalance = new Decimal(Number(account.accountBalance)).minus(amount);
    const newAvailableBalance = availableBalance.minus(amount);

    await this.prisma.$transaction(async (tx) => {
      // Créer la transaction
      await tx.savingsTransaction.create({
        data: {
          savingsAccountId: id,
          transactionType: SavingsTransactionType.WITHDRAWAL,
          transactionDate,
          amount: dto.amount,
          runningBalance: newBalance.toNumber(),
          paymentTypeId: dto.paymentTypeId,
          receiptNumber: dto.receiptNumber,
          notes: dto.notes,
        },
      });

      // Mettre à jour le compte
      await tx.savingsAccount.update({
        where: { id },
        data: {
          accountBalance: newBalance.toNumber(),
          availableBalance: newAvailableBalance.toNumber(),
          totalWithdrawals: new Decimal(Number(account.totalWithdrawals)).plus(amount).toNumber(),
        },
      });

      // Audit
      await tx.auditLog.create({
        data: {
          userId,
          action: 'SAVINGS_WITHDRAWAL',
          entityType: 'SavingsAccount',
          entityId: id,
          newValues: { amount: dto.amount, newBalance: newBalance.toNumber() },
        },
      });
    });

    return this.findOne(id);
  }

  async holdAmount(id: string, dto: HoldAmountDto, userId: string) {
    const account = await this.findOne(id);

    if (account.status !== SavingsAccountStatus.ACTIVE) {
      throw new BadRequestException('Le compte doit être actif');
    }

    const amount = new Decimal(dto.amount);
    const availableBalance = new Decimal(Number(account.availableBalance));

    if (amount.greaterThan(availableBalance)) {
      throw new BadRequestException('Solde disponible insuffisant');
    }

    await this.prisma.$transaction(async (tx) => {
      // Créer le blocage
      await tx.savingsHold.create({
        data: {
          savingsAccountId: id,
          amount: dto.amount,
          reason: dto.reason,
          holdDate: new Date(),
        },
      });

      // Mettre à jour le compte
      const newBlockedAmount = new Decimal(Number(account.blockedAmount)).plus(amount);
      const newAvailableBalance = new Decimal(Number(account.accountBalance)).minus(newBlockedAmount);

      await tx.savingsAccount.update({
        where: { id },
        data: {
          blockedAmount: newBlockedAmount.toNumber(),
          availableBalance: newAvailableBalance.toNumber(),
        },
      });

      // Audit
      await tx.auditLog.create({
        data: {
          userId,
          action: 'SAVINGS_HOLD',
          entityType: 'SavingsAccount',
          entityId: id,
          newValues: { amount: dto.amount, reason: dto.reason },
        },
      });
    });

    return this.findOne(id);
  }

  async releaseHold(id: string, holdId: string, userId: string) {
    const hold = await this.prisma.savingsHold.findFirst({
      where: { id: holdId, savingsAccountId: id, isActive: true },
    });

    if (!hold) {
      throw new NotFoundException('Blocage non trouvé');
    }

    const account = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      // Libérer le blocage
      await tx.savingsHold.update({
        where: { id: holdId },
        data: {
          isActive: false,
          releaseDate: new Date(),
        },
      });

      // Mettre à jour le compte
      const newBlockedAmount = new Decimal(Number(account.blockedAmount)).minus(Number(hold.amount));
      const newAvailableBalance = new Decimal(Number(account.accountBalance)).minus(newBlockedAmount);

      await tx.savingsAccount.update({
        where: { id },
        data: {
          blockedAmount: newBlockedAmount.toNumber(),
          availableBalance: newAvailableBalance.toNumber(),
        },
      });

      // Audit
      await tx.auditLog.create({
        data: {
          userId,
          action: 'SAVINGS_HOLD_RELEASED',
          entityType: 'SavingsAccount',
          entityId: id,
          newValues: { holdId, amount: Number(hold.amount) },
        },
      });
    });

    return this.findOne(id);
  }

  async close(id: string, userId: string) {
    const account = await this.findOne(id);

    if (Number(account.accountBalance) > 0) {
      throw new BadRequestException('Le solde doit être nul pour clôturer le compte');
    }

    if (Number(account.blockedAmount) > 0) {
      throw new BadRequestException('Il y a des montants bloqués sur ce compte');
    }

    const updatedAccount = await this.prisma.savingsAccount.update({
      where: { id },
      data: {
        status: SavingsAccountStatus.CLOSED,
        closedOn: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SAVINGS_ACCOUNT_CLOSED',
        entityType: 'SavingsAccount',
        entityId: id,
        oldValues: { status: account.status },
        newValues: { status: SavingsAccountStatus.CLOSED },
      },
    });

    return updatedAccount;
  }
}
