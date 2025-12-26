import { Module } from '@nestjs/common';
import { LoansService } from './services/loans.service';
import { AmortizationService } from './services/amortization.service';
import { LoansController } from './loans.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LoansController],
  providers: [LoansService, AmortizationService],
  exports: [LoansService, AmortizationService],
})
export class LoansModule {}
