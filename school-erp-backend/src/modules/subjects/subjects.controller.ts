import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, AssignSubjectToClassDto } from './dto/create-subject.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Subjects')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List all subjects and their class assignments' })
  async findAll() {
    return this.subjectsService.findAll();
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create new subject (Admin only)' })
  async create(@Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(dto);
  }

  @Post('assign-class')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Assign subject to a class and set teacher (Admin only)' })
  async assignToClass(@Body() dto: AssignSubjectToClassDto) {
    return this.subjectsService.assignToClass(dto);
  }
}

