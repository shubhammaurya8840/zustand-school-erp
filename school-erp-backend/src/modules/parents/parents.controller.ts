import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ParentsService } from './parents.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Parents')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT, Role.TEACHER)
  @ApiOperation({ summary: 'List parents directory with search and pagination' })
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.parentsService.findAll({ search, page, limit });
  }

  @Get('my-children')
  @Roles(Role.PARENT, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get linked children for logged-in Parent (or Admin portal preview)' })
  async getMyChildren(
    @CurrentUser() user: { id: string; role: Role },
    @Query('parentId') parentId?: string,
  ) {
    return this.parentsService.getMyChildren(user, parentId);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT, Role.TEACHER, Role.PARENT)
  @ApiOperation({ summary: 'Get parent profile by ID (Parents can view only own family)' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.parentsService.findOne(id, user);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Register parent and generate login account (Admin & Accountant)' })
  async create(
    @Body() dto: CreateParentDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.parentsService.create(dto, adminUserId);
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Update parent details (Admin & Accountant)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateParentDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.parentsService.update(id, dto, adminUserId);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete parent profile and login account if unlinked (Admin)' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.parentsService.delete(id, adminUserId);
  }
}

