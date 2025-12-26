import { Module } from '@nestjs/common';

import { AccountingModule } from '../accounting/accounting.module';
import { AmortizationService } from './services/amortization.service';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';

@Module({
  imports: [AccountingModule],
  controllers: [LoansController],
  providers: [LoansService, AmortizationService],
})
export class LoansModule {}

