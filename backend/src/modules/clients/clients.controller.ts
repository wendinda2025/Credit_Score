import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../iam/decorators/current-user.decorator';
import { Roles } from '../iam/decorators/roles.decorator';
import type { AuthUser } from '../iam/types/auth-user';
import {
  AddKycDocumentDto,
  CreateBusinessClientDto,
  CreateGroupClientDto,
  CreateIndividualClientDto,
  UpdateClientStatusDto,
} from './dto/client.dto';
import { ClientsService } from './clients.service';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Roles('Admin', 'AgentCredit')
  @Post('individual')
  async createIndividual(@CurrentUser() user: AuthUser, @Body() dto: CreateIndividualClientDto) {
    return await this.clients.createIndividual(user.organizationId, dto);
  }

  @Roles('Admin', 'AgentCredit')
  @Post('group')
  async createGroup(@CurrentUser() user: AuthUser, @Body() dto: CreateGroupClientDto) {
    return await this.clients.createGroup(user.organizationId, dto);
  }

  @Roles('Admin', 'AgentCredit')
  @Post('business')
  async createBusiness(@CurrentUser() user: AuthUser, @Body() dto: CreateBusinessClientDto) {
    return await this.clients.createBusiness(user.organizationId, dto);
  }

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    return await this.clients.list(user.organizationId);
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return await this.clients.get(user.organizationId, id);
  }

  @Roles('Admin', 'AgentCredit')
  @Patch(':id/status')
  async setStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateClientStatusDto) {
    return await this.clients.setStatus(user.organizationId, id, dto.status);
  }

  @Roles('Admin', 'AgentCredit')
  @Post(':id/kyc')
  async addKyc(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AddKycDocumentDto) {
    return await this.clients.addKycDocument(user.organizationId, id, dto);
  }
}

