import { Controller, Get, Post, Patch, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, SystemRoles } from '../../common/decorators/roles.decorator';

@ApiTags('organizations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'Informations de l\'organisation' })
  getOrganization() {
    return this.organizationsService.getOrganization();
  }

  @Patch(':id')
  @Roles(SystemRoles.ADMIN)
  @ApiOperation({ summary: 'Modifier l\'organisation' })
  updateOrganization(@Param('id', ParseUUIDPipe) id: string, @Body() data: any) {
    return this.organizationsService.updateOrganization(id, data);
  }

  @Get('branches')
  @ApiOperation({ summary: 'Liste des agences' })
  findAllBranches() {
    return this.organizationsService.findAllBranches();
  }

  @Post('branches')
  @Roles(SystemRoles.ADMIN)
  @ApiOperation({ summary: 'Créer une agence' })
  createBranch(@Body() data: any) {
    return this.organizationsService.createBranch(data);
  }

  @Get('branches/:id')
  @ApiOperation({ summary: 'Détail d\'une agence' })
  findBranchById(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findBranchById(id);
  }

  @Patch('branches/:id')
  @Roles(SystemRoles.ADMIN)
  @ApiOperation({ summary: 'Modifier une agence' })
  updateBranch(@Param('id', ParseUUIDPipe) id: string, @Body() data: any) {
    return this.organizationsService.updateBranch(id, data);
  }

  @Get('payment-types')
  @ApiOperation({ summary: 'Types de paiement' })
  getPaymentTypes() {
    return this.organizationsService.getPaymentTypes();
  }

  @Post('payment-types')
  @Roles(SystemRoles.ADMIN)
  @ApiOperation({ summary: 'Créer un type de paiement' })
  createPaymentType(@Body() data: any) {
    return this.organizationsService.createPaymentType(data);
  }

  @Get('currencies')
  @ApiOperation({ summary: 'Devises supportées' })
  getCurrencies() {
    return this.organizationsService.getCurrencies();
  }
}
