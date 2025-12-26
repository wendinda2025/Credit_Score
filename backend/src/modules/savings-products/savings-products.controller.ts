import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../iam/decorators/current-user.decorator';
import { Roles } from '../iam/decorators/roles.decorator';
import type { AuthUser } from '../iam/types/auth-user';
import { CreateSavingsProductDto } from './dto/savings-product.dto';
import { SavingsProductsService } from './savings-products.service';

@ApiTags('savings-products')
@ApiBearerAuth()
@Controller('savings-products')
export class SavingsProductsController {
  constructor(private readonly products: SavingsProductsService) {}

  @Roles('Admin')
  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateSavingsProductDto) {
    return await this.products.create(user.organizationId, dto);
  }

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    return await this.products.list(user.organizationId);
  }
}

