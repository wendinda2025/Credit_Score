import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  CreateOfficeDto,
} from './dto/organization.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Créer une organisation' })
  async create(@Body() createDto: CreateOrganizationDto) {
    return this.organizationsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des organisations' })
  async findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'une organisation' })
  async findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/offices')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un bureau' })
  async createOffice(
    @Param('id') id: string,
    @Body() createDto: CreateOfficeDto,
  ) {
    return this.organizationsService.createOffice(id, createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/offices')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des bureaux d\'une organisation' })
  async findAllOffices(@Param('id') id: string) {
    return this.organizationsService.findAllOffices(id);
  }
}
