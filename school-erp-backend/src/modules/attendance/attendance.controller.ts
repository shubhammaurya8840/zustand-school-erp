import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { MarkClassAttendanceDto, MarkStaffAttendanceDto } from './dto/mark-attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('class')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get student attendance roster for a class section on a date' })
  async getClassAttendance(
    @Query('classId') classId: string,
    @Query('sectionId') sectionId: string,
    @Query('date') date: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.attendanceService.getClassAttendance(classId, sectionId, date, user);
  }

  @Post('class')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Bulk mark student attendance for a class (Teacher & Admin)' })
  async markClassAttendance(
    @Body() dto: MarkClassAttendanceDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.attendanceService.markClassAttendance(dto, user.id, user.role);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get personal attendance history and summary for authenticated student' })
  async getMyAttendance(@CurrentUser('id') studentUserId: string) {
    return this.attendanceService.getMyAttendance(studentUserId);
  }

  @Get('student/:studentId')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.PARENT, Role.STUDENT)
  @ApiOperation({ summary: 'Get attendance history for a specific student with role permission checks' })
  async getStudentAttendance(
    @Param('studentId') studentId: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.attendanceService.getStudentAttendance(studentId, user);
  }

  @Get('staff')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get staff attendance sheet for a date' })
  async getStaffAttendance(@Query('date') date: string) {
    return this.attendanceService.getStaffAttendance(date);
  }

  @Post('staff')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Mark staff daily attendance (Admin only)' })
  async markStaffAttendance(
    @Body() dto: MarkStaffAttendanceDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.attendanceService.markStaffAttendance(dto, actorUserId);
  }

  @Get('summary')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get daily school-wide student attendance summary and percentage' })
  async getDailySummary(@Query('date') date: string) {
    return this.attendanceService.getDailySummary(date);
  }
}
