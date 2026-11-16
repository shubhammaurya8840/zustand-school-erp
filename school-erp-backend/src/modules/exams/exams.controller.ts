import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { CreateExamDto, CreateExamScheduleDto, RecordMarksDto } from './dto/create-exam.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Examinations & Report Cards')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @ApiOperation({ summary: 'List exams and subject schedules' })
  async findAll(@Query('sessionId') sessionId?: string) {
    return this.examsService.findAll(sessionId);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create new exam period (Admin only)' })
  async createExam(@Body() dto: CreateExamDto) {
    return this.examsService.createExam(dto);
  }

  @Post('schedules')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Schedule subject date and maximum marks (Admin only)' })
  async scheduleSubject(@Body() dto: CreateExamScheduleDto) {
    return this.examsService.scheduleExamSubject(dto);
  }

  @Post('marks')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Record and update subject marks for students (Teacher & Admin)' })
  async recordMarks(
    @Body() dto: RecordMarksDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.examsService.recordMarks(dto, actorUserId);
  }

  @Put(':id/publish')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Publish exam results so parents & students can view them (Admin only)' })
  async publishExamResults(
    @Param('id') id: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.examsService.publishExamResults(id, actorUserId);
  }

  @Get('my-results')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get published exam results for current logged in student' })
  async getMyResults(@CurrentUser('id') userId: string) {
    return this.examsService.getMyResults(userId);
  }

  @Get('report-card/:studentId/:examId')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.PARENT, Role.STUDENT)
  @ApiOperation({ summary: 'Get official report card with total, percentage & letter grades' })
  async getStudentReportCard(
    @Param('studentId') studentId: string,
    @Param('examId') examId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.examsService.getStudentReportCard(studentId, examId, currentUser);
  }
}

