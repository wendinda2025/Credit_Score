import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccountingEventType } from '@prisma/client';

import { CurrentUser } from '../iam/decorators/current-user.decorator';
import { Roles } from '../iam/decorators/roles.decorator';
import type { AuthUser } from '../iam/types/auth-user';
import { AccountingService } from './accounting.service';
import { CreateAccountingAccountDto } from './dto/account.dto';
import { CreateJournalEntryDto } from './dto/journal.dto';
import { UpsertAccountingRuleDto } from './dto/rule.dto';

@ApiTags('accounting')
@ApiBearerAuth()
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accounting: AccountingService) {}

  @Get('accounts')
  async listAccounts(@CurrentUser() user: AuthUser) {
    return await this.accounting.listAccounts(user.organizationId);
  }

  @Roles('Admin')
  @Post('accounts')
  async createAccount(@CurrentUser() user: AuthUser, @Body() dto: CreateAccountingAccountDto) {
    return await this.accounting.createAccount(user.organizationId, dto);
  }

  @Roles('Admin')
  @Put('rules')
  async upsertRule(@CurrentUser() user: AuthUser, @Body() dto: UpsertAccountingRuleDto) {
    return await this.accounting.upsertRule(user.organizationId, dto);
  }

  @Get('rules/:eventType')
  async getRule(@CurrentUser() user: AuthUser, @Param('eventType') eventType: AccountingEventType) {
    return await this.accounting.getRule(user.organizationId, eventType);
  }

  @Roles('Admin', 'Auditeur')
  @Post('journals')
  async postManual(@CurrentUser() user: AuthUser, @Body() dto: CreateJournalEntryDto) {
    return await this.accounting.postManualJournalEntry({
      orgId: user.organizationId,
      userId: user.userId,
      transactionDate: new Date(dto.transactionDate),
      reference: dto.reference,
      memo: dto.memo,
      lines: dto.lines,
    });
  }

  @Get('trial-balance')
  async trialBalance(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return await this.accounting.trialBalance(
      user.organizationId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}

