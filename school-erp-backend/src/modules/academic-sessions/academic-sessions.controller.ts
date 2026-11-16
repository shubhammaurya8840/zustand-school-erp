import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AcademicSessionsService } from './academic-sessions.service';
import { CreateAcademicSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Academic Sessions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic-sessions')
export class AcademicSessionsController {
  constructor(private readonly sessionsService: AcademicSessionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all academic sessions' })
  async findAll() {
    return this.sessionsService.findAll();
  }

  @Get('current')
  @ApiOperation({ summary: 'Get active academic session' })
  async getCurrent() {
    return this.sessionsService.getCurrent();
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create new academic session (Admin only)' })
  async create(@Body() dto: CreateAcademicSessionDto) {
    return this.sessionsService.create(dto);
  }

  @Put(':id/set-current')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Set active academic session (Admin only)' })
  async setCurrent(@Param('id') id: string) {
    return this.sessionsService.setCurrent(id);
  }

  @Post('promote')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Batch promote students across sessions (Admin only)' })
  async promoteStudents(
    @Body()
    body: {
      fromSessionId: string;
      toSessionId: string;
      fromClassId: string;
      toClassId: string;
      fromSectionId: string;
      toSectionId: string;
    },
  ) {
    return this.sessionsService.promoteStudents(body);
  }
}

