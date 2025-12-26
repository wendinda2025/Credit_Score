import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import {
  CreateGLAccountDto,
  UpdateGLAccountDto,
  CreateJournalEntryDto,
  ReverseJournalEntryDto,
  GLAccountQueryDto,
  JournalEntryQueryDto,
  TrialBalanceQueryDto,
  ClosePeriodDto,
} from './dto/accounting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions, SystemPermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('accounting')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ============================================
  // PLAN COMPTABLE
  // ============================================

  @Post('gl-accounts')
  @Permissions(SystemPermissions.ACCOUNTING_CREATE)
  @ApiOperation({ 
    summary: 'Créer un compte comptable',
    description: 'Ajoute un nouveau compte au plan comptable'
  })
  createGLAccount(@Body() dto: CreateGLAccountDto) {
    return this.accountingService.createGLAccount(dto);
  }

  @Get('gl-accounts')
  @Permissions(SystemPermissions.ACCOUNTING_READ)
  @ApiOperation({ 
    summary: 'Plan comptable',
    description: 'Récupère tous les comptes du plan comptable'
  })
  findAllGLAccounts(@Query() query: GLAccountQueryDto) {
    return this.accountingService.findAllGLAccounts(query);
  }

  @Get('gl-accounts/:id')
  @Permissions(SystemPermissions.ACCOUNTING_READ)
  @ApiOperation({ summary: 'Détail d\'un compte' })
  findGLAccountById(@Param('id', ParseUUIDPipe) id: string) {
    return this.accountingService.findGLAccountById(id);
  }

  @Patch('gl-accounts/:id')
  @Permissions(SystemPermissions.ACCOUNTING_CREATE)
  @ApiOperation({ summary: 'Modifier un compte' })
  updateGLAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGLAccountDto,
  ) {
    return this.accountingService.updateGLAccount(id, dto);
  }

  // ============================================
  // ÉCRITURES COMPTABLES
  // ============================================

  @Post('journal-entries')
  @Permissions(SystemPermissions.ACCOUNTING_CREATE)
  @ApiOperation({ 
    summary: 'Créer une écriture comptable',
    description: 'Enregistre une écriture comptable (doit être équilibrée)'
  })
  createJournalEntry(
    @Body() dto: CreateJournalEntryDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.accountingService.createJournalEntry(dto, userId);
  }

  @Get('journal-entries')
  @Permissions(SystemPermissions.ACCOUNTING_READ)
  @ApiOperation({ 
    summary: 'Liste des écritures',
    description: 'Récupère les écritures comptables avec filtres'
  })
  findAllJournalEntries(@Query() query: JournalEntryQueryDto) {
    return this.accountingService.findAllJournalEntries(query);
  }

  @Get('journal-entries/:id')
  @Permissions(SystemPermissions.ACCOUNTING_READ)
  @ApiOperation({ summary: 'Détail d\'une écriture' })
  findJournalEntryById(@Param('id', ParseUUIDPipe) id: string) {
    return this.accountingService.findJournalEntryById(id);
  }

  @Post('journal-entries/:id/reverse')
  @Permissions(SystemPermissions.ACCOUNTING_REVERSE)
  @ApiOperation({ 
    summary: 'Extourner une écriture',
    description: 'Crée une écriture d\'extourne inverse'
  })
  reverseJournalEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReverseJournalEntryDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.accountingService.reverseJournalEntry(id, dto, userId);
  }

  // ============================================
  // ÉTATS FINANCIERS
  // ============================================

  @Get('trial-balance')
  @Permissions(SystemPermissions.ACCOUNTING_READ)
  @ApiOperation({ 
    summary: 'Balance de vérification',
    description: 'Génère la balance de vérification à une date donnée'
  })
  @ApiQuery({ name: 'asOfDate', type: String, description: 'Date (YYYY-MM-DD)' })
  getTrialBalance(@Query('asOfDate') asOfDate: string) {
    return this.accountingService.getTrialBalance(new Date(asOfDate));
  }

  @Get('general-ledger/:accountId')
  @Permissions(SystemPermissions.ACCOUNTING_READ)
  @ApiOperation({ 
    summary: 'Grand livre',
    description: 'Détail des mouvements d\'un compte sur une période'
  })
  @ApiParam({ name: 'accountId', description: 'ID du compte' })
  @ApiQuery({ name: 'fromDate', type: String })
  @ApiQuery({ name: 'toDate', type: String })
  getGeneralLedger(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.accountingService.getGeneralLedger(
      accountId,
      new Date(fromDate),
      new Date(toDate),
    );
  }

  @Get('income-statement')
  @Permissions(SystemPermissions.ACCOUNTING_READ)
  @ApiOperation({ 
    summary: 'Compte de résultat',
    description: 'Génère le compte de résultat sur une période'
  })
  @ApiQuery({ name: 'fromDate', type: String })
  @ApiQuery({ name: 'toDate', type: String })
  getIncomeStatement(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.accountingService.getIncomeStatement(
      new Date(fromDate),
      new Date(toDate),
    );
  }

  @Post('close-period')
  @Permissions(SystemPermissions.ACCOUNTING_CLOSE_PERIOD)
  @ApiOperation({ 
    summary: 'Clôturer une période',
    description: 'Clôture comptable d\'une période (irréversible)'
  })
  closePeriod(
    @Body() dto: ClosePeriodDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.accountingService.closePeriod(dto, userId);
  }
}
