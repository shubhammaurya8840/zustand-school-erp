import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto, CreateSectionDto } from './dto/create-class.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Classes & Sections')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: 'List all school classes and their sections' })
  async findAll() {
    return this.classesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific class' })
  async findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create new class (Admin only)' })
  async create(@Body() dto: CreateClassDto) {
    return this.classesService.create(dto);
  }

  @Post(':classId/sections')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Add a section to a class (Admin only)' })
  async addSection(
    @Param('classId') classId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.classesService.addSection(classId, dto);
  }

  @Put('sections/:sectionId/class-teacher')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Assign or reassign class teacher to a section (Admin only)' })
  async assignClassTeacher(
    @Param('sectionId') sectionId: string,
    @Body('staffId') staffId: string,
  ) {
    return this.classesService.assignClassTeacher(sectionId, staffId);
  }

  @Delete('sections/:sectionId')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete a section from a class (Admin only)' })
  async deleteSection(@Param('sectionId') sectionId: string) {
    return this.classesService.deleteSection(sectionId);
  }
}

