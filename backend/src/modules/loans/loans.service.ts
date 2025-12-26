import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountingEventType, Prisma } from '@prisma/client';
import dayjs from 'dayjs';

import { PrismaService } from '../../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { AmortizationService } from './services/amortization.service';

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly amortization: AmortizationService,
    private readonly accounting: AccountingService,
  ) {}

  private dec(value: string | number | Prisma.Decimal): Prisma.Decimal {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (Prisma as any).Decimal(value);
  }

  async create(orgId: string, userId: string, input: any) {
    const product = await this.prisma.loanProduct.findFirst({
      where: { organizationId: orgId, id: input.loanProductId },
    });
    if (!product) throw new NotFoundException('Produit de prêt introuvable.');

    const client = await this.prisma.client.findFirst({ where: { organizationId: orgId, id: input.clientId } });
    if (!client) throw new NotFoundException('Client introuvable.');

    const principal = this.dec(input.principal);
    if (principal.lte(this.dec(0))) throw new BadRequestException('Principal invalide.');

    const loan = await this.prisma.loanAccount.create({
      data: {
        organizationId: orgId,
        clientId: client.id,
        loanProductId: product.id,
        status: 'SUBMITTED',
        currencyCode: product.currencyCode,
        principal,
        interestType: product.interestType,
        interestRateAnnualPercent: product.interestRateAnnualPercent,
        repaymentFrequency: product.repaymentFrequency,
        repaymentEvery: product.repaymentEvery,
        numberOfRepayments: product.numberOfRepayments,
        expectedDisbursementAt: input.expectedDisbursementAt ? new Date(input.expectedDisbursementAt) : null,
        firstRepaymentDate: input.firstRepaymentDate ? new Date(input.firstRepaymentDate) : null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId,
        action: 'CREATE',
        entityType: 'LoanAccount',
        entityId: loan.id,
        metadata: { clientId: client.id, loanProductId: product.id },
      },
    });

    return loan;
  }

  async list(orgId: string) {
    return await this.prisma.loanAccount.findMany({
      where: { organizationId: orgId },
      include: { client: true, loanProduct: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(orgId: string, id: string) {
    const loan = await this.prisma.loanAccount.findFirst({
      where: { organizationId: orgId, id },
      include: { client: true, loanProduct: true, installments: { orderBy: { installmentNumber: 'asc' } }, transactions: true },
    });
    if (!loan) throw new NotFoundException('Prêt introuvable.');
    return loan;
  }

  async approve(orgId: string, userId: string, id: string, approvedAt?: Date) {
    const loan = await this.prisma.loanAccount.findFirst({ where: { organizationId: orgId, id } });
    if (!loan) throw new NotFoundException('Prêt introuvable.');
    if (loan.status !== 'SUBMITTED') throw new BadRequestException('Statut incompatible.');

    const updated = await this.prisma.loanAccount.update({
      where: { id: loan.id },
      data: { status: 'APPROVED', approvedAt: approvedAt ?? new Date() },
    });

    await this.prisma.auditLog.create({
      data: { organizationId: orgId, userId, action: 'APPROVE', entityType: 'LoanAccount', entityId: loan.id },
    });

    return updated;
  }

  private defaultFirstRepaymentDate(disbursedAt: Date, repaymentFrequency: any, repaymentEvery: number): Date {
    const d = dayjs(disbursedAt);
    const e = Math.max(1, repaymentEvery ?? 1);
    if (repaymentFrequency === 'DAILY') return d.add(e, 'day').toDate();
    if (repaymentFrequency === 'WEEKLY') return d.add(e, 'week').toDate();
    if (repaymentFrequency === 'BIWEEKLY') return d.add(2 * e, 'week').toDate();
    return d.add(e, 'month').toDate();
  }

  async disburse(orgId: string, userId: string, id: string, input: any) {
    const loan = await this.prisma.loanAccount.findFirst({
      where: { organizationId: orgId, id },
      include: { installments: true },
    });
    if (!loan) throw new NotFoundException('Prêt introuvable.');
    if (loan.status !== 'APPROVED') throw new BadRequestException('Statut incompatible.');
    if (loan.installments.length > 0) throw new BadRequestException('Échéancier déjà généré.');

    const disbursedAt = input.disbursedAt ? new Date(input.disbursedAt) : new Date();
    const firstRepaymentDate =
      (input.firstRepaymentDate ? new Date(input.firstRepaymentDate) : loan.firstRepaymentDate) ??
      this.defaultFirstRepaymentDate(disbursedAt, loan.repaymentFrequency, loan.repaymentEvery);

    const schedule = this.amortization.generateSchedule({
      principal: loan.principal,
      annualInterestRatePercent: loan.interestRateAnnualPercent,
      interestType: loan.interestType,
      repaymentFrequency: loan.repaymentFrequency,
      repaymentEvery: loan.repaymentEvery,
      numberOfRepayments: loan.numberOfRepayments,
      firstRepaymentDate,
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const l = await tx.loanAccount.update({
        where: { id: loan.id },
        data: { status: 'DISBURSED', disbursedAt, firstRepaymentDate },
      });

      await tx.loanScheduleInstallment.createMany({
        data: schedule.map((i) => ({
          loanAccountId: loan.id,
          installmentNumber: i.installmentNumber,
          dueDate: i.dueDate,
          principalDue: i.principalDue,
          interestDue: i.interestDue,
        })),
      });

      await tx.loanTransaction.create({
        data: {
          loanAccountId: loan.id,
          type: 'DISBURSEMENT',
          transactionDate: disbursedAt,
          amount: loan.principal,
        },
      });

      return l;
    });

    // Comptabilité: décaissement
    await this.accounting.postAccountingEvent({
      orgId,
      userId,
      eventType: AccountingEventType.LOAN_DISBURSEMENT,
      transactionDate: disbursedAt,
      reference: `LOAN:${loan.id}:DISB`,
      memo: 'Décaissement prêt',
      amounts: {
        TOTAL: loan.principal,
        PRINCIPAL: loan.principal,
      },
    });

    await this.prisma.auditLog.create({
      data: { organizationId: orgId, userId, action: 'DISBURSE', entityType: 'LoanAccount', entityId: loan.id },
    });

    return updated;
  }

  async repay(orgId: string, userId: string, id: string, input: any) {
    const loan = await this.prisma.loanAccount.findFirst({
      where: { organizationId: orgId, id },
      include: { installments: { orderBy: { installmentNumber: 'asc' } } },
    });
    if (!loan) throw new NotFoundException('Prêt introuvable.');
    if (loan.status !== 'DISBURSED') throw new BadRequestException('Le prêt doit être décaissé.');

    const amount = this.dec(input.amount);
    if (amount.lte(this.dec(0))) throw new BadRequestException('Montant invalide.');

    const txDate = input.transactionDate ? new Date(input.transactionDate) : new Date();

    let remaining = amount;
    let paidInterest = this.dec(0);
    let paidPrincipal = this.dec(0);

    const updates: { id: string; interestInc: Prisma.Decimal; principalInc: Prisma.Decimal; completed: boolean }[] = [];

    for (const inst of loan.installments) {
      if (remaining.lte(this.dec(0))) break;

      const interestOutstanding = this.dec(inst.interestDue).sub(this.dec(inst.interestPaid));
      const payInt =
        interestOutstanding.gt(this.dec(0)) && remaining.gt(this.dec(0))
          ? interestOutstanding.lt(remaining)
            ? interestOutstanding
            : remaining
          : this.dec(0);
      remaining = remaining.sub(payInt);
      paidInterest = paidInterest.add(payInt);

      const principalOutstanding = this.dec(inst.principalDue).sub(this.dec(inst.principalPaid));
      const payPrin =
        principalOutstanding.gt(this.dec(0)) && remaining.gt(this.dec(0))
          ? principalOutstanding.lt(remaining)
            ? principalOutstanding
            : remaining
          : this.dec(0);
      remaining = remaining.sub(payPrin);
      paidPrincipal = paidPrincipal.add(payPrin);

      const newInterestPaid = this.dec(inst.interestPaid).add(payInt);
      const newPrincipalPaid = this.dec(inst.principalPaid).add(payPrin);
      const completed = newInterestPaid.gte(this.dec(inst.interestDue)) && newPrincipalPaid.gte(this.dec(inst.principalDue));

      if (payInt.gt(this.dec(0)) || payPrin.gt(this.dec(0))) {
        updates.push({ id: inst.id, interestInc: payInt, principalInc: payPrin, completed });
      }
    }

    if (paidInterest.equals(this.dec(0)) && paidPrincipal.equals(this.dec(0))) {
      throw new BadRequestException('Rien à imputer sur l’échéancier.');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const u of updates) {
        await tx.loanScheduleInstallment.update({
          where: { id: u.id },
          data: {
            interestPaid: { increment: u.interestInc },
            principalPaid: { increment: u.principalInc },
            completed: u.completed,
          },
        });
      }

      await tx.loanTransaction.create({
        data: {
          loanAccountId: loan.id,
          type: 'REPAYMENT',
          transactionDate: txDate,
          amount,
          principalPortion: paidPrincipal,
          interestPortion: paidInterest,
        },
      });

      const refreshed = await tx.loanScheduleInstallment.count({
        where: { loanAccountId: loan.id, completed: false },
      });
      if (refreshed === 0) {
        await tx.loanAccount.update({ where: { id: loan.id }, data: { status: 'CLOSED', closedAt: txDate } });
      }
    });

    // Comptabilité: remboursement
    await this.accounting.postAccountingEvent({
      orgId,
      userId,
      eventType: AccountingEventType.LOAN_REPAYMENT,
      transactionDate: txDate,
      reference: `LOAN:${loan.id}:REPAY`,
      memo: 'Remboursement prêt',
      amounts: {
        TOTAL: amount,
        PRINCIPAL: paidPrincipal,
        INTEREST: paidInterest,
      },
    });

    await this.prisma.auditLog.create({
      data: { organizationId: orgId, userId, action: 'REPAY', entityType: 'LoanAccount', entityId: loan.id },
    });

    if (remaining.gt(this.dec(0))) {
      // Dans un core banking réel: montant excédentaire -> compte suspense / avance.
      throw new ForbiddenException('Montant excédentaire non géré dans le socle (implémenter suspense).');
    }

    return await this.get(orgId, loan.id);
  }
}

