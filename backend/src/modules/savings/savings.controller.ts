import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../iam/decorators/current-user.decorator';
import { Roles } from '../iam/decorators/roles.decorator';
import type { AuthUser } from '../iam/types/auth-user';
import { OpenSavingsAccountDto, SavingsTransactionDto } from './dto/savings.dto';
import { SavingsService } from './savings.service';

@ApiTags('savings')
@ApiBearerAuth()
@Controller('savings')
export class SavingsController {
  constructor(private readonly savings: SavingsService) {}

  @Roles('Admin', 'Caissier', 'AgentCredit')
  @Post()
  async open(@CurrentUser() user: AuthUser, @Body() dto: OpenSavingsAccountDto) {
    return await this.savings.open(user.organizationId, user.userId, dto);
  }

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    return await this.savings.list(user.organizationId);
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return await this.savings.get(user.organizationId, id);
  }

  @Roles('Admin', 'Caissier')
  @Post(':id/deposit')
  async deposit(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SavingsTransactionDto) {
    return await this.savings.deposit(user.organizationId, user.userId, id, dto);
  }

  @Roles('Admin', 'Caissier')
  @Post(':id/withdraw')
  async withdraw(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SavingsTransactionDto) {
    return await this.savings.withdraw(user.organizationId, user.userId, id, dto);
  }
}

