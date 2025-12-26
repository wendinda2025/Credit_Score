import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditLogQueryDto } from './dto/audit.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles('ADMIN', 'AUDITOR')
  @ApiOperation({ summary: 'Récupérer les logs d\'audit' })
  findAll(
    @Query() query: AuditLogQueryDto,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req,
  ) {
    return this.auditService.findAll(
      req.user.organizationId,
      query,
      parseInt(page) || 1,
      parseInt(limit) || 50,
    );
  }

  @Get('entity/:entityType/:entityId')
  @Roles('ADMIN', 'AUDITOR', 'MANAGER')
  @ApiOperation({ summary: 'Historique d\'une entité' })
  getEntityHistory(@Param('entityType') entityType: string, @Param('entityId') entityId: string, @Request() req) {
    return this.auditService.getEntityHistory(req.user.organizationId, entityType, entityId);
  }

  @Get('statistics')
  @Roles('ADMIN', 'AUDITOR')
  @ApiOperation({ summary: 'Statistiques d\'audit' })
  getStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
  ) {
    return this.auditService.getStatistics(
      req.user.organizationId,
      new Date(startDate),
      new Date(endDate || Date.now()),
    );
  }
}
