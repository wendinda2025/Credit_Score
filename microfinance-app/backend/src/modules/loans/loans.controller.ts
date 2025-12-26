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
import { LoansService } from './loans.service';
import {
  CreateLoanDto,
  CreateLoanProductDto,
  ApproveLoanDto,
  MakeRepaymentDto,
} from './dto/loan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  // ========== PRODUITS DE PRÊTS ==========

  @Post('products')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Créer un produit de prêt' })
  async createLoanProduct(@Body() createDto: CreateLoanProductDto) {
    return this.loansService.createLoanProduct(createDto);
  }

  @Get('products')
  @ApiOperation({ summary: 'Liste des produits de prêts' })
  async findAllLoanProducts(@CurrentUser() user: any) {
    return this.loansService.findAllLoanProducts(user.organizationId);
  }

  // ========== PRÊTS ==========

  @Post()
  @ApiOperation({ summary: 'Créer une demande de prêt' })
  async create(@Body() createLoanDto: CreateLoanDto, @CurrentUser() user: any) {
    return this.loansService.create(createLoanDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des prêts' })
  async findAll(@CurrentUser() user: any, @Query() filters?: any) {
    return this.loansService.findAll(user.organizationId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un prêt' })
  async findOne(@Param('id') id: string) {
    return this.loansService.findOne(id);
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'CREDIT_OFFICER')
  @ApiOperation({ summary: 'Approuver un prêt' })
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveLoanDto,
    @CurrentUser() user: any,
  ) {
    return this.loansService.approve(id, approveDto, user.id);
  }

  @Post(':id/disburse')
  @Roles('ADMIN', 'CASHIER')
  @ApiOperation({ summary: 'Décaisser un prêt' })
  async disburse(@Param('id') id: string, @CurrentUser() user: any) {
    return this.loansService.disburse(id, user.id);
  }

  @Post(':id/repayments')
  @Roles('ADMIN', 'CASHIER')
  @ApiOperation({ summary: 'Enregistrer un remboursement' })
  async makeRepayment(
    @Param('id') id: string,
    @Body() repaymentDto: MakeRepaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.loansService.makeRepayment(id, repaymentDto, user.id);
  }
}
