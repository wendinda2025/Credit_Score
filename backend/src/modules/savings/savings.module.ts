import { Module } from '@nestjs/common';

import { AccountingModule } from '../accounting/accounting.module';
import { SavingsController } from './savings.controller';
import { SavingsService } from './savings.service';

@Module({
  imports: [AccountingModule],
  controllers: [SavingsController],
  providers: [SavingsService],
})
export class SavingsModule {}

