import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LoansModule } from './modules/loans/loans.module';

import { AccountingModule } from './modules/accounting/accounting.module';
import { ClientsModule } from './modules/clients/clients.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    LoansModule,
    AccountingModule,
    ClientsModule,
  ],
})
export class AppModule {}
