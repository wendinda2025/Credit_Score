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
import { SavingsService } from './savings.service';
import {
  CreateSavingsProductDto,
  CreateSavingsAccountDto,
  SavingsTransactionDto,
} from './dto/savings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('savings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('savings')
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  @Post('products')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Créer un produit d\'épargne' })
  async createSavingsProduct(@Body() createDto: CreateSavingsProductDto) {
    return this.savingsService.createSavingsProduct(createDto);
  }

  @Get('products')
  @ApiOperation({ summary: 'Liste des produits d\'épargne' })
  async findAllSavingsProducts(@CurrentUser() user: any) {
    return this.savingsService.findAllSavingsProducts(user.organizationId);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Créer un compte épargne' })
  async createAccount(
    @Body() createDto: CreateSavingsAccountDto,
    @CurrentUser() user: any,
  ) {
    return this.savingsService.createAccount(createDto, user.id);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Liste des comptes épargne' })
  async findAll(@CurrentUser() user: any, @Query() filters?: any) {
    return this.savingsService.findAll(user.organizationId, filters);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Détails d\'un compte épargne' })
  async findOne(@Param('id') id: string) {
    return this.savingsService.findOne(id);
  }

  @Post('accounts/:id/activate')
  @Roles('ADMIN', 'CASHIER')
  @ApiOperation({ summary: 'Activer un compte épargne' })
  async activateAccount(@Param('id') id: string, @CurrentUser() user: any) {
    return this.savingsService.activateAccount(id, user.id);
  }

  @Post('accounts/:id/transactions')
  @Roles('ADMIN', 'CASHIER')
  @ApiOperation({ summary: 'Effectuer une transaction (dépôt/retrait)' })
  async makeTransaction(
    @Param('id') id: string,
    @Body() transactionDto: SavingsTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.savingsService.makeTransaction(id, transactionDto, user.id);
  }

  @Post('accounts/:id/close')
  @Roles('ADMIN', 'CASHIER')
  @ApiOperation({ summary: 'Clôturer un compte épargne' })
  async closeAccount(@Param('id') id: string, @CurrentUser() user: any) {
    return this.savingsService.closeAccount(id, user.id);
  }
}
