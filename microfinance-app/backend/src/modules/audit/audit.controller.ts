import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService, AuditQueryDto } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions, SystemPermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('audit')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions(SystemPermissions.AUDIT_VIEW)
  @ApiOperation({ summary: 'Journal d\'audit' })
  findAll(@Query() query: AuditQueryDto) {
    return this.auditService.findAll(query);
  }

  @Get('entity/:entityType/:entityId')
  @Permissions(SystemPermissions.AUDIT_VIEW)
  @ApiOperation({ summary: 'Audit d\'une entité' })
  findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(entityType, entityId);
  }

  @Get('summary')
  @Permissions(SystemPermissions.AUDIT_VIEW)
  @ApiOperation({ summary: 'Résumé des actions' })
  @ApiQuery({ name: 'fromDate', type: String })
  @ApiQuery({ name: 'toDate', type: String })
  getActionSummary(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.auditService.getActionSummary(new Date(fromDate), new Date(toDate));
  }
}
