import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HomeworkService } from './homework.service';
import {
  CreateHomeworkDto,
  UpdateHomeworkDto,
  SubmitHomeworkDto,
  EvaluateSubmissionDto,
} from './dto/create-homework.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Homework & Assignments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('homework')
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: 'List homework assignments with class, student, or role filtering' })
  async findAll(
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: { id: string; role: Role },
  ) {
    return this.homeworkService.findAll({ classId, sectionId, subjectId, studentId, status }, user!);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT)
  @ApiOperation({ summary: 'Get single homework assignment with submissions' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.homeworkService.findOne(id, user);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Create homework assignment for class or individual student (Teacher & Admin)' })
  async create(
    @Body() dto: CreateHomeworkDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.homeworkService.create(dto, user);
  }

  @Put(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Update homework assignment details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHomeworkDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.homeworkService.update(id, dto, user);
  }

  @Put(':id/archive')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Toggle archive status of homework assignment' })
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.homeworkService.archive(id, user);
  }

  @Post(':id/submit')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Submit solution or completed file for homework assignment (Student only)' })
  async submit(
    @Param('id') id: string,
    @Body() dto: SubmitHomeworkDto,
    @CurrentUser('id') studentUserId: string,
  ) {
    return this.homeworkService.submit(id, dto, studentUserId);
  }

  @Put('submissions/:id/evaluate')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Evaluate and grade a student homework submission (Teacher & Admin)' })
  async evaluate(
    @Param('id') id: string,
    @Body() dto: EvaluateSubmissionDto,
    @CurrentUser('id') teacherUserId: string,
  ) {
    return this.homeworkService.evaluateSubmission(id, dto, teacherUserId);
  }
}

