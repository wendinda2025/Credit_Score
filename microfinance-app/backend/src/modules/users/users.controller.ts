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
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, AssignRolesDto } from './dto/user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, SystemRoles } from '../../common/decorators/roles.decorator';
import { Permissions, SystemPermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions(SystemPermissions.USER_CREATE)
  @ApiOperation({ 
    summary: 'Créer un utilisateur',
    description: 'Crée un nouvel utilisateur avec ses rôles'
  })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Permissions(SystemPermissions.USER_READ)
  @ApiOperation({ 
    summary: 'Liste des utilisateurs',
    description: 'Récupère la liste paginée des utilisateurs'
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('roles')
  @Permissions(SystemPermissions.USER_READ)
  @ApiOperation({ 
    summary: 'Liste des rôles',
    description: 'Récupère tous les rôles disponibles'
  })
  @ApiResponse({ status: 200, description: 'Liste des rôles' })
  findAllRoles() {
    return this.usersService.findAllRoles();
  }

  @Get(':id')
  @Permissions(SystemPermissions.USER_READ)
  @ApiOperation({ 
    summary: 'Détail d\'un utilisateur',
    description: 'Récupère les détails d\'un utilisateur par son ID'
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Détails de l\'utilisateur' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Permissions(SystemPermissions.USER_UPDATE)
  @ApiOperation({ 
    summary: 'Modifier un utilisateur',
    description: 'Met à jour les informations d\'un utilisateur'
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/roles')
  @Roles(SystemRoles.ADMIN, SystemRoles.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Assigner des rôles',
    description: 'Assigne des rôles à un utilisateur'
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Rôles assignés' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  assignRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    return this.usersService.assignRoles(id, assignRolesDto);
  }

  @Patch(':id/activate')
  @Roles(SystemRoles.ADMIN, SystemRoles.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Activer un utilisateur',
    description: 'Active le compte d\'un utilisateur'
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur activé' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.toggleStatus(id, true);
  }

  @Patch(':id/deactivate')
  @Roles(SystemRoles.ADMIN, SystemRoles.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Désactiver un utilisateur',
    description: 'Désactive le compte d\'un utilisateur'
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur désactivé' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.toggleStatus(id, false);
  }

  @Delete(':id')
  @Roles(SystemRoles.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Supprimer un utilisateur',
    description: 'Supprime définitivement un utilisateur'
  })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
