import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import crypto from 'node:crypto';

import { PrismaService } from '../../prisma/prisma.service';

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private accessSecret(): string {
    return this.config.get<string>('JWT_ACCESS_SECRET') ?? 'change-me-access';
  }

  private refreshSecret(): string {
    return this.config.get<string>('JWT_REFRESH_SECRET') ?? 'change-me-refresh';
  }

  private accessTtlSeconds(): number {
    return Number(this.config.get('JWT_ACCESS_TTL_SECONDS') ?? 900);
  }

  private refreshTtlSeconds(): number {
    return Number(this.config.get('JWT_REFRESH_TTL_SECONDS') ?? 60 * 60 * 24 * 14);
  }

  private hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async signTokens(params: {
    userId: string;
    organizationId: string;
    username: string;
    roles: string[];
  }): Promise<TokenPair> {
    const expiresInSeconds = this.accessTtlSeconds();
    const accessToken = await this.jwt.signAsync(
      {
        sub: params.userId,
        orgId: params.organizationId,
        username: params.username,
        roles: params.roles,
      },
      { secret: this.accessSecret(), expiresIn: expiresInSeconds },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: params.userId, orgId: params.organizationId },
      { secret: this.refreshSecret(), expiresIn: this.refreshTtlSeconds() },
    );

    return { accessToken, refreshToken, expiresInSeconds };
  }

  async bootstrap(input: {
    organizationName?: string;
    adminUsername?: string;
    adminPassword?: string;
  }) {
    const existingOrgCount = await this.prisma.organization.count();
    if (existingOrgCount > 0) {
      throw new ForbiddenException(
        'Bootstrap déjà effectué. Utilisez la procédure d’administration standard.',
      );
    }

    const orgName = input.organizationName ?? "MFI (Afrique de l'Ouest)";
    const adminUsername = input.adminUsername ?? 'admin';
    const adminPassword = input.adminPassword ?? 'ChangeMe123!';

    const passwordHash = await argon2.hash(adminPassword);

    const result = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: orgName, defaultCurrencyCode: 'XOF', defaultLanguage: 'FR' },
      });

      const headOffice = await tx.office.create({
        data: { organizationId: org.id, code: 'HO', name: 'Siège' },
      });

      const roleNames = ['Admin', 'Caissier', 'AgentCredit', 'Auditeur'] as const;
      const roles = await Promise.all(
        roleNames.map((name) =>
          tx.role.create({
            data: { organizationId: org.id, name },
          }),
        ),
      );

      const admin = await tx.user.create({
        data: {
          organizationId: org.id,
          officeId: headOffice.id,
          username: adminUsername,
          passwordHash,
          status: 'ACTIVE',
        },
      });

      const adminRole = roles.find((r) => r.name === 'Admin');
      if (!adminRole) throw new BadRequestException('Rôle Admin introuvable.');

      await tx.userRole.create({
        data: { userId: admin.id, roleId: adminRole.id },
      });

      // Comptabilité (socle): plan comptable minimal + règles d’imputation
      const cash = await tx.accountingAccount.create({
        data: {
          organizationId: org.id,
          code: '1010',
          name: 'Caisse',
          type: 'ASSET',
          isHeader: false,
        },
      });
      const loanPortfolio = await tx.accountingAccount.create({
        data: {
          organizationId: org.id,
          code: '1310',
          name: 'Portefeuille prêts',
          type: 'ASSET',
          isHeader: false,
        },
      });
      const interestIncome = await tx.accountingAccount.create({
        data: {
          organizationId: org.id,
          code: '4010',
          name: "Produits d'intérêts",
          type: 'INCOME',
          isHeader: false,
        },
      });
      const savingsLiability = await tx.accountingAccount.create({
        data: {
          organizationId: org.id,
          code: '2110',
          name: 'Dépôts clients (épargne)',
          type: 'LIABILITY',
          isHeader: false,
        },
      });

      const ruleDisb = await tx.accountingRule.create({
        data: {
          organizationId: org.id,
          eventType: 'LOAN_DISBURSEMENT',
          description: 'Décaissement prêt (portefeuille prêts / caisse)',
          lines: {
            create: [
              { entryType: 'DEBIT', component: 'PRINCIPAL', accountId: loanPortfolio.id },
              { entryType: 'CREDIT', component: 'TOTAL', accountId: cash.id },
            ],
          },
        },
      });
      void ruleDisb;

      const ruleRepay = await tx.accountingRule.create({
        data: {
          organizationId: org.id,
          eventType: 'LOAN_REPAYMENT',
          description: 'Remboursement prêt (caisse / portefeuille prêts + intérêts)',
          lines: {
            create: [
              { entryType: 'DEBIT', component: 'TOTAL', accountId: cash.id },
              { entryType: 'CREDIT', component: 'PRINCIPAL', accountId: loanPortfolio.id },
              { entryType: 'CREDIT', component: 'INTEREST', accountId: interestIncome.id },
            ],
          },
        },
      });
      void ruleRepay;

      const ruleSavDep = await tx.accountingRule.create({
        data: {
          organizationId: org.id,
          eventType: 'SAVINGS_DEPOSIT',
          description: 'Dépôt épargne (caisse / dépôts clients)',
          lines: {
            create: [
              { entryType: 'DEBIT', component: 'TOTAL', accountId: cash.id },
              { entryType: 'CREDIT', component: 'TOTAL', accountId: savingsLiability.id },
            ],
          },
        },
      });
      void ruleSavDep;

      const ruleSavWdr = await tx.accountingRule.create({
        data: {
          organizationId: org.id,
          eventType: 'SAVINGS_WITHDRAWAL',
          description: 'Retrait épargne (dépôts clients / caisse)',
          lines: {
            create: [
              { entryType: 'DEBIT', component: 'TOTAL', accountId: savingsLiability.id },
              { entryType: 'CREDIT', component: 'TOTAL', accountId: cash.id },
            ],
          },
        },
      });
      void ruleSavWdr;

      return { org, headOffice, admin, roles };
    });

    return {
      organizationId: result.org.id,
      adminUserId: result.admin.id,
      adminUsername: result.admin.username,
    };
  }

  async login(username: string, password: string): Promise<TokenPair> {
    // Hypothèse socle: 1 organisation active.
    const org = await this.prisma.organization.findFirst();
    if (!org) throw new ForbiddenException('Plateforme non initialisée (bootstrap requis).');

    const user = await this.prisma.user.findUnique({
      where: { organizationId_username: { organizationId: org.id, username } },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new UnauthorizedException('Identifiants invalides.');
    if (user.status !== 'ACTIVE') throw new ForbiddenException('Utilisateur désactivé.');

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Identifiants invalides.');

    const roles = user.roles.map((ur) => ur.role.name);
    const tokens = await this.signTokens({
      userId: user.id,
      organizationId: user.organizationId,
      username: user.username,
      roles,
    });

    // Stocker une trace de refresh token (hashé) pour pouvoir révoquer.
    const refreshTokenHash = this.hashRefreshToken(tokens.refreshToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.refreshTtlSeconds() * 1000);
    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: refreshTokenHash, expiresAt },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: 'LOGIN',
        success: true,
        metadata: { username: user.username },
      },
    });

    return tokens;
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, { secret: this.refreshSecret() });
      const userId = payload.sub as string;
      const organizationId = payload.orgId as string;

      const tokenHash = this.hashRefreshToken(refreshToken);
      const stored = await this.prisma.refreshToken.findFirst({
        where: { userId, tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      });
      if (!stored) throw new UnauthorizedException('Refresh token invalide ou révoqué.');

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { roles: { include: { role: true } } },
      });
      if (!user || user.organizationId !== organizationId) throw new UnauthorizedException();
      if (user.status !== 'ACTIVE') throw new ForbiddenException('Utilisateur désactivé.');

      const roles = user.roles.map((ur) => ur.role.name);
      const tokens = await this.signTokens({
        userId: user.id,
        organizationId: user.organizationId,
        username: user.username,
        roles,
      });

      const newHash = this.hashRefreshToken(tokens.refreshToken);
      const expiresAt = new Date(Date.now() + this.refreshTtlSeconds() * 1000);

      await this.prisma.$transaction([
        this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } }),
        this.prisma.refreshToken.create({ data: { userId: user.id, tokenHash: newHash, expiresAt } }),
      ]);

      return tokens;
    } catch (e) {
      throw new UnauthorizedException('Refresh token invalide.');
    }
  }

  async logout(refreshToken: string) {
    const hash = this.hashRefreshToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }
}

