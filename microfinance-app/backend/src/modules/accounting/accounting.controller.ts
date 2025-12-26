import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CreateAccountDto, CreateJournalEntryDto } from './dto/accounting.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('accounts')
  @Roles(Role.ADMIN)
  createAccount(@Body() dto: CreateAccountDto) {
    return this.accountingService.createAccount(dto);
  }

  @Get('accounts')
  getAccounts() {
    return this.accountingService.getAccounts();
  }

  @Post('entries')
  @Roles(Role.ADMIN, Role.AUDITOR) // Manual entries usually restricted
  createEntry(@Body() dto: CreateJournalEntryDto) {
    return this.accountingService.recordEntry(dto);
  }

  @Get('balance-sheet')
  @Roles(Role.ADMIN, Role.AUDITOR)
  getBalanceSheet() {
    return this.accountingService.getBalanceSheet();
  }
}
