import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { JwtAuthGuard } from './modules/iam/guards/jwt-auth.guard';
import { RolesGuard } from './modules/iam/guards/roles.guard';
import { IamModule } from './modules/iam/iam.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { ClientsModule } from './modules/clients/clients.module';
import { LoanProductsModule } from './modules/loan-products/loan-products.module';
import { LoansModule } from './modules/loans/loans.module';
import { SavingsProductsModule } from './modules/savings-products/savings-products.module';
import { SavingsModule } from './modules/savings/savings.module';
import { AuditModule } from './modules/audit/audit.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    IamModule,
    AccountingModule,
    ClientsModule,
    LoanProductsModule,
    LoansModule,
    SavingsProductsModule,
    SavingsModule,
    AuditModule,
    ReportsModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

