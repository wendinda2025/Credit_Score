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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import {
  CreateClientDto,
  UpdateClientDto,
  AddGroupMemberDto,
} from './dto/client.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un client' })
  async create(
    @Body() createClientDto: CreateClientDto,
    @CurrentUser() user: any,
  ) {
    return this.clientsService.create(createClientDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des clients' })
  async findAll(@CurrentUser() user: any, @Query() filters?: any) {
    return this.clientsService.findAll(user.organizationId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un client' })
  async findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un client' })
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @CurrentUser() user: any,
  ) {
    return this.clientsService.update(id, updateClientDto, user.id);
  }

  @Post(':id/group-members')
  @ApiOperation({ summary: 'Ajouter un membre à un groupe' })
  async addGroupMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddGroupMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.clientsService.addGroupMember(id, addMemberDto, user.id);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Clôturer un client' })
  async closeClient(@Param('id') id: string, @CurrentUser() user: any) {
    return this.clientsService.closeClient(id, user.id);
  }
}
