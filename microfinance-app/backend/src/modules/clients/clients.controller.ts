import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { ClientsService } from './clients.service';
import {
  CreateClientDto,
  UpdateClientDto,
  ClientQueryDto,
  ChangeClientStatusDto,
  AddGroupMemberDto,
  FamilyMemberDto,
} from './dto/client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions, SystemPermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('clients')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Permissions(SystemPermissions.CLIENT_CREATE)
  @ApiOperation({
    summary: 'Créer un client',
    description: 'Crée un nouveau client (individu, groupe ou entreprise)',
  })
  @ApiResponse({ status: 201, description: 'Client créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  create(
    @Body() createClientDto: CreateClientDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.clientsService.create(createClientDto, userId);
  }

  @Get()
  @Permissions(SystemPermissions.CLIENT_READ)
  @ApiOperation({
    summary: 'Liste des clients',
    description: 'Récupère la liste paginée des clients avec filtres',
  })
  @ApiResponse({ status: 200, description: 'Liste des clients' })
  findAll(@Query() query: ClientQueryDto) {
    return this.clientsService.findAll(query);
  }

  @Get('search/:accountNumber')
  @Permissions(SystemPermissions.CLIENT_READ)
  @ApiOperation({
    summary: 'Rechercher par numéro de compte',
    description: 'Recherche un client par son numéro de compte',
  })
  @ApiParam({ name: 'accountNumber', description: 'Numéro de compte' })
  @ApiResponse({ status: 200, description: 'Client trouvé' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  findByAccountNumber(@Param('accountNumber') accountNumber: string) {
    return this.clientsService.findByAccountNumber(accountNumber);
  }

  @Get(':id')
  @Permissions(SystemPermissions.CLIENT_READ)
  @ApiOperation({
    summary: 'Détail d\'un client',
    description: 'Récupère les détails complets d\'un client',
  })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Détails du client' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @Permissions(SystemPermissions.CLIENT_UPDATE)
  @ApiOperation({
    summary: 'Modifier un client',
    description: 'Met à jour les informations d\'un client',
  })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Client mis à jour' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Patch(':id/status')
  @Permissions(SystemPermissions.CLIENT_ACTIVATE)
  @ApiOperation({
    summary: 'Changer le statut',
    description: 'Active, suspend ou clôture un client',
  })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  @ApiResponse({ status: 400, description: 'Transition invalide' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeStatusDto: ChangeClientStatusDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.clientsService.changeStatus(id, changeStatusDto, userId);
  }

  @Post(':id/group-members')
  @Permissions(SystemPermissions.CLIENT_UPDATE)
  @ApiOperation({
    summary: 'Ajouter un membre au groupe',
    description: 'Ajoute un client individu à un groupe solidaire',
  })
  @ApiParam({ name: 'id', description: 'ID du groupe' })
  @ApiResponse({ status: 201, description: 'Membre ajouté' })
  @ApiResponse({ status: 400, description: 'Opération invalide' })
  addGroupMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addMemberDto: AddGroupMemberDto,
  ) {
    return this.clientsService.addGroupMember(id, addMemberDto);
  }

  @Delete(':id/group-members/:clientId')
  @Permissions(SystemPermissions.CLIENT_UPDATE)
  @ApiOperation({
    summary: 'Retirer un membre du groupe',
    description: 'Retire un client individu d\'un groupe solidaire',
  })
  @ApiParam({ name: 'id', description: 'ID du groupe' })
  @ApiParam({ name: 'clientId', description: 'ID du membre à retirer' })
  @ApiResponse({ status: 200, description: 'Membre retiré' })
  removeGroupMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ) {
    return this.clientsService.removeGroupMember(id, clientId);
  }

  @Post(':id/family-members')
  @Permissions(SystemPermissions.CLIENT_UPDATE)
  @ApiOperation({
    summary: 'Ajouter un membre de famille',
    description: 'Ajoute un membre de famille à un client',
  })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 201, description: 'Membre ajouté' })
  addFamilyMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() familyMemberDto: FamilyMemberDto,
  ) {
    return this.clientsService.addFamilyMember(id, familyMemberDto);
  }

  @Delete(':id/family-members/:familyMemberId')
  @Permissions(SystemPermissions.CLIENT_UPDATE)
  @ApiOperation({
    summary: 'Supprimer un membre de famille',
    description: 'Supprime un membre de famille d\'un client',
  })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiParam({ name: 'familyMemberId', description: 'ID du membre de famille' })
  @ApiResponse({ status: 200, description: 'Membre supprimé' })
  removeFamilyMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('familyMemberId', ParseUUIDPipe) familyMemberId: string,
  ) {
    return this.clientsService.removeFamilyMember(id, familyMemberId);
  }

  @Delete(':id')
  @Permissions(SystemPermissions.CLIENT_DELETE)
  @ApiOperation({
    summary: 'Supprimer un client',
    description: 'Supprime un client (seulement si aucun prêt/compte actif)',
  })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Client supprimé' })
  @ApiResponse({ status: 400, description: 'Client avec produits actifs' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.remove(id);
  }
}
