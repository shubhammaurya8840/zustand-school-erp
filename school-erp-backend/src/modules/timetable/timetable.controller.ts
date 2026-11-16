import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { CreateTimetablePeriodDto } from './dto/create-period.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Timetable')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get('my-class')
  @Roles(Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: 'Get timetable for authenticated student or parent child' })
  async getMyClassTimetable(
    @CurrentUser() user: { id: string; role: Role },
    @Query('studentId') studentId?: string,
  ) {
    return this.timetableService.getMyClassTimetable(user, studentId);
  }

  @Get('my-schedule')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Get weekly timetable schedule for authenticated teacher' })
  async getMyTeacherSchedule(@CurrentUser('id') teacherUserId: string) {
    return this.timetableService.getMyTeacherSchedule(teacherUserId);
  }

  @Get('class')
  @ApiOperation({ summary: 'Get timetable schedule for a class section' })
  async getClassTimetable(
    @Query('sessionId') sessionId?: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.timetableService.getClassTimetable(sessionId, classId, sectionId);
  }

  @Get('teacher/:teacherId')
  @ApiOperation({ summary: 'Get weekly teaching timetable for a teacher' })
  async getTeacherTimetable(
    @Param('teacherId') teacherId: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.timetableService.getTeacherTimetable(sessionId, teacherId);
  }

  @Post('periods')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Schedule a period with teacher & room conflict detection (Admin only)' })
  async createPeriod(@Body() dto: CreateTimetablePeriodDto) {
    return this.timetableService.createPeriod(dto);
  }

  @Delete('periods/:id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Remove a scheduled period (Admin only)' })
  async deletePeriod(@Param('id') id: string) {
    return this.timetableService.deletePeriod(id);
  }
}
