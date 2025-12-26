import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../iam/decorators/current-user.decorator';
import { Roles } from '../iam/decorators/roles.decorator';
import type { AuthUser } from '../iam/types/auth-user';
import { CreateLoanProductDto } from './dto/loan-product.dto';
import { LoanProductsService } from './loan-products.service';

@ApiTags('loan-products')
@ApiBearerAuth()
@Controller('loan-products')
export class LoanProductsController {
  constructor(private readonly products: LoanProductsService) {}

  @Roles('Admin')
  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateLoanProductDto) {
    return await this.products.create(user.organizationId, dto);
  }

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    return await this.products.list(user.organizationId);
  }
}

