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
} from '@nestjs/swagger';
import { LoansService } from './loans.service';
import {
  CreateLoanDto,
  CreateLoanProductDto,
  UpdateLoanProductDto,
  ApproveLoanDto,
  RejectLoanDto,
  DisburseLoanDto,
  LoanRepaymentDto,
  LoanQueryDto,
  CollateralDto,
  GuarantorDto,
} from './dto/loan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions, SystemPermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('loans')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  // ============================================
  // PRODUITS DE PRÊTS
  // ============================================

  @Post('products')
  @Permissions(SystemPermissions.LOAN_CREATE)
  @ApiOperation({
    summary: 'Créer un produit de prêt',
    description: 'Crée un nouveau produit de prêt paramétrable',
  })
  @ApiResponse({ status: 201, description: 'Produit créé' })
  createProduct(@Body() dto: CreateLoanProductDto) {
    return this.loansService.createProduct(dto);
  }

  @Get('products')
  @Permissions(SystemPermissions.LOAN_READ)
  @ApiOperation({
    summary: 'Liste des produits de prêts',
    description: 'Récupère tous les produits de prêts actifs',
  })
  findAllProducts() {
    return this.loansService.findAllProducts();
  }

  @Get('products/:id')
  @Permissions(SystemPermissions.LOAN_READ)
  @ApiOperation({
    summary: 'Détail d\'un produit',
    description: 'Récupère les détails d\'un produit de prêt',
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  findProductById(@Param('id', ParseUUIDPipe) id: string) {
    return this.loansService.findProductById(id);
  }

  @Patch('products/:id')
  @Permissions(SystemPermissions.LOAN_UPDATE)
  @ApiOperation({
    summary: 'Modifier un produit',
    description: 'Met à jour un produit de prêt',
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoanProductDto,
  ) {
    return this.loansService.updateProduct(id, dto);
  }

  // ============================================
  // PRÊTS
  // ============================================

  @Post()
  @Permissions(SystemPermissions.LOAN_CREATE)
  @ApiOperation({
    summary: 'Créer une demande de prêt',
    description: 'Soumet une nouvelle demande de prêt',
  })
  @ApiResponse({ status: 201, description: 'Demande créée' })
  create(
    @Body() dto: CreateLoanDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.loansService.create(dto, userId);
  }

  @Post('preview-schedule')
  @Permissions(SystemPermissions.LOAN_READ)
  @ApiOperation({
    summary: 'Prévisualiser le calendrier',
    description: 'Génère un calendrier de remboursement préliminaire',
  })
  previewSchedule(@Body() dto: CreateLoanDto) {
    return this.loansService.previewSchedule(dto);
  }

  @Get()
  @Permissions(SystemPermissions.LOAN_READ)
  @ApiOperation({
    summary: 'Liste des prêts',
    description: 'Récupère la liste paginée des prêts',
  })
  findAll(@Query() query: LoanQueryDto) {
    return this.loansService.findAll(query);
  }

  @Get(':id')
  @Permissions(SystemPermissions.LOAN_READ)
  @ApiOperation({
    summary: 'Détail d\'un prêt',
    description: 'Récupère tous les détails d\'un prêt',
  })
  @ApiParam({ name: 'id', description: 'ID du prêt' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.loansService.findOne(id);
  }

  @Post(':id/approve')
  @Permissions(SystemPermissions.LOAN_APPROVE)
  @ApiOperation({
    summary: 'Approuver un prêt',
    description: 'Approuve une demande de prêt',
  })
  @ApiParam({ name: 'id', description: 'ID du prêt' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveLoanDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.loansService.approve(id, dto, userId);
  }

  @Post(':id/reject')
  @Permissions(SystemPermissions.LOAN_REJECT)
  @ApiOperation({
    summary: 'Rejeter un prêt',
    description: 'Rejette une demande de prêt',
  })
  @ApiParam({ name: 'id', description: 'ID du prêt' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectLoanDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.loansService.reject(id, dto, userId);
  }

  @Post(':id/disburse')
  @Permissions(SystemPermissions.LOAN_DISBURSE)
  @ApiOperation({
    summary: 'Décaisser un prêt',
    description: 'Effectue le décaissement d\'un prêt approuvé',
  })
  @ApiParam({ name: 'id', description: 'ID du prêt' })
  disburse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DisburseLoanDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.loansService.disburse(id, dto, userId);
  }

  @Post(':id/repayment')
  @Permissions(SystemPermissions.LOAN_REPAY)
  @ApiOperation({
    summary: 'Enregistrer un remboursement',
    description: 'Enregistre un remboursement de prêt',
  })
  @ApiParam({ name: 'id', description: 'ID du prêt' })
  makeRepayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LoanRepaymentDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.loansService.makeRepayment(id, dto, userId);
  }

  @Post(':id/collaterals')
  @Permissions(SystemPermissions.LOAN_UPDATE)
  @ApiOperation({
    summary: 'Ajouter une garantie',
    description: 'Ajoute une garantie au prêt',
  })
  @ApiParam({ name: 'id', description: 'ID du prêt' })
  addCollateral(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CollateralDto,
  ) {
    return this.loansService.addCollateral(id, dto);
  }

  @Post(':id/guarantors')
  @Permissions(SystemPermissions.LOAN_UPDATE)
  @ApiOperation({
    summary: 'Ajouter un garant',
    description: 'Ajoute un garant au prêt',
  })
  @ApiParam({ name: 'id', description: 'ID du prêt' })
  addGuarantor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GuarantorDto,
  ) {
    return this.loansService.addGuarantor(id, dto);
  }
}
