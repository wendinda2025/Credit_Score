import { Module } from '@nestjs/common';
import { LoansService } from './services/loans.service';
import { LoansController } from './loans.controller';
import { AmortizationService } from './services/amortization.service';
import { PrismaModule } from '../../prisma/prisma.module';

import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [PrismaModule, AccountingModule],
  controllers: [LoansController],
  providers: [LoansService, AmortizationService],
  exports: [LoansService],
})
export class LoansModule {}
