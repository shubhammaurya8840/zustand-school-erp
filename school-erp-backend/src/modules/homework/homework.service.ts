import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  CreateHomeworkDto,
  UpdateHomeworkDto,
  SubmitHomeworkDto,
  EvaluateSubmissionDto,
} from './dto/create-homework.dto';
import { Role, HomeworkTargetType } from '@prisma/client';

@Injectable()
export class HomeworkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(
    query: {
      classId?: string;
      sectionId?: string;
      subjectId?: string;
      studentId?: string;
      status?: string;
    },
    currentUser: { id: string; role: Role },
  ) {
    const currentSession = await this.prisma.academicSession.findFirst({ where: { isCurrent: true } });
    const sessionId = currentSession?.id;

    // 1. Role: STUDENT — Strict Class/Section & Individual Isolation
    if (currentUser.role === Role.STUDENT) {
      const student = await this.prisma.student.findUnique({
        where: { userId: currentUser.id },
      });
      if (!student) throw new NotFoundException('Student profile not found');

      return this.prisma.homework.findMany({
        where: {
          classId: student.classId,
          sectionId: student.sectionId,
          ...(sessionId ? { sessionId } : {}),
          isArchived: false,
          OR: [
            { targetType: HomeworkTargetType.CLASS_SECTION },
            { targetType: HomeworkTargetType.INDIVIDUAL_STUDENT, studentId: student.id },
          ],
        },
        include: {
          subject: true,
          teacher: { select: { firstName: true, lastName: true } },
          submissions: {
            where: { studentId: student.id },
          },
        },
        orderBy: { dueDate: 'asc' },
      });
    }

    // 2. Role: PARENT — Strict Linked Children Isolation
    if (currentUser.role === Role.PARENT) {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: currentUser.id },
        include: { children: true },
      });
      if (!parent) throw new NotFoundException('Parent profile not found');

      const targetStudentIds = query.studentId
        ? parent.children.filter((c) => c.id === query.studentId).map((c) => c.id)
        : parent.children.map((c) => c.id);

      if (query.studentId && targetStudentIds.length === 0) {
        throw new ForbiddenException('Access denied: Selected student is not linked to your parent account.');
      }

      const childClasses = parent.children.map((c) => ({
        classId: c.classId,
        sectionId: c.sectionId,
        studentId: c.id,
      }));

      return this.prisma.homework.findMany({
        where: {
          isArchived: false,
          ...(sessionId ? { sessionId } : {}),
          OR: childClasses.map((item) => ({
            classId: item.classId,
            sectionId: item.sectionId,
            OR: [
              { targetType: HomeworkTargetType.CLASS_SECTION },
              { targetType: HomeworkTargetType.INDIVIDUAL_STUDENT, studentId: item.studentId },
            ],
          })),
        },
        include: {
          class: true,
          section: true,
          subject: true,
          teacher: { select: { firstName: true, lastName: true } },
          submissions: {
            where: { studentId: { in: targetStudentIds } },
          },
        },
        orderBy: { dueDate: 'asc' },
      });
    }

    // 3. Role: TEACHER — Filtered by teacher's assigned classes
    if (currentUser.role === Role.TEACHER) {
      const staff = await this.prisma.staff.findUnique({
        where: { userId: currentUser.id },
        include: {
          classTeacherOf: true,
          teacherAssignments: true,
        },
      });
      if (!staff) throw new NotFoundException('Teacher profile not found');

      const where: any = { isArchived: false };
      if (sessionId) where.sessionId = sessionId;

      if (query.classId) where.classId = query.classId;
      if (query.sectionId) where.sectionId = query.sectionId;
      if (query.subjectId) where.subjectId = query.subjectId;

      // Allow homeworks created by this teacher or in classes assigned to this teacher
      where.OR = [
        { teacherId: staff.id },
        ...(staff.classTeacherOf
          ? [{ classId: staff.classTeacherOf.classId, sectionId: staff.classTeacherOf.id }]
          : []),
      ];

      return this.prisma.homework.findMany({
        where,
        include: {
          class: true,
          section: true,
          subject: true,
          student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: { dueDate: 'desc' },
      });
    }

    // 4. Role: SCHOOL_ADMIN — School-wide
    const where: any = {};
    if (query.classId) where.classId = query.classId;
    if (query.sectionId) where.sectionId = query.sectionId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (sessionId) where.sessionId = sessionId;

    return this.prisma.homework.findMany({
      where,
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: { select: { firstName: true, lastName: true } },
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  async findOne(id: string, currentUser: { id: string; role: Role }) {
    const hw = await this.prisma.homework.findUnique({
      where: { id },
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        submissions: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true, admissionNo: true, rollNo: true } },
          },
        },
      },
    });

    if (!hw) throw new NotFoundException('Homework assignment not found');

    // Access control
    if (currentUser.role === Role.STUDENT) {
      const student = await this.prisma.student.findUnique({ where: { userId: currentUser.id } });
      if (!student || student.classId !== hw.classId || student.sectionId !== hw.sectionId) {
        throw new ForbiddenException('Access denied to this assignment');
      }
      if (hw.targetType === HomeworkTargetType.INDIVIDUAL_STUDENT && hw.studentId !== student.id) {
        throw new ForbiddenException('This assignment was specifically assigned to another student.');
      }
    }

    return hw;
  }

  async create(dto: CreateHomeworkDto, currentUser: { id: string; role: Role }) {
    const currentSession = await this.prisma.academicSession.findFirst({ where: { isCurrent: true } });
    if (!currentSession) throw new BadRequestException('No current academic session found.');

    let resolvedTeacherId: string;

    if (currentUser.role === Role.TEACHER) {
      const staff = await this.prisma.staff.findUnique({
        where: { userId: currentUser.id },
        include: { classTeacherOf: true },
      });
      if (!staff) throw new NotFoundException('Teacher profile not found');
      resolvedTeacherId = staff.id;

      // Verify assignment permission
      const isClassTeacher = staff.classTeacherOf?.id === dto.sectionId;
      const isSubjectTeacher = await this.prisma.teacherAssignment.count({
        where: {
          teacherId: staff.id,
          classId: dto.classId,
          sectionId: dto.sectionId,
          subjectId: dto.subjectId,
        },
      });

      if (!isClassTeacher && isSubjectTeacher === 0) {
        throw new ForbiddenException(
          'You are not authorized to assign homework for a class or subject you do not teach.',
        );
      }
    } else {
      // Admin creating homework
      const defaultTeacher = await this.prisma.staff.findFirst({ where: { role: Role.TEACHER } });
      if (!defaultTeacher) throw new BadRequestException('No teacher found in staff registry.');
      resolvedTeacherId = defaultTeacher.id;
    }

    // Individual assignment verification
    if (dto.targetType === HomeworkTargetType.INDIVIDUAL_STUDENT) {
      if (!dto.studentId) {
        throw new BadRequestException('studentId is required when targetType is INDIVIDUAL_STUDENT');
      }
      const student = await this.prisma.student.findUnique({
        where: { id: dto.studentId },
      });
      if (!student || student.classId !== dto.classId || student.sectionId !== dto.sectionId) {
        throw new BadRequestException('Selected student does not belong to the chosen class and section.');
      }
    }

    const homework = await this.prisma.homework.create({
      data: {
        sessionId: currentSession.id,
        classId: dto.classId,
        sectionId: dto.sectionId,
        subjectId: dto.subjectId,
        teacherId: resolvedTeacherId,
        targetType: dto.targetType || HomeworkTargetType.CLASS_SECTION,
        studentId: dto.targetType === HomeworkTargetType.INDIVIDUAL_STUDENT ? dto.studentId : null,
        title: dto.title.trim(),
        description: dto.description.trim(),
        attachmentUrl: dto.attachmentUrl?.trim() || null,
        dueDate: new Date(dto.dueDate),
      },
      include: {
        class: true,
        section: true,
        subject: true,
      },
    });

    await this.auditLogsService.log({
      userId: currentUser.id,
      action: 'ASSIGN_HOMEWORK',
      module: 'HOMEWORK',
      entityId: homework.id,
      details: { title: homework.title, class: homework.class.name, section: homework.section.name },
    });

    return homework;
  }

  async update(id: string, dto: UpdateHomeworkDto, currentUser: { id: string; role: Role }) {
    const hw = await this.prisma.homework.findUnique({ where: { id } });
    if (!hw) throw new NotFoundException('Homework not found');

    const updated = await this.prisma.homework.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.description ? { description: dto.description.trim() } : {}),
        ...(dto.dueDate ? { dueDate: new Date(dto.dueDate) } : {}),
        ...(dto.isArchived !== undefined ? { isArchived: dto.isArchived } : {}),
      },
    });

    await this.auditLogsService.log({
      userId: currentUser.id,
      action: 'UPDATE_HOMEWORK',
      module: 'HOMEWORK',
      entityId: id,
    });

    return updated;
  }

  async archive(id: string, currentUser: { id: string; role: Role }) {
    const hw = await this.prisma.homework.findUnique({ where: { id } });
    if (!hw) throw new NotFoundException('Homework not found');

    const updated = await this.prisma.homework.update({
      where: { id },
      data: { isArchived: !hw.isArchived },
    });

    return { message: `Homework ${updated.isArchived ? 'archived' : 'restored'} successfully` };
  }

  async submit(homeworkId: string, dto: SubmitHomeworkDto, studentUserId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const hw = await this.prisma.homework.findUnique({ where: { id: homeworkId } });
    if (!hw) throw new NotFoundException('Homework assignment not found');

    if (hw.classId !== student.classId || hw.sectionId !== student.sectionId) {
      throw new ForbiddenException('You cannot submit homework for a class you are not enrolled in.');
    }
    if (hw.targetType === HomeworkTargetType.INDIVIDUAL_STUDENT && hw.studentId !== student.id) {
      throw new ForbiddenException('This assignment was specifically assigned to another student.');
    }

    return this.prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_studentId: {
          homeworkId,
          studentId: student.id,
        },
      },
      update: {
        content: dto.content || null,
        fileUrl: dto.fileUrl || null,
        submittedAt: new Date(),
        status: 'SUBMITTED',
      },
      create: {
        homeworkId,
        studentId: student.id,
        content: dto.content || null,
        fileUrl: dto.fileUrl || null,
        status: 'SUBMITTED',
      },
    });
  }

  async evaluateSubmission(submissionId: string, dto: EvaluateSubmissionDto, teacherUserId: string) {
    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      include: { homework: true },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    return this.prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        marks: dto.marks !== undefined ? dto.marks : submission.marks,
        feedback: dto.feedback !== undefined ? dto.feedback : submission.feedback,
        status: 'EVALUATED',
        evaluatedAt: new Date(),
      },
    });
  }
}

