import { Module } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { AmortizationService } from './services/amortization.service';

@Module({
  providers: [LoansService, AmortizationService],
  controllers: [LoansController],
  exports: [LoansService, AmortizationService],
})
export class LoansModule {}
