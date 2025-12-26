import { Module } from '@nestjs/common';

import { SavingsProductsController } from './savings-products.controller';
import { SavingsProductsService } from './savings-products.service';

@Module({
  controllers: [SavingsProductsController],
  providers: [SavingsProductsService],
  exports: [SavingsProductsService],
})
export class SavingsProductsModule {}

