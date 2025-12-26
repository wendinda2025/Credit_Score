import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSavingsProductDto,
  CreateSavingsAccountDto,
  DepositDto,
  WithdrawalDto,
  InterestCalculationDto,
} from './dto/savings.dto';
import { SavingsAccountStatus } from '@prisma/client';

@Injectable()
export class SavingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============ PRODUITS D'ÉPARGNE ============

  async createSavingsProduct(dto: CreateSavingsProductDto, organizationId: string) {
    return this.prisma.savingsProduct.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  async findAllSavingsProducts(organizationId: string) {
    return this.prisma.savingsProduct.findMany({
      where: { organizationId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneSavingsProduct(id: string, organizationId: string) {
    const product = await this.prisma.savingsProduct.findFirst({
      where: { id, organizationId },
    });

    if (!product) {
      throw new NotFoundException(`Produit d'épargne #${id} introuvable`);
    }

    return product;
  }

  async updateSavingsProduct(id: string, dto: Partial<CreateSavingsProductDto>, organizationId: string) {
    await this.findOneSavingsProduct(id, organizationId);

    return this.prisma.savingsProduct.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSavingsProduct(id: string, organizationId: string) {
    await this.findOneSavingsProduct(id, organizationId);

    return this.prisma.savingsProduct.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ============ COMPTES D'ÉPARGNE ============

  async createSavingsAccount(dto: CreateSavingsAccountDto, organizationId: string, createdById: string) {
    // Vérifier le produit
    const product = await this.findOneSavingsProduct(dto.savingsProductId, organizationId);

    // Vérifier le client
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, organizationId },
    });

    if (!client) {
      throw new NotFoundException(`Client #${dto.clientId} introuvable`);
    }

    // Créer le compte
    return this.prisma.savingsAccount.create({
      data: {
        ...dto,
        organizationId,
        accountNumber: await this.generateAccountNumber(organizationId),
        balance: 0,
        availableBalance: 0,
        status: 'PENDING',
        nominalAnnualInterestRate: dto.nominalAnnualInterestRate || product.interestRate,
        createdById,
      },
      include: {
        client: true,
        savingsProduct: true,
      },
    });
  }

  async findAllSavingsAccounts(organizationId: string, filters?: any) {
    return this.prisma.savingsAccount.findMany({
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
        savingsProduct: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneSavingsAccount(id: string, organizationId: string) {
    const account = await this.prisma.savingsAccount.findFirst({
      where: { id, organizationId },
      include: {
        client: true,
        savingsProduct: true,
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 50,
        },
      },
    });

    if (!account) {
      throw new NotFoundException(`Compte d'épargne #${id} introuvable`);
    }

    return account;
  }

  // ============ ACTIVATION / APPROBATION ============

  async activateSavingsAccount(id: string, organizationId: string, activatedById: string, activationDate: Date) {
    const account = await this.findOneSavingsAccount(id, organizationId);

    if (account.status !== 'PENDING') {
      throw new BadRequestException('Seuls les comptes en attente peuvent être activés');
    }

    return this.prisma.savingsAccount.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        activatedDate: activationDate,
        activatedById,
      },
    });
  }

  async closeSavingsAccount(id: string, organizationId: string, closedById: string, closureReason: string) {
    const account = await this.findOneSavingsAccount(id, organizationId);

    if (account.status === 'CLOSED') {
      throw new BadRequestException('Le compte est déjà clôturé');
    }

    if (account.balance > 0) {
      throw new BadRequestException('Le solde du compte doit être à zéro avant la clôture');
    }

    return this.prisma.savingsAccount.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedDate: new Date(),
        closedById,
        closureReason,
      },
    });
  }

  // ============ DÉPÔTS ============

  async deposit(id: string, dto: DepositDto, organizationId: string, receivedById: string) {
    const account = await this.findOneSavingsAccount(id, organizationId);

    if (account.status !== 'ACTIVE') {
      throw new BadRequestException('Le compte doit être actif pour accepter des dépôts');
    }

    return this.prisma.$transaction(async (tx) => {
      // Créer la transaction
      const transaction = await tx.savingsTransaction.create({
        data: {
          savingsAccountId: id,
          transactionType: 'DEPOSIT',
          amount: dto.amount,
          transactionDate: dto.transactionDate,
          paymentMethod: dto.paymentMethod,
          reference: dto.reference,
          notes: dto.notes,
          balanceAfter: account.balance + dto.amount,
          createdById: receivedById,
        },
      });

      // Mettre à jour le solde
      await tx.savingsAccount.update({
        where: { id },
        data: {
          balance: { increment: dto.amount },
          availableBalance: { increment: dto.amount },
          lastTransactionDate: dto.transactionDate,
        },
      });

      // TODO: Créer les écritures comptables
      // Débit: Compte caisse/banque
      // Crédit: Compte épargne client

      return transaction;
    });
  }

  // ============ RETRAITS ============

  async withdraw(id: string, dto: WithdrawalDto, organizationId: string, processedById: string) {
    const account = await this.findOneSavingsAccount(id, organizationId);

    if (account.status !== 'ACTIVE') {
      throw new BadRequestException('Le compte doit être actif pour effectuer des retraits');
    }

    const product = account.savingsProduct;

    // Vérifier le solde disponible
    const remainingBalance = account.balance - dto.amount;
    if (remainingBalance < product.minBalance) {
      throw new BadRequestException(
        `Le solde minimum requis est de ${product.minBalance}. Solde après retrait: ${remainingBalance}`,
      );
    }

    // Vérifier le montant maximum de retrait
    if (product.maxWithdrawalAmount && dto.amount > product.maxWithdrawalAmount) {
      throw new BadRequestException(`Le montant maximum de retrait est de ${product.maxWithdrawalAmount}`);
    }

    // Vérifier le nombre de retraits du mois
    if (product.maxWithdrawalsPerMonth) {
      const startOfMonth = new Date(dto.transactionDate.getFullYear(), dto.transactionDate.getMonth(), 1);
      const endOfMonth = new Date(dto.transactionDate.getFullYear(), dto.transactionDate.getMonth() + 1, 0);

      const withdrawalsThisMonth = await this.prisma.savingsTransaction.count({
        where: {
          savingsAccountId: id,
          transactionType: 'WITHDRAWAL',
          transactionDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      if (withdrawalsThisMonth >= product.maxWithdrawalsPerMonth) {
        throw new BadRequestException(`Nombre maximum de retraits par mois atteint (${product.maxWithdrawalsPerMonth})`);
      }
    }

    // Calculer les frais de retrait
    const fees = product.withdrawalFee || 0;
    const totalAmount = dto.amount + fees;

    if (account.balance < totalAmount) {
      throw new BadRequestException(`Solde insuffisant. Montant demandé: ${dto.amount}, Frais: ${fees}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Créer la transaction de retrait
      const transaction = await tx.savingsTransaction.create({
        data: {
          savingsAccountId: id,
          transactionType: 'WITHDRAWAL',
          amount: dto.amount,
          fees,
          transactionDate: dto.transactionDate,
          paymentMethod: dto.paymentMethod,
          reference: dto.reference,
          notes: dto.notes,
          balanceAfter: account.balance - totalAmount,
          createdById: processedById,
        },
      });

      // Mettre à jour le solde
      await tx.savingsAccount.update({
        where: { id },
        data: {
          balance: { decrement: totalAmount },
          availableBalance: { decrement: totalAmount },
          lastTransactionDate: dto.transactionDate,
        },
      });

      // Créer la transaction de frais si applicable
      if (fees > 0) {
        await tx.savingsTransaction.create({
          data: {
            savingsAccountId: id,
            transactionType: 'FEE',
            amount: fees,
            transactionDate: dto.transactionDate,
            notes: 'Frais de retrait',
            balanceAfter: account.balance - totalAmount,
            createdById: processedById,
          },
        });
      }

      // TODO: Créer les écritures comptables
      // Débit: Compte épargne client
      // Crédit: Compte caisse/banque
      // Débit: Compte épargne client (frais)
      // Crédit: Compte produits de frais

      return transaction;
    });
  }

  // ============ CALCUL ET AFFECTATION DES INTÉRÊTS ============

  async calculateAndPostInterest(organizationId: string, dto: InterestCalculationDto) {
    // Récupérer tous les comptes actifs
    const accounts = await this.prisma.savingsAccount.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      include: {
        savingsProduct: true,
      },
    });

    const results = [];

    for (const account of accounts) {
      // Calculer la période (nombre de jours depuis la dernière affectation)
      const lastInterestDate = account.lastInterestCalculationDate || account.activatedDate;
      const daysSinceLastCalculation = Math.floor(
        (dto.calculationDate.getTime() - lastInterestDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceLastCalculation <= 0) {
        continue;
      }

      // Calculer l'intérêt : (Solde * Taux annuel * Jours) / 365
      const interestAmount =
        (account.balance * account.nominalAnnualInterestRate * daysSinceLastCalculation) / (365 * 100);

      if (interestAmount > 0) {
        await this.prisma.$transaction(async (tx) => {
          // Créer la transaction d'intérêt
          await tx.savingsTransaction.create({
            data: {
              savingsAccountId: account.id,
              transactionType: 'INTEREST_POSTING',
              amount: interestAmount,
              transactionDate: dto.postingDate,
              notes: `Intérêts pour ${daysSinceLastCalculation} jours`,
              balanceAfter: account.balance + interestAmount,
              createdById: 'SYSTEM',
            },
          });

          // Mettre à jour le compte
          await tx.savingsAccount.update({
            where: { id: account.id },
            data: {
              balance: { increment: interestAmount },
              availableBalance: { increment: interestAmount },
              totalInterestEarned: { increment: interestAmount },
              lastInterestCalculationDate: dto.calculationDate,
              lastTransactionDate: dto.postingDate,
            },
          });

          // TODO: Créer les écritures comptables
          // Débit: Compte charge d'intérêts
          // Crédit: Compte épargne client
        });

        results.push({
          accountId: account.id,
          accountNumber: account.accountNumber,
          interestAmount,
          daysSinceLastCalculation,
        });
      }
    }

    return {
      calculationDate: dto.calculationDate,
      postingDate: dto.postingDate,
      accountsProcessed: results.length,
      totalInterestPosted: results.reduce((sum, r) => sum + r.interestAmount, 0),
      details: results,
    };
  }

  // ============ FRAIS DE MAINTENANCE ============

  async applyMonthlyMaintenanceFees(organizationId: string, feeDate: Date) {
    const accounts = await this.prisma.savingsAccount.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
      include: {
        savingsProduct: true,
      },
    });

    const results = [];

    for (const account of accounts) {
      const product = account.savingsProduct;

      if (product.monthlyMaintenanceFee && product.monthlyMaintenanceFee > 0) {
        await this.prisma.$transaction(async (tx) => {
          // Créer la transaction de frais
          await tx.savingsTransaction.create({
            data: {
              savingsAccountId: account.id,
              transactionType: 'FEE',
              amount: product.monthlyMaintenanceFee,
              transactionDate: feeDate,
              notes: 'Frais de tenue de compte mensuel',
              balanceAfter: account.balance - product.monthlyMaintenanceFee,
              createdById: 'SYSTEM',
            },
          });

          // Mettre à jour le solde
          await tx.savingsAccount.update({
            where: { id: account.id },
            data: {
              balance: { decrement: product.monthlyMaintenanceFee },
              availableBalance: { decrement: product.monthlyMaintenanceFee },
              lastTransactionDate: feeDate,
            },
          });
        });

        results.push({
          accountId: account.id,
          accountNumber: account.accountNumber,
          feeAmount: product.monthlyMaintenanceFee,
        });
      }
    }

    return {
      feeDate,
      accountsProcessed: results.length,
      totalFeesApplied: results.reduce((sum, r) => sum + r.feeAmount, 0),
      details: results,
    };
  }

  // ============ BLOCAGE / DÉBLOCAGE ============

  async blockAccount(id: string, organizationId: string, blockedById: string, blockReason: string) {
    const account = await this.findOneSavingsAccount(id, organizationId);

    if (account.status !== 'ACTIVE') {
      throw new BadRequestException('Seuls les comptes actifs peuvent être bloqués');
    }

    return this.prisma.savingsAccount.update({
      where: { id },
      data: {
        status: 'BLOCKED',
        blockedDate: new Date(),
        blockedById,
        blockReason,
      },
    });
  }

  async unblockAccount(id: string, organizationId: string, unblockedById: string) {
    const account = await this.findOneSavingsAccount(id, organizationId);

    if (account.status !== 'BLOCKED') {
      throw new BadRequestException('Seuls les comptes bloqués peuvent être débloqués');
    }

    return this.prisma.savingsAccount.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        blockedDate: null,
        blockedById: null,
        blockReason: null,
      },
    });
  }

  // ============ UTILITAIRES ============

  private async generateAccountNumber(organizationId: string): Promise<string> {
    const count = await this.prisma.savingsAccount.count({ where: { organizationId } });
    const orgPrefix = organizationId.substring(0, 4).toUpperCase();
    return `SAV-${orgPrefix}-${String(count + 1).padStart(8, '0')}`;
  }

  // ============ STATISTIQUES ============

  async getSavingsStatistics(organizationId: string) {
    const [totalAccounts, activeAccounts, totalBalance, totalInterest] = await Promise.all([
      this.prisma.savingsAccount.count({ where: { organizationId } }),
      this.prisma.savingsAccount.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.prisma.savingsAccount.aggregate({
        where: { organizationId, status: 'ACTIVE' },
        _sum: { balance: true },
      }),
      this.prisma.savingsAccount.aggregate({
        where: { organizationId, status: 'ACTIVE' },
        _sum: { totalInterestEarned: true },
      }),
    ]);

    return {
      totalAccounts,
      activeAccounts,
      totalBalance: totalBalance._sum.balance || 0,
      totalInterestEarned: totalInterest._sum.totalInterestEarned || 0,
    };
  }
}
