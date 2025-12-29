import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions, SystemPermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Permissions(SystemPermissions.REPORT_VIEW)
  @ApiOperation({
    summary: 'Tableau de bord',
    description: 'Métriques clés pour le tableau de bord',
  })
  @ApiQuery({ name: 'branchId', required: false })
  getDashboard(@Query('branchId') branchId?: string) {
    return this.reportsService.getDashboardMetrics(branchId);
  }

  @Get('par')
  @Permissions(SystemPermissions.REPORT_VIEW)
  @ApiOperation({
    summary: 'Rapport PAR',
    description: 'Portfolio At Risk - Prêts en retard',
  })
  @ApiQuery({ name: 'asOfDate', type: String })
  @ApiQuery({ name: 'branchId', required: false })
  getPARReport(
    @Query('asOfDate') asOfDate: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getPARReport(new Date(asOfDate), branchId);
  }

  @Get('loan-production')
  @Permissions(SystemPermissions.REPORT_VIEW)
  @ApiOperation({
    summary: 'Production de prêts',
    description: 'Rapport des décaissements par période',
  })
  @ApiQuery({ name: 'fromDate', type: String })
  @ApiQuery({ name: 'toDate', type: String })
  @ApiQuery({ name: 'branchId', required: false })
  getLoanProduction(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getLoanProductionReport(
      new Date(fromDate),
      new Date(toDate),
      branchId,
    );
  }

  @Get('collections')
  @Permissions(SystemPermissions.REPORT_VIEW)
  @ApiOperation({
    summary: 'Collections',
    description: 'Rapport des remboursements collectés',
  })
  @ApiQuery({ name: 'fromDate', type: String })
  @ApiQuery({ name: 'toDate', type: String })
  @ApiQuery({ name: 'branchId', required: false })
  getCollections(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getCollectionsReport(
      new Date(fromDate),
      new Date(toDate),
      branchId,
    );
  }
}
