import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Institutional Reports & Live Dashboard Metrics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('admin-dashboard')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Real-time database aggregated metrics for School Admin dashboard' })
  async getAdminDashboard() {
    return this.reportsService.getAdminDashboardMetrics();
  }

  @Get('accountant-dashboard')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Real-time financial collection, pending dues and receipts for Accountant' })
  async getAccountantDashboard() {
    return this.reportsService.getAccountantDashboardMetrics();
  }

  @Get('library-dashboard')
  @Roles(Role.SCHOOL_ADMIN, Role.LIBRARIAN)
  @ApiOperation({ summary: 'Real-time catalog strength, active loans and overdue metrics for Librarian' })
  async getLibraryDashboard() {
    return this.reportsService.getLibraryMetrics();
  }
}

