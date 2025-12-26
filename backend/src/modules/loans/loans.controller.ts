import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../iam/decorators/current-user.decorator';
import { Roles } from '../iam/decorators/roles.decorator';
import type { AuthUser } from '../iam/types/auth-user';
import { ApproveLoanDto, CreateLoanDto, DisburseLoanDto, RepayLoanDto } from './dto/loan.dto';
import { LoansService } from './loans.service';

@ApiTags('loans')
@ApiBearerAuth()
@Controller('loans')
export class LoansController {
  constructor(private readonly loans: LoansService) {}

  @Roles('Admin', 'AgentCredit')
  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateLoanDto) {
    return await this.loans.create(user.organizationId, user.userId, dto);
  }

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    return await this.loans.list(user.organizationId);
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return await this.loans.get(user.organizationId, id);
  }

  @Roles('Admin', 'AgentCredit')
  @Post(':id/approve')
  async approve(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ApproveLoanDto) {
    return await this.loans.approve(user.organizationId, user.userId, id, dto.approvedAt ? new Date(dto.approvedAt) : undefined);
  }

  @Roles('Admin', 'AgentCredit')
  @Post(':id/disburse')
  async disburse(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: DisburseLoanDto) {
    return await this.loans.disburse(user.organizationId, user.userId, id, dto);
  }

  @Roles('Admin', 'Caissier')
  @Post(':id/repay')
  async repay(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RepayLoanDto) {
    return await this.loans.repay(user.organizationId, user.userId, id, dto);
  }
}

