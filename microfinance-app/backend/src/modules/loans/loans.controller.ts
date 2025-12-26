import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { LoansService } from './services/loans.service';
import { CreateLoanProductDto, CreateLoanApplicationDto, RepayLoanDto } from './dto/loan.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post('products')
  @Roles(Role.ADMIN)
  createProduct(@Body() dto: CreateLoanProductDto) {
    return this.loansService.createProduct(dto);
  }

  @Get('products')
  getProducts() {
    return this.loansService.getProducts();
  }

  @Post('apply')
  @Roles(Role.LOAN_OFFICER, Role.ADMIN)
  apply(@Request() req, @Body() dto: CreateLoanApplicationDto) {
    return this.loansService.createApplication(req.user.userId, dto);
  }

  @Get(':id')
  getLoan(@Param('id') id: string) {
    return this.loansService.getLoan(id);
  }

  @Put(':id/approve')
  @Roles(Role.ADMIN, Role.LOAN_OFFICER) // Depending on policy
  approve(@Request() req, @Param('id') id: string) {
    return this.loansService.approveLoan(id, req.user.userId);
  }

  @Put(':id/disburse')
  @Roles(Role.CASHIER, Role.ADMIN)
  disburse(@Request() req, @Param('id') id: string) {
    return this.loansService.disburseLoan(id, req.user.userId);
  }

  @Post(':id/repay')
  @Roles(Role.CASHIER, Role.ADMIN)
  repay(@Request() req, @Param('id') id: string, @Body() dto: RepayLoanDto) {
    return this.loansService.repayLoan(id, dto, req.user.userId);
  }
}
