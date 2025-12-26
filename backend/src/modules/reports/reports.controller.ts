import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../iam/decorators/current-user.decorator';
import type { AuthUser } from '../iam/types/auth-user';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('kpis')
  async kpis(@CurrentUser() user: AuthUser) {
    return await this.reports.kpis(user.organizationId);
  }
}

