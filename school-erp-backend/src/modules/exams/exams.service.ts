import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ExamType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateExamDto, CreateExamScheduleDto, RecordMarksDto } from './dto/create-exam.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
  }

  async findAll(sessionId?: string) {
    const where: any = {};
    if (sessionId) where.sessionId = sessionId;

    return this.prisma.exam.findMany({
      where,
      include: {
        session: true,
        schedules: {
          include: {
            class: true,
            subject: true,
            _count: { select: { results: true } },
          },
          orderBy: { examDate: 'asc' },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async createExam(dto: CreateExamDto) {
    let parsedType = dto.type as ExamType;
    if ((dto.type as any) === 'MID_TERM') parsedType = ExamType.HALF_YEARLY;
    if ((dto.type as any) === 'FINAL') parsedType = ExamType.ANNUAL;
    if ((dto.type as any) === 'PERIODIC_TEST') parsedType = ExamType.UNIT_TEST;

    return this.prisma.exam.create({
      data: {
        sessionId: dto.sessionId,
        name: dto.name.trim(),
        type: parsedType,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isPublished: false,
      },
      include: {
        session: { select: { id: true, name: true } },
        schedules: {
          include: {
            class: { select: { id: true, name: true, code: true } },
            subject: { select: { id: true, name: true, code: true } },
          },
        },
        _count: { select: { schedules: true } },
      },
    });
  }

  async scheduleExamSubject(dto: CreateExamScheduleDto) {
    return this.prisma.examSchedule.upsert({
      where: {
        examId_classId_subjectId: {
          examId: dto.examId,
          classId: dto.classId,
          subjectId: dto.subjectId,
        },
      },
      update: {
        examDate: new Date(dto.examDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        maxMarks: dto.maxMarks,
        passMarks: dto.passMarks,
      },
      create: {
        examId: dto.examId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        examDate: new Date(dto.examDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        maxMarks: dto.maxMarks,
        passMarks: dto.passMarks,
      },
      include: { exam: true, class: true, subject: true },
    });
  }

  async recordMarks(dto: RecordMarksDto, actorUserId: string) {
    const schedule = await this.prisma.examSchedule.findUnique({
      where: { id: dto.examScheduleId },
      include: { exam: true, subject: true, class: true },
    });
    if (!schedule) {
      throw new NotFoundException('Exam schedule not found');
    }

    const maxMarks = Number(schedule.maxMarks);

    // Validate no marks exceed maxMarks
    for (const item of dto.marksList) {
      if (item.marksObtained > maxMarks) {
        throw new BadRequestException(
          `Marks obtained (${item.marksObtained}) cannot exceed maximum allowed marks (${maxMarks}) for ${schedule.subject.name}`,
        );
      }
    }

    const results = await this.prisma.$transaction(async (tx) => {
      const records = [];
      for (const item of dto.marksList) {
        const percentage = (item.marksObtained / maxMarks) * 100;
        const grade = this.calculateGrade(percentage);

        const res = await tx.examResult.upsert({
          where: {
            examScheduleId_studentId: {
              examScheduleId: dto.examScheduleId,
              studentId: item.studentId,
            },
          },
          update: {
            marksObtained: item.marksObtained,
            grade,
            remarks: item.remarks || null,
            enteredById: actorUserId,
          },
          create: {
            examScheduleId: dto.examScheduleId,
            studentId: item.studentId,
            marksObtained: item.marksObtained,
            grade,
            remarks: item.remarks || null,
            enteredById: actorUserId,
            isPublished: false,
          },
        });
        records.push(res);
      }
      return records;
    });

    await this.auditLogsService.log({
      userId: actorUserId,
      action: 'RECORD_MARKS',
      module: 'EXAMS',
      entityId: dto.examScheduleId,
      details: { count: results.length, subject: schedule.subject.name, class: schedule.class.name },
    });

    return {
      message: `Successfully recorded marks for ${results.length} students`,
      count: results.length,
    };
  }

  async publishExamResults(examId: string, actorUserId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.exam.update({
        where: { id: examId },
        data: { isPublished: true },
      });

      // Mark all schedule results as published
      const schedules = await tx.examSchedule.findMany({ where: { examId } });
      const scheduleIds = schedules.map((s) => s.id);

      await tx.examResult.updateMany({
        where: { examScheduleId: { in: scheduleIds } },
        data: { isPublished: true },
      });
    });

    await this.auditLogsService.log({
      userId: actorUserId,
      action: 'PUBLISH_RESULTS',
      module: 'EXAMS',
      entityId: examId,
      details: { examName: exam.name },
    });

    return { message: `Exam results for "${exam.name}" have been published.` };
  }

  async getStudentReportCard(studentId: string, examId: string, currentUser?: any) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, section: true, parent: true },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Role-based access control
    if (currentUser) {
      if (currentUser.role === Role.STUDENT && student.userId !== currentUser.id) {
        throw new ForbiddenException('You can only view your own report card');
      }
      if (currentUser.role === Role.PARENT) {
        const parent = await this.prisma.parent.findUnique({ where: { userId: currentUser.id } });
        if (!parent || student.parentId !== parent.id) {
          throw new ForbiddenException('You can only view your linked child’s report card');
        }
      }
      if (currentUser.role === Role.TEACHER) {
        const teacher = await this.prisma.staff.findUnique({ where: { userId: currentUser.id } });
        if (!teacher) {
          throw new ForbiddenException('Teacher profile not found');
        }
        const isClassTeacher = await this.prisma.section.findFirst({
          where: { id: student.sectionId, classTeacherId: teacher.id },
        });
        const isSubjectTeacher = await this.prisma.teacherAssignment.findFirst({
          where: { teacherId: teacher.id, classId: student.classId, sectionId: student.sectionId },
        });
        if (!isClassTeacher && !isSubjectTeacher) {
          throw new ForbiddenException('You can only view report cards for students in your assigned classes');
        }
      }
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { session: true },
    });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const results = await this.prisma.examResult.findMany({
      where: {
        studentId,
        isPublished: true,
        examSchedule: { examId },
      },
      include: {
        examSchedule: {
          include: { subject: true },
        },
      },
      orderBy: { examSchedule: { subject: { name: 'asc' } } },
    });

    const totalMax = results.reduce((acc, r) => acc + Number(r.examSchedule.maxMarks), 0);
    const totalObtained = results.reduce((acc, r) => acc + Number(r.marksObtained), 0);
    const overallPercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : '0.00';
    const overallGrade = this.calculateGrade(Number(overallPercentage));

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        rollNo: student.rollNo,
        class: student.class.name,
        section: student.section.name,
      },
      exam: {
        id: exam.id,
        name: exam.name,
        type: exam.type,
        session: exam.session.name,
      },
      subjects: results.map((r) => ({
        subject: r.examSchedule.subject.name,
        code: r.examSchedule.subject.code,
        maxMarks: Number(r.examSchedule.maxMarks),
        passMarks: Number(r.examSchedule.passMarks),
        marksObtained: Number(r.marksObtained),
        grade: r.grade,
        remarks: r.remarks,
      })),
      summary: {
        totalMaxMarks: totalMax,
        totalMarksObtained: totalObtained,
        percentage: Number(overallPercentage),
        grade: overallGrade,
        resultStatus: Number(overallPercentage) >= 33 ? 'PASSED' : 'NEEDS_IMPROVEMENT',
      },
    };
  }

  async getMyResults(studentUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
      include: { class: true, section: true },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const results = await this.prisma.examResult.findMany({
      where: {
        studentId: student.id,
        isPublished: true,
      },
      include: {
        examSchedule: {
          include: {
            exam: { include: { session: true } },
            subject: true,
          },
        },
      },
      orderBy: { examSchedule: { examDate: 'desc' } },
    });

    const examMap = new Map<string, any>();
    for (const r of results) {
      const exam = r.examSchedule.exam;
      if (!examMap.has(exam.id)) {
        examMap.set(exam.id, {
          exam: {
            id: exam.id,
            name: exam.name,
            type: exam.type,
            session: exam.session.name,
          },
          subjects: [],
          totalMaxMarks: 0,
          totalMarksObtained: 0,
        });
      }
      const group = examMap.get(exam.id);
      const maxMarks = Number(r.examSchedule.maxMarks);
      const marksObtained = Number(r.marksObtained);
      group.totalMaxMarks += maxMarks;
      group.totalMarksObtained += marksObtained;
      group.subjects.push({
        subject: r.examSchedule.subject.name,
        code: r.examSchedule.subject.code,
        maxMarks,
        passMarks: Number(r.examSchedule.passMarks),
        marksObtained,
        grade: r.grade,
        remarks: r.remarks,
      });
    }

    return Array.from(examMap.values()).map((e) => {
      const percentage = e.totalMaxMarks > 0 ? ((e.totalMarksObtained / e.totalMaxMarks) * 100).toFixed(2) : '0.00';
      return {
        ...e,
        percentage: Number(percentage),
        grade: this.calculateGrade(Number(percentage)),
        resultStatus: Number(percentage) >= 33 ? 'PASSED' : 'NEEDS_IMPROVEMENT',
        student: {
          name: `${student.firstName} ${student.lastName}`,
          admissionNo: student.admissionNo,
          class: student.class.name,
          section: student.section.name,
        },
      };
    });
  }
}

