import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles('ADMIN', 'AUDITOR')
  @ApiOperation({ summary: 'Journal d\'audit' })
  async findAll(@CurrentUser() user: any, @Query() filters?: any) {
    return this.auditService.findAll(user.organizationId, filters);
  }

  @Get('entity/:entityType/:entityId')
  @Roles('ADMIN', 'AUDITOR')
  @ApiOperation({ summary: 'Historique d\'une entité' })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(entityType, entityId);
  }
}
