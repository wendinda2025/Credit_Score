import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Tableau de bord principal' })
  async getDashboard(@CurrentUser() user: any) {
    return this.reportsService.getDashboard(user.organizationId);
  }

  @Get('par')
  @ApiOperation({ summary: 'Portfolio at Risk (PAR)' })
  async getPAR(
    @CurrentUser() user: any,
    @Query('daysPastDue') daysPastDue?: string,
  ) {
    return this.reportsService.calculatePAR(
      user.organizationId,
      daysPastDue ? parseInt(daysPastDue) : 30,
    );
  }

  @Get('repayment-rate')
  @ApiOperation({ summary: 'Taux de remboursement' })
  async getRepaymentRate(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.calculateRepaymentRate(
      user.organizationId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
