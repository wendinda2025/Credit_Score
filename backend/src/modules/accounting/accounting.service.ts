import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountingComponent, AccountingEventType, JournalLineType, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

type MoneyByComponent = Partial<Record<AccountingComponent, Prisma.Decimal>>;

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  private dec(value: string | number | Prisma.Decimal): Prisma.Decimal {
    try {
      // Prisma.Decimal accepte string/number
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new (Prisma as any).Decimal(value);
    } catch {
      throw new BadRequestException('Montant invalide.');
    }
  }

  async createAccount(orgId: string, input: { code: string; name: string; type: any; parentId?: string; isHeader?: boolean; currencyCode?: string }) {
    return await this.prisma.accountingAccount.create({
      data: {
        organizationId: orgId,
        code: input.code,
        name: input.name,
        type: input.type,
        parentId: input.parentId,
        isHeader: input.isHeader ?? false,
        currencyCode: input.currencyCode,
      },
    });
  }

  async listAccounts(orgId: string) {
    return await this.prisma.accountingAccount.findMany({
      where: { organizationId: orgId, isActive: true },
      orderBy: [{ code: 'asc' }],
    });
  }

  async upsertRule(orgId: string, input: { eventType: AccountingEventType; description?: string; lines: { entryType: JournalLineType; component: AccountingComponent; accountId: string }[] }) {
    if (!input.lines || input.lines.length < 2) {
      throw new BadRequestException('Une règle comptable doit contenir au moins 2 lignes.');
    }

    const keys = new Set<string>();
    for (const l of input.lines) {
      const k = `${l.entryType}:${l.component}`;
      if (keys.has(k)) throw new BadRequestException(`Doublon règle: ${k}`);
      keys.add(k);
    }

    // Vérifier que les comptes appartiennent à l'organisation.
    const accountIds = input.lines.map((l) => l.accountId);
    const count = await this.prisma.accountingAccount.count({
      where: { organizationId: orgId, id: { in: accountIds } },
    });
    if (count !== accountIds.length) throw new BadRequestException('Compte comptable invalide.');

    const existing = await this.prisma.accountingRule.findUnique({
      where: { organizationId_eventType: { organizationId: orgId, eventType: input.eventType } },
      include: { lines: true },
    });

    if (!existing) {
      return await this.prisma.accountingRule.create({
        data: {
          organizationId: orgId,
          eventType: input.eventType,
          description: input.description,
          lines: {
            create: input.lines.map((l) => ({
              entryType: l.entryType,
              component: l.component,
              accountId: l.accountId,
            })),
          },
        },
        include: { lines: true },
      });
    }

    return await this.prisma.accountingRule.update({
      where: { id: existing.id },
      data: {
        description: input.description,
        lines: {
          deleteMany: { ruleId: existing.id },
          create: input.lines.map((l) => ({
            entryType: l.entryType,
            component: l.component,
            accountId: l.accountId,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async getRule(orgId: string, eventType: AccountingEventType) {
    const rule = await this.prisma.accountingRule.findUnique({
      where: { organizationId_eventType: { organizationId: orgId, eventType } },
      include: { lines: true },
    });
    if (!rule) throw new NotFoundException('Règle comptable introuvable.');
    return rule;
  }

  private validateDoubleEntry(lines: { entryType: JournalLineType; amount: Prisma.Decimal }[]) {
    const debit = lines
      .filter((l) => l.entryType === 'DEBIT')
      .reduce((a, b) => a.add(b.amount), this.dec(0));
    const credit = lines
      .filter((l) => l.entryType === 'CREDIT')
      .reduce((a, b) => a.add(b.amount), this.dec(0));
    if (!debit.equals(credit)) {
      throw new BadRequestException('Écriture déséquilibrée (débit != crédit).');
    }
    if (debit.lte(this.dec(0))) throw new BadRequestException('Montants invalides (<= 0).');
  }

  async postManualJournalEntry(params: {
    orgId: string;
    userId: string;
    transactionDate: Date;
    reference?: string;
    memo?: string;
    lines: { accountId: string; entryType: JournalLineType; amount: string; memo?: string }[];
  }) {
    if (!params.lines || params.lines.length < 2) throw new BadRequestException('Au moins 2 lignes.');

    const parsedLines = params.lines.map((l) => ({
      accountId: l.accountId,
      entryType: l.entryType,
      amount: this.dec(l.amount),
      memo: l.memo,
    }));
    this.validateDoubleEntry(parsedLines);

    const accountIds = parsedLines.map((l) => l.accountId);
    const count = await this.prisma.accountingAccount.count({
      where: { organizationId: params.orgId, id: { in: accountIds } },
    });
    if (count !== accountIds.length) throw new BadRequestException('Compte comptable invalide.');

    return await this.prisma.journalEntry.create({
      data: {
        organizationId: params.orgId,
        transactionDate: params.transactionDate,
        reference: params.reference,
        memo: params.memo,
        createdByUserId: params.userId,
        status: 'POSTED',
        lines: {
          create: parsedLines.map((l) => ({
            accountId: l.accountId,
            entryType: l.entryType,
            amount: l.amount,
            memo: l.memo,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async postAccountingEvent(params: {
    orgId: string;
    userId: string;
    eventType: AccountingEventType;
    transactionDate: Date;
    reference?: string;
    memo?: string;
    amounts: MoneyByComponent;
  }) {
    const rule = await this.getRule(params.orgId, params.eventType);
    const lines = rule.lines.map((rl) => {
      const amount = params.amounts[rl.component] ?? this.dec(0);
      return {
        accountId: rl.accountId,
        entryType: rl.entryType,
        amount,
        memo: `${params.eventType}:${rl.component}`,
      };
    });
    this.validateDoubleEntry(lines);

    return await this.prisma.journalEntry.create({
      data: {
        organizationId: params.orgId,
        transactionDate: params.transactionDate,
        reference: params.reference,
        memo: params.memo ?? params.eventType,
        createdByUserId: params.userId,
        status: 'POSTED',
        lines: {
          create: lines.map((l) => ({
            accountId: l.accountId,
            entryType: l.entryType,
            amount: l.amount,
            memo: l.memo,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async trialBalance(orgId: string, from?: Date, to?: Date) {
    const whereEntry: Prisma.JournalEntryWhereInput = {
      organizationId: orgId,
      status: 'POSTED',
      ...(from || to
        ? {
            transactionDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const entries = await this.prisma.journalEntry.findMany({
      where: whereEntry,
      select: { id: true },
    });
    const entryIds = entries.map((e) => e.id);
    if (entryIds.length === 0) return [];

    const grouped = await this.prisma.journalEntryLine.groupBy({
      by: ['accountId', 'entryType'],
      where: { journalEntryId: { in: entryIds } },
      _sum: { amount: true },
    });

    const accountIds = Array.from(new Set(grouped.map((g) => g.accountId)));
    const accounts = await this.prisma.accountingAccount.findMany({
      where: { organizationId: orgId, id: { in: accountIds } },
      select: { id: true, code: true, name: true, type: true },
    });
    const byId = new Map(accounts.map((a) => [a.id, a]));

    const rows = new Map<
      string,
      { accountId: string; code: string; name: string; type: string; debit: Prisma.Decimal; credit: Prisma.Decimal }
    >();

    for (const g of grouped) {
      const acc = byId.get(g.accountId);
      if (!acc) continue;
      if (!rows.has(g.accountId)) {
        rows.set(g.accountId, {
          accountId: g.accountId,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          debit: this.dec(0),
          credit: this.dec(0),
        });
      }
      const row = rows.get(g.accountId)!;
      const amount = (g._sum.amount ?? this.dec(0)) as unknown as Prisma.Decimal;
      if (g.entryType === 'DEBIT') row.debit = row.debit.add(amount);
      else row.credit = row.credit.add(amount);
    }

    return Array.from(rows.values()).sort((a, b) => a.code.localeCompare(b.code));
  }
}

