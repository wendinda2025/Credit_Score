import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import {
  CreateChartOfAccountDto,
  CreateJournalEntryDto,
} from './dto/accounting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('accounting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('chart-of-accounts')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Créer un compte du plan comptable' })
  async createChartOfAccount(@Body() createDto: CreateChartOfAccountDto) {
    return this.accountingService.createChartOfAccount(createDto);
  }

  @Get('chart-of-accounts')
  @ApiOperation({ summary: 'Liste du plan comptable' })
  async findAllChartOfAccounts(@CurrentUser() user: any) {
    return this.accountingService.findAllChartOfAccounts(
      user.organizationId,
    );
  }

  @Post('journal-entries')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Créer une écriture comptable' })
  async createJournalEntry(
    @Body() createDto: CreateJournalEntryDto,
    @CurrentUser() user: any,
  ) {
    return this.accountingService.createJournalEntry(createDto, user.id);
  }

  @Get('balance-sheet')
  @Roles('ADMIN', 'ACCOUNTANT', 'AUDITOR')
  @ApiOperation({ summary: 'Bilan comptable' })
  async getBalanceSheet(
    @CurrentUser() user: any,
    @Query('asOfDate') asOfDate?: string,
  ) {
    const date = asOfDate ? new Date(asOfDate) : new Date();
    return this.accountingService.getBalanceSheet(user.organizationId, date);
  }

  @Get('general-ledger/:accountId')
  @Roles('ADMIN', 'ACCOUNTANT', 'AUDITOR')
  @ApiOperation({ summary: 'Grand livre d\'un compte' })
  async getGeneralLedger(
    @Param('accountId') accountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.accountingService.getGeneralLedger(
      accountId,
      accountId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
