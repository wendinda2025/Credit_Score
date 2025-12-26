import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountingEventType, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class SavingsService {
  constructor(private readonly prisma: PrismaService, private readonly accounting: AccountingService) {}

  private dec(value: string | number | Prisma.Decimal): Prisma.Decimal {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (Prisma as any).Decimal(value);
  }

  async open(orgId: string, userId: string, input: any) {
    const product = await this.prisma.savingsProduct.findFirst({
      where: { organizationId: orgId, id: input.savingsProductId },
    });
    if (!product) throw new NotFoundException('Produit épargne introuvable.');

    const client = await this.prisma.client.findFirst({ where: { organizationId: orgId, id: input.clientId } });
    if (!client) throw new NotFoundException('Client introuvable.');

    const account = await this.prisma.savingsAccount.create({
      data: {
        organizationId: orgId,
        clientId: client.id,
        savingsProductId: product.id,
        currencyCode: product.currencyCode,
        status: 'ACTIVE',
        balance: this.dec(0),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId,
        action: 'CREATE',
        entityType: 'SavingsAccount',
        entityId: account.id,
      },
    });

    return account;
  }

  async list(orgId: string) {
    return await this.prisma.savingsAccount.findMany({
      where: { organizationId: orgId },
      include: { client: true, savingsProduct: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(orgId: string, id: string) {
    const acc = await this.prisma.savingsAccount.findFirst({
      where: { organizationId: orgId, id },
      include: { client: true, savingsProduct: true, transactions: true },
    });
    if (!acc) throw new NotFoundException('Compte épargne introuvable.');
    return acc;
  }

  async deposit(orgId: string, userId: string, id: string, input: any) {
    const acc = await this.prisma.savingsAccount.findFirst({ where: { organizationId: orgId, id } });
    if (!acc) throw new NotFoundException('Compte épargne introuvable.');
    if (acc.status !== 'ACTIVE') throw new BadRequestException('Compte non actif.');

    const amount = this.dec(input.amount);
    if (amount.lte(this.dec(0))) throw new BadRequestException('Montant invalide.');

    const txDate = input.transactionDate ? new Date(input.transactionDate) : new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const newBalance = this.dec(acc.balance).add(amount);
      const a = await tx.savingsAccount.update({ where: { id: acc.id }, data: { balance: newBalance } });
      await tx.savingsTransaction.create({
        data: {
          savingsAccountId: acc.id,
          type: 'DEPOSIT',
          transactionDate: txDate,
          amount,
          balanceAfter: newBalance,
        },
      });
      return a;
    });

    await this.accounting.postAccountingEvent({
      orgId,
      userId,
      eventType: AccountingEventType.SAVINGS_DEPOSIT,
      transactionDate: txDate,
      reference: `SAV:${acc.id}:DEP`,
      memo: 'Dépôt épargne',
      amounts: { TOTAL: amount },
    });

    return updated;
  }

  async withdraw(orgId: string, userId: string, id: string, input: any) {
    const acc = await this.prisma.savingsAccount.findFirst({ where: { organizationId: orgId, id } });
    if (!acc) throw new NotFoundException('Compte épargne introuvable.');
    if (acc.status !== 'ACTIVE') throw new BadRequestException('Compte non actif.');

    const amount = this.dec(input.amount);
    if (amount.lte(this.dec(0))) throw new BadRequestException('Montant invalide.');
    if (this.dec(acc.balance).lt(amount)) throw new BadRequestException('Solde insuffisant.');

    const txDate = input.transactionDate ? new Date(input.transactionDate) : new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const newBalance = this.dec(acc.balance).sub(amount);
      const a = await tx.savingsAccount.update({ where: { id: acc.id }, data: { balance: newBalance } });
      await tx.savingsTransaction.create({
        data: {
          savingsAccountId: acc.id,
          type: 'WITHDRAWAL',
          transactionDate: txDate,
          amount,
          balanceAfter: newBalance,
        },
      });
      return a;
    });

    await this.accounting.postAccountingEvent({
      orgId,
      userId,
      eventType: AccountingEventType.SAVINGS_WITHDRAWAL,
      transactionDate: txDate,
      reference: `SAV:${acc.id}:WDR`,
      memo: 'Retrait épargne',
      amounts: { TOTAL: amount },
    });

    return updated;
  }
}

