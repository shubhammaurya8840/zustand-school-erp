import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notices & Announcements')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Get()
  @ApiOperation({ summary: 'List notices filtered by target audience for current role' })
  async findAll(
    @CurrentUser('role') userRole: Role,
    @Query('category') category?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.noticesService.findAll({ userRole, category, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notice details and mark read for current user' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.noticesService.findOne(id, userId);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Publish notice with target audience & category' })
  async create(
    @Body() dto: CreateNoticeDto,
    @CurrentUser('id') publisherUserId: string,
  ) {
    return this.noticesService.create(dto, publisherUserId);
  }

  @Put(':id/archive')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Archive notice from public view (Admin only)' })
  async archive(
    @Param('id') id: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.noticesService.archive(id, adminUserId);
  }
}

