import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSavingsProductDto,
  CreateSavingsAccountDto,
  SavingsTransactionDto,
} from './dto/savings.dto';
import Decimal from 'decimal.js';
import { SavingsAccountStatus } from '@prisma/client';

@Injectable()
export class SavingsService {
  constructor(private prisma: PrismaService) {}

  async generateAccountNumber(organizationId: string): Promise<string> {
    const count = await this.prisma.savingsAccount.count({
      where: { organizationId },
    });
    return `SAV-${String(count + 1).padStart(8, '0')}`;
  }

  // ========== PRODUITS D'ÉPARGNE ==========

  async createSavingsProduct(createDto: CreateSavingsProductDto) {
    return this.prisma.savingsProduct.create({
      data: {
        ...createDto,
        minBalance: createDto.minBalance
          ? new Decimal(createDto.minBalance)
          : new Decimal(0),
        interestRate: new Decimal(createDto.interestRate),
      },
    });
  }

  async findAllSavingsProducts(organizationId: string) {
    return this.prisma.savingsProduct.findMany({
      where: { organizationId, isActive: true },
    });
  }

  // ========== COMPTES D'ÉPARGNE ==========

  async createAccount(createDto: CreateSavingsAccountDto, userId: string) {
    const accountNumber = await this.generateAccountNumber(
      createDto.organizationId,
    );

    const account = await this.prisma.savingsAccount.create({
      data: {
        ...createDto,
        accountNumber,
        status: SavingsAccountStatus.PENDING,
      },
      include: {
        client: true,
        savingsProduct: true,
        office: true,
      },
    });

    // Journaliser
    await this.prisma.auditLog.create({
      data: {
        userId,
        organizationId: createDto.organizationId,
        action: 'CREATE',
        entityType: 'SAVINGS_ACCOUNT',
        entityId: account.id,
        description: `Création du compte épargne ${accountNumber}`,
      },
    });

    return account;
  }

  async activateAccount(id: string, userId: string) {
    const account = await this.findOne(id);

    if (account.status !== SavingsAccountStatus.PENDING) {
      throw new BadRequestException(
        'Seuls les comptes en attente peuvent être activés',
      );
    }

    const updated = await this.prisma.savingsAccount.update({
      where: { id },
      data: {
        status: SavingsAccountStatus.ACTIVE,
      },
    });

    // Journaliser
    await this.prisma.auditLog.create({
      data: {
        userId,
        organizationId: account.organizationId,
        action: 'UPDATE',
        entityType: 'SAVINGS_ACCOUNT',
        entityId: id,
        description: `Activation du compte épargne ${account.accountNumber}`,
      },
    });

    return updated;
  }

  async findAll(organizationId: string, filters?: any) {
    const where: any = { organizationId };

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.savingsAccount.findMany({
      where,
      include: {
        client: true,
        savingsProduct: true,
        office: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.savingsAccount.findUnique({
      where: { id },
      include: {
        client: true,
        savingsProduct: true,
        office: true,
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 50,
        },
      },
    });

    if (!account) {
      throw new NotFoundException(
        `Compte épargne avec l'ID ${id} introuvable`,
      );
    }

    return account;
  }

  async makeTransaction(
    id: string,
    transactionDto: SavingsTransactionDto,
    userId: string,
  ) {
    const account = await this.findOne(id);

    if (account.status !== SavingsAccountStatus.ACTIVE) {
      throw new BadRequestException(
        'Les transactions ne peuvent être effectuées que sur des comptes actifs',
      );
    }

    const amount = new Decimal(transactionDto.amount);

    if (transactionDto.transactionType === 'WITHDRAWAL') {
      if (amount.greaterThan(account.availableBalance)) {
        throw new BadRequestException('Solde insuffisant');
      }
    }

    // Calculer le nouveau solde
    const balanceAfter =
      transactionDto.transactionType === 'DEPOSIT'
        ? account.balance.plus(amount)
        : account.balance.minus(amount);

    const availableBalanceAfter =
      transactionDto.transactionType === 'DEPOSIT'
        ? account.availableBalance.plus(amount)
        : account.availableBalance.minus(amount);

    // Créer la transaction
    const transaction = await this.prisma.savingsTransaction.create({
      data: {
        savingsAccountId: id,
        transactionType: transactionDto.transactionType,
        amount,
        balanceAfter,
        description: transactionDto.description,
        referenceNumber: transactionDto.referenceNumber,
        createdBy: userId,
      },
    });

    // Mettre à jour le compte
    await this.prisma.savingsAccount.update({
      where: { id },
      data: {
        balance: balanceAfter,
        availableBalance: availableBalanceAfter,
      },
    });

    // TODO: Créer les écritures comptables

    // Journaliser
    await this.prisma.auditLog.create({
      data: {
        userId,
        organizationId: account.organizationId,
        action:
          transactionDto.transactionType === 'DEPOSIT' ? 'DEPOSIT' : 'WITHDRAWAL',
        entityType: 'SAVINGS_ACCOUNT',
        entityId: id,
        description: `${transactionDto.transactionType} de ${amount} sur le compte ${account.accountNumber}`,
      },
    });

    return this.findOne(id);
  }

  async closeAccount(id: string, userId: string) {
    const account = await this.findOne(id);

    if (account.balance.greaterThan(0)) {
      throw new BadRequestException(
        'Le solde doit être à zéro pour clôturer le compte',
      );
    }

    const updated = await this.prisma.savingsAccount.update({
      where: { id },
      data: {
        status: SavingsAccountStatus.CLOSED,
        closedDate: new Date(),
        closedBy: userId,
      },
    });

    // Journaliser
    await this.prisma.auditLog.create({
      data: {
        userId,
        organizationId: account.organizationId,
        action: 'UPDATE',
        entityType: 'SAVINGS_ACCOUNT',
        entityId: id,
        description: `Clôture du compte épargne ${account.accountNumber}`,
      },
    });

    return updated;
  }
}
