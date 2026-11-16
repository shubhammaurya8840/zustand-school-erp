import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users Administration')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'List all ERP system accounts (Admin only)' })
  async findAll(
    @Query('role') role?: Role,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.findAll({ role, search, page, limit });
  }

  @Put(':id/toggle-active')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Activate or deactivate a user account (Admin only)' })
  async toggleActive(
    @Param('id') id: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.usersService.toggleActive(id, adminUserId);
  }

  @Put(':id/reset-password')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Force reset a user password by Administrator' })
  async adminResetPassword(
    @Param('id') id: string,
    @Body('newPassword') newPass: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.usersService.adminResetPassword(id, newPass, adminUserId);
  }
}

