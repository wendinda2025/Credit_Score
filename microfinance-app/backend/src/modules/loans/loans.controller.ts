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
import { LoansService } from './services/loans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateLoanProductDto, CreateLoanApplicationDto, DisburseLoanDto, RepayLoanDto } from './dto/loan.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Prêts')
@ApiBearerAuth()
@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  // ============ PRODUITS DE PRÊT ============

  @Post('products')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Créer un produit de prêt' })
  createLoanProduct(@Body() dto: CreateLoanProductDto, @Request() req) {
    return this.loansService.createLoanProduct(dto, req.user.organizationId);
  }

  @Get('products')
  @Roles('ADMIN', 'MANAGER', 'LOAN_OFFICER', 'CASHIER')
  @ApiOperation({ summary: 'Lister les produits de prêt' })
  findAllLoanProducts(@Request() req) {
    return this.loansService.findAllLoanProducts(req.user.organizationId);
  }

  @Get('products/:id')
  @Roles('ADMIN', 'MANAGER', 'LOAN_OFFICER', 'CASHIER')
  @ApiOperation({ summary: 'Détails d\'un produit de prêt' })
  findOneLoanProduct(@Param('id') id: string, @Request() req) {
    return this.loansService.findOneLoanProduct(id, req.user.organizationId);
  }

  @Put('products/:id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Modifier un produit de prêt' })
  updateLoanProduct(@Param('id') id: string, @Body() dto: Partial<CreateLoanProductDto>, @Request() req) {
    return this.loansService.updateLoanProduct(id, dto, req.user.organizationId);
  }

  @Delete('products/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Supprimer un produit de prêt' })
  deleteLoanProduct(@Param('id') id: string, @Request() req) {
    return this.loansService.deleteLoanProduct(id, req.user.organizationId);
  }

  // ============ DEMANDES DE PRÊT ============

  @Post('applications')
  @Roles('ADMIN', 'MANAGER', 'LOAN_OFFICER')
  @ApiOperation({ summary: 'Créer une demande de prêt' })
  createLoanApplication(@Body() dto: CreateLoanApplicationDto, @Request() req) {
    return this.loansService.createLoanApplication(dto, req.user.organizationId, req.user.sub);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'LOAN_OFFICER', 'CASHIER', 'AUDITOR')
  @ApiOperation({ summary: 'Lister les prêts' })
  findAllLoans(@Query() filters: any, @Request() req) {
    return this.loansService.findAllLoans(req.user.organizationId, filters);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'LOAN_OFFICER', 'CASHIER', 'AUDITOR')
  @ApiOperation({ summary: 'Détails d\'un prêt' })
  findOneLoan(@Param('id') id: string, @Request() req) {
    return this.loansService.findOneLoan(id, req.user.organizationId);
  }

  // ============ APPROBATION ============

  @Post(':id/approve')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Approuver un prêt' })
  approveLoan(
    @Param('id') id: string,
    @Body() body: { approvedDate: Date },
    @Request() req,
  ) {
    return this.loansService.approveLoan(
      id,
      req.user.organizationId,
      req.user.sub,
      body.approvedDate || new Date(),
    );
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Rejeter un prêt' })
  rejectLoan(
    @Param('id') id: string,
    @Body() body: { rejectionReason: string },
    @Request() req,
  ) {
    return this.loansService.rejectLoan(id, req.user.organizationId, req.user.sub, body.rejectionReason);
  }

  // ============ DÉCAISSEMENT ============

  @Post(':id/disburse')
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Décaisser un prêt' })
  disburseLoan(@Param('id') id: string, @Body() dto: DisburseLoanDto, @Request() req) {
    return this.loansService.disburseLoan(id, dto, req.user.organizationId, req.user.sub);
  }

  // ============ REMBOURSEMENT ============

  @Post(':id/repay')
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Enregistrer un remboursement' })
  repayLoan(@Param('id') id: string, @Body() dto: RepayLoanDto, @Request() req) {
    return this.loansService.repayLoan(id, dto, req.user.organizationId, req.user.sub);
  }

  // ============ RÉÉCHELONNEMENT ============

  @Post(':id/reschedule')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Rééchelonner un prêt' })
  rescheduleLoan(
    @Param('id') id: string,
    @Body() body: { newInstallments: number; newInterestRate: number },
    @Request() req,
  ) {
    return this.loansService.rescheduleLoan(
      id,
      body.newInstallments,
      body.newInterestRate,
      req.user.organizationId,
      req.user.sub,
    );
  }

  // ============ PÉNALITÉS ============

  @Post('penalties/calculate')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Calculer et appliquer les pénalités de retard' })
  calculatePenalties(@Request() req) {
    return this.loansService.calculateAndApplyPenalties(req.user.organizationId);
  }

  // ============ STATISTIQUES ============

  @Get('statistics/overview')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Statistiques sur les prêts' })
  getLoanStatistics(@Request() req) {
    return this.loansService.getLoanStatistics(req.user.organizationId);
  }
}
