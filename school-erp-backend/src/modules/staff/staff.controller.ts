import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { AssignTeacherDto, UpdateTeacherAssignmentDto } from './dto/assign-teacher.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Staff & Teacher Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT, Role.TEACHER, Role.LIBRARIAN)
  @ApiOperation({ summary: 'List all staff members with filters (Role, Department, Search)' })
  async findAll(
    @Query('role') role?: Role,
    @Query('department') department?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.staffService.findAll({ role, department, search, page, limit });
  }

  @Get('next-employee-id')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get next sequential staff Employee ID for registration (Admin & Accountant)' })
  async getNextEmployeeId(@Query('role') role?: Role) {
    return this.staffService.getNextEmployeeId(role);
  }

  // Teacher Workspace & Assigned Classes
  @Get('teachers/my-classes')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Get classes and sections assigned to authenticated teacher' })
  async getMyAssignedClasses(@CurrentUser('id') teacherUserId: string) {
    return this.staffService.getMyAssignedClasses(teacherUserId);
  }

  @Get('teachers/my-subjects')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Get subjects assigned to authenticated teacher by admin' })
  async getMyAssignedSubjects(@CurrentUser('id') teacherUserId: string) {
    return this.staffService.getMyAssignedSubjects(teacherUserId);
  }

  @Get('teachers/class-workspace/:classId/:sectionId')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get dedicated academic workspace for a class and section (Teacher & Admin)' })
  async getClassWorkspace(
    @Param('classId') classId: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.staffService.getClassWorkspace(classId, sectionId, user);
  }

  // Teacher Assignment Administration
  @Get('teachers/assignments')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'List teacher class-section-subject assignments' })
  async getTeacherAssignments(
    @Query('teacherId') teacherId?: string,
    @Query('sessionId') sessionId?: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.staffService.getTeacherAssignments({ teacherId, sessionId, classId, sectionId });
  }

  @Post('teachers/assignments')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Assign a teacher to session, class, section, and subjects (Admin only)' })
  async assignTeacher(
    @Body() dto: AssignTeacherDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.staffService.assignTeacher(dto, adminUserId);
  }

  @Put('teachers/assignments/:id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update an existing teacher assignment (Admin only)' })
  async updateTeacherAssignment(
    @Param('id') id: string,
    @Body() dto: UpdateTeacherAssignmentDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.staffService.updateTeacherAssignment(id, dto, adminUserId);
  }

  @Delete('teachers/assignments/:id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Remove a teacher assignment (Admin only)' })
  async removeTeacherAssignment(
    @Param('id') id: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.staffService.removeTeacherAssignment(id, adminUserId);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT, Role.TEACHER, Role.LIBRARIAN)
  @ApiOperation({ summary: 'Get staff profile by ID' })
  async findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Update staff member profile details (Admin & Accountant)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.staffService.update(id, dto, adminUserId);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Register new staff member and create login account (Admin & Accountant)' })
  async create(
    @Body() dto: CreateStaffDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.staffService.create(dto, adminUserId);
  }

  @Put(':id/toggle-status')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Activate or deactivate staff account (Admin & Accountant)' })
  async toggleActiveStatus(
    @Param('id') id: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.staffService.toggleActiveStatus(id, adminUserId);
  }
}
