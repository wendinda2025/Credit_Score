import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GenerateReportDto } from './dto/report.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Rapports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @Roles('ADMIN', 'MANAGER', 'AUDITOR')
  @ApiOperation({ summary: 'Générer un rapport' })
  generateReport(@Body() dto: GenerateReportDto, @Request() req) {
    return this.reportsService.generateReport(req.user.organizationId, dto);
  }

  @Get('dashboard')
  @Roles('ADMIN', 'MANAGER', 'LOAN_OFFICER', 'CASHIER')
  @ApiOperation({ summary: 'Tableau de bord général' })
  getDashboard(@Request() req) {
    return this.reportsService.getDashboard(req.user.organizationId);
  }
}
