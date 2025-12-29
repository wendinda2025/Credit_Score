import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { LoansModule } from './modules/loans/loans.module';
import { SavingsModule } from './modules/savings/savings.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL', 60000),
          limit: config.get('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // Database
    PrismaModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    ClientsModule,
    LoansModule,
    SavingsModule,
    AccountingModule,
    ReportsModule,
    AuditModule,
    OrganizationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
