import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto } from './dto/create-student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StudentStatus } from '@prisma/client';

@ApiTags('Students')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT, Role.TEACHER, Role.LIBRARIAN)
  @ApiOperation({ summary: 'List all students with filters (Class, Section, Status, Search)' })
  async findAll(
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('status') status?: StudentStatus,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.studentsService.findAll({ classId, sectionId, status, search, page, limit });
  }

  @Get('me')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get authenticated student profile and personal records' })
  async getMe(@CurrentUser('id') studentUserId: string) {
    return this.studentsService.getMe(studentUserId);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT, Role.TEACHER, Role.LIBRARIAN, Role.PARENT, Role.STUDENT)
  @ApiOperation({ summary: 'Get full student academic and fee profile' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.studentsService.findOne(id, user);
  }

  @Post('admit')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Admit new student with unique admission number and credentials (Admin & Accountant)' })
  async create(
    @Body() dto: CreateStudentDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.studentsService.create(dto, adminUserId);
  }

  @Post(':id/reset-password')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Reset a student account password (Admin & Accountant)' })
  async resetPassword(
    @Param('id') id: string,
    @Body('newPassword') newPassword: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.studentsService.resetPassword(id, newPassword, adminUserId);
  }

  @Put(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Update student profile, class, or status (Admin & Accountant)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.studentsService.update(id, dto, adminUserId);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Delete student, enrollments and associated login account (Admin & Accountant)' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.studentsService.delete(id, adminUserId);
  }
}
