import { Module } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { LoanScheduleService } from './services/loan-schedule.service';

@Module({
  controllers: [LoansController],
  providers: [LoansService, LoanScheduleService],
  exports: [LoansService, LoanScheduleService],
})
export class LoansModule {}
