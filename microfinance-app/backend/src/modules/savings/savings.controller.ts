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
import { SavingsService } from './savings.service';
import {
  CreateSavingsProductDto,
  UpdateSavingsProductDto,
  CreateSavingsAccountDto,
  DepositDto,
  WithdrawDto,
  HoldAmountDto,
  SavingsQueryDto,
} from './dto/savings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions, SystemPermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('savings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('savings')
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  // Produits
  @Post('products')
  @Permissions(SystemPermissions.SAVINGS_CREATE)
  @ApiOperation({ summary: 'Créer un produit d\'épargne' })
  createProduct(@Body() dto: CreateSavingsProductDto) {
    return this.savingsService.createProduct(dto);
  }

  @Get('products')
  @Permissions(SystemPermissions.SAVINGS_READ)
  @ApiOperation({ summary: 'Liste des produits d\'épargne' })
  findAllProducts() {
    return this.savingsService.findAllProducts();
  }

  @Get('products/:id')
  @Permissions(SystemPermissions.SAVINGS_READ)
  @ApiOperation({ summary: 'Détail d\'un produit d\'épargne' })
  findProductById(@Param('id', ParseUUIDPipe) id: string) {
    return this.savingsService.findProductById(id);
  }

  @Patch('products/:id')
  @Permissions(SystemPermissions.SAVINGS_UPDATE)
  @ApiOperation({ summary: 'Modifier un produit d\'épargne' })
  updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSavingsProductDto,
  ) {
    return this.savingsService.updateProduct(id, dto);
  }

  // Comptes
  @Post('accounts')
  @Permissions(SystemPermissions.SAVINGS_CREATE)
  @ApiOperation({ summary: 'Créer un compte d\'épargne' })
  createAccount(
    @Body() dto: CreateSavingsAccountDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.savingsService.createAccount(dto, userId);
  }

  @Get('accounts')
  @Permissions(SystemPermissions.SAVINGS_READ)
  @ApiOperation({ summary: 'Liste des comptes d\'épargne' })
  findAll(@Query() query: SavingsQueryDto) {
    return this.savingsService.findAll(query);
  }

  @Get('accounts/:id')
  @Permissions(SystemPermissions.SAVINGS_READ)
  @ApiOperation({ summary: 'Détail d\'un compte d\'épargne' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.savingsService.findOne(id);
  }

  @Post('accounts/:id/activate')
  @Permissions(SystemPermissions.SAVINGS_ACTIVATE)
  @ApiOperation({ summary: 'Activer un compte d\'épargne' })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.savingsService.activate(id, userId);
  }

  @Post('accounts/:id/deposit')
  @Permissions(SystemPermissions.SAVINGS_DEPOSIT)
  @ApiOperation({ summary: 'Effectuer un dépôt' })
  deposit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DepositDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.savingsService.deposit(id, dto, userId);
  }

  @Post('accounts/:id/withdraw')
  @Permissions(SystemPermissions.SAVINGS_WITHDRAW)
  @ApiOperation({ summary: 'Effectuer un retrait' })
  withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WithdrawDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.savingsService.withdraw(id, dto, userId);
  }

  @Post('accounts/:id/hold')
  @Permissions(SystemPermissions.SAVINGS_UPDATE)
  @ApiOperation({ summary: 'Bloquer un montant' })
  holdAmount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HoldAmountDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.savingsService.holdAmount(id, dto, userId);
  }

  @Post('accounts/:id/hold/:holdId/release')
  @Permissions(SystemPermissions.SAVINGS_UPDATE)
  @ApiOperation({ summary: 'Libérer un blocage' })
  releaseHold(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('holdId', ParseUUIDPipe) holdId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.savingsService.releaseHold(id, holdId, userId);
  }

  @Post('accounts/:id/close')
  @Permissions(SystemPermissions.SAVINGS_CLOSE)
  @ApiOperation({ summary: 'Clôturer un compte' })
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.savingsService.close(id, userId);
  }
}
