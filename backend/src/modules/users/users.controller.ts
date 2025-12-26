import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../iam/decorators/current-user.decorator';
import { Roles } from '../iam/decorators/roles.decorator';
import type { AuthUser } from '../iam/types/auth-user';
import { CreateUserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles('Admin')
  @Get()
  async list(@CurrentUser() user: AuthUser) {
    return await this.users.list(user.organizationId);
  }

  @Roles('Admin')
  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return await this.users.create(user.organizationId, dto);
  }
}

