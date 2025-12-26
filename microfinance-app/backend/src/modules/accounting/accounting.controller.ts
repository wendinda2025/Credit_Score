import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AccountingService } from './services/accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateChartOfAccountDto,
  CreateJournalEntryDto,
  AccountBalanceQueryDto,
  TrialBalanceQueryDto,
  FinancialStatementQueryDto,
} from './dto/accounting.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Comptabilité')
@ApiBearerAuth()
@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ============ PLAN COMPTABLE ============

  @Post('accounts')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Créer un compte comptable' })
  createAccount(@Body() dto: CreateChartOfAccountDto, @Request() req) {
    return this.accountingService.createAccount(dto, req.user.organizationId);
  }

  @Get('accounts')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Lister les comptes comptables' })
  findAllAccounts(@Query() filters: any, @Request() req) {
    return this.accountingService.findAllAccounts(req.user.organizationId, filters);
  }

  @Get('accounts/:id')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Détails d\'un compte comptable' })
  findOneAccount(@Param('id') id: string, @Request() req) {
    return this.accountingService.findOneAccount(id, req.user.organizationId);
  }

  @Put('accounts/:id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Modifier un compte comptable' })
  updateAccount(@Param('id') id: string, @Body() dto: Partial<CreateChartOfAccountDto>, @Request() req) {
    return this.accountingService.updateAccount(id, dto, req.user.organizationId);
  }

  @Delete('accounts/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Supprimer un compte comptable' })
  deleteAccount(@Param('id') id: string, @Request() req) {
    return this.accountingService.deleteAccount(id, req.user.organizationId);
  }

  // ============ ÉCRITURES COMPTABLES ============

  @Post('journal-entries')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Créer une écriture comptable' })
  createJournalEntry(@Body() dto: CreateJournalEntryDto, @Request() req) {
    return this.accountingService.createJournalEntry(dto, req.user.organizationId, req.user.sub);
  }

  @Get('journal-entries')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Lister les écritures comptables' })
  findAllJournalEntries(@Query() filters: any, @Request() req) {
    return this.accountingService.findAllJournalEntries(req.user.organizationId, filters);
  }

  @Get('journal-entries/:id')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Détails d\'une écriture comptable' })
  findOneJournalEntry(@Param('id') id: string, @Request() req) {
    return this.accountingService.findOneJournalEntry(id, req.user.organizationId);
  }

  @Post('journal-entries/:id/reverse')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Annuler une écriture comptable' })
  reverseJournalEntry(
    @Param('id') id: string,
    @Body() body: { reversalDate: Date },
    @Request() req,
  ) {
    return this.accountingService.reverseJournalEntry(
      id,
      req.user.organizationId,
      body.reversalDate || new Date(),
      req.user.sub,
    );
  }

  // ============ RAPPORTS COMPTABLES ============

  @Get('reports/trial-balance')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Balance générale' })
  getTrialBalance(@Query() dto: TrialBalanceQueryDto, @Request() req) {
    return this.accountingService.getTrialBalance(req.user.organizationId, dto);
  }

  @Get('reports/ledger')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Grand livre' })
  getLedger(@Query() dto: AccountBalanceQueryDto, @Request() req) {
    return this.accountingService.getLedger(req.user.organizationId, dto);
  }

  @Get('reports/income-statement')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Compte de résultat' })
  getIncomeStatement(@Query() dto: FinancialStatementQueryDto, @Request() req) {
    return this.accountingService.getIncomeStatement(req.user.organizationId, dto);
  }

  @Get('reports/balance-sheet')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Bilan' })
  getBalanceSheet(@Query() dto: TrialBalanceQueryDto, @Request() req) {
    return this.accountingService.getBalanceSheet(req.user.organizationId, dto);
  }

  // ============ CLÔTURE DE PÉRIODE ============

  @Post('close-period')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Clôturer une période comptable' })
  closePeriod(@Body() body: { periodEndDate: Date }, @Request() req) {
    return this.accountingService.closePeriod(req.user.organizationId, body.periodEndDate, req.user.sub);
  }
}
