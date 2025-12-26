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
import { SavingsService } from './savings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateSavingsProductDto,
  CreateSavingsAccountDto,
  DepositDto,
  WithdrawalDto,
  InterestCalculationDto,
} from './dto/savings.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Épargne')
@ApiBearerAuth()
@Controller('savings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  // ============ PRODUITS D'ÉPARGNE ============

  @Post('products')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Créer un produit d\'épargne' })
  createSavingsProduct(@Body() dto: CreateSavingsProductDto, @Request() req) {
    return this.savingsService.createSavingsProduct(dto, req.user.organizationId);
  }

  @Get('products')
  @Roles('ADMIN', 'MANAGER', 'LOAN_OFFICER', 'CASHIER')
  @ApiOperation({ summary: 'Lister les produits d\'épargne' })
  findAllSavingsProducts(@Request() req) {
    return this.savingsService.findAllSavingsProducts(req.user.organizationId);
  }

  @Get('products/:id')
  @Roles('ADMIN', 'MANAGER', 'LOAN_OFFICER', 'CASHIER')
  @ApiOperation({ summary: 'Détails d\'un produit d\'épargne' })
  findOneSavingsProduct(@Param('id') id: string, @Request() req) {
    return this.savingsService.findOneSavingsProduct(id, req.user.organizationId);
  }

  @Put('products/:id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Modifier un produit d\'épargne' })
  updateSavingsProduct(@Param('id') id: string, @Body() dto: Partial<CreateSavingsProductDto>, @Request() req) {
    return this.savingsService.updateSavingsProduct(id, dto, req.user.organizationId);
  }

  @Delete('products/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Supprimer un produit d\'épargne' })
  deleteSavingsProduct(@Param('id') id: string, @Request() req) {
    return this.savingsService.deleteSavingsProduct(id, req.user.organizationId);
  }

  // ============ COMPTES D'ÉPARGNE ============

  @Post('accounts')
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Créer un compte d\'épargne' })
  createSavingsAccount(@Body() dto: CreateSavingsAccountDto, @Request() req) {
    return this.savingsService.createSavingsAccount(dto, req.user.organizationId, req.user.sub);
  }

  @Get('accounts')
  @Roles('ADMIN', 'MANAGER', 'LOAN_OFFICER', 'CASHIER', 'AUDITOR')
  @ApiOperation({ summary: 'Lister les comptes d\'épargne' })
  findAllSavingsAccounts(@Query() filters: any, @Request() req) {
    return this.savingsService.findAllSavingsAccounts(req.user.organizationId, filters);
  }

  @Get('accounts/:id')
  @Roles('ADMIN', 'MANAGER', 'LOAN_OFFICER', 'CASHIER', 'AUDITOR')
  @ApiOperation({ summary: 'Détails d\'un compte d\'épargne' })
  findOneSavingsAccount(@Param('id') id: string, @Request() req) {
    return this.savingsService.findOneSavingsAccount(id, req.user.organizationId);
  }

  // ============ ACTIVATION / CLÔTURE ============

  @Post('accounts/:id/activate')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Activer un compte d\'épargne' })
  activateSavingsAccount(
    @Param('id') id: string,
    @Body() body: { activationDate: Date },
    @Request() req,
  ) {
    return this.savingsService.activateSavingsAccount(
      id,
      req.user.organizationId,
      req.user.sub,
      body.activationDate || new Date(),
    );
  }

  @Post('accounts/:id/close')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Clôturer un compte d\'épargne' })
  closeSavingsAccount(
    @Param('id') id: string,
    @Body() body: { closureReason: string },
    @Request() req,
  ) {
    return this.savingsService.closeSavingsAccount(id, req.user.organizationId, req.user.sub, body.closureReason);
  }

  // ============ DÉPÔTS / RETRAITS ============

  @Post('accounts/:id/deposit')
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Effectuer un dépôt' })
  deposit(@Param('id') id: string, @Body() dto: DepositDto, @Request() req) {
    return this.savingsService.deposit(id, dto, req.user.organizationId, req.user.sub);
  }

  @Post('accounts/:id/withdraw')
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Effectuer un retrait' })
  withdraw(@Param('id') id: string, @Body() dto: WithdrawalDto, @Request() req) {
    return this.savingsService.withdraw(id, dto, req.user.organizationId, req.user.sub);
  }

  // ============ BLOCAGE / DÉBLOCAGE ============

  @Post('accounts/:id/block')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Bloquer un compte' })
  blockAccount(
    @Param('id') id: string,
    @Body() body: { blockReason: string },
    @Request() req,
  ) {
    return this.savingsService.blockAccount(id, req.user.organizationId, req.user.sub, body.blockReason);
  }

  @Post('accounts/:id/unblock')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Débloquer un compte' })
  unblockAccount(@Param('id') id: string, @Request() req) {
    return this.savingsService.unblockAccount(id, req.user.organizationId, req.user.sub);
  }

  // ============ INTÉRÊTS & FRAIS ============

  @Post('interest/calculate-and-post')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Calculer et affecter les intérêts' })
  calculateAndPostInterest(@Body() dto: InterestCalculationDto, @Request() req) {
    return this.savingsService.calculateAndPostInterest(req.user.organizationId, dto);
  }

  @Post('fees/apply-monthly-maintenance')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Appliquer les frais mensuels' })
  applyMonthlyMaintenanceFees(@Body() body: { feeDate: Date }, @Request() req) {
    return this.savingsService.applyMonthlyMaintenanceFees(req.user.organizationId, body.feeDate || new Date());
  }

  // ============ STATISTIQUES ============

  @Get('statistics/overview')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Statistiques sur l\'épargne' })
  getSavingsStatistics(@Request() req) {
    return this.savingsService.getSavingsStatistics(req.user.organizationId);
  }
}
