import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTimetablePeriodDto } from './dto/create-period.dto';
import { DayOfWeek, Role } from '@prisma/client';

@Injectable()
export class TimetableService {
  constructor(private readonly prisma: PrismaService) {}

  async getClassTimetable(sessionId?: string, classId?: string, sectionId?: string) {
    const currentSession = await this.prisma.academicSession.findFirst({ where: { isCurrent: true } });
    const effectiveSessionId = sessionId || currentSession?.id;

    const where: any = {};
    if (effectiveSessionId) where.sessionId = effectiveSessionId;
    if (classId) where.classId = classId;
    if (sectionId) where.sectionId = sectionId;

    return this.prisma.timetablePeriod.findMany({
      where,
      include: {
        subject: true,
        teacher: {
          select: { id: true, firstName: true, lastName: true, employeeId: true },
        },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNo: 'asc' }],
    });
  }

  async getTeacherTimetable(sessionId?: string, teacherId?: string) {
    const currentSession = await this.prisma.academicSession.findFirst({ where: { isCurrent: true } });
    const effectiveSessionId = sessionId || currentSession?.id;

    const where: any = {};
    if (effectiveSessionId) where.sessionId = effectiveSessionId;
    if (teacherId) where.teacherId = teacherId;

    return this.prisma.timetablePeriod.findMany({
      where,
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNo: 'asc' }],
    });
  }

  async getMyClassTimetable(currentUser: { id: string; role: Role }, studentIdQuery?: string) {
    const currentSession = await this.prisma.academicSession.findFirst({ where: { isCurrent: true } });
    if (!currentSession) throw new BadRequestException('No current academic session found.');

    let targetStudent: any = null;

    if (currentUser.role === Role.STUDENT) {
      targetStudent = await this.prisma.student.findUnique({
        where: { userId: currentUser.id },
        include: { class: true, section: true },
      });
      if (!targetStudent) throw new NotFoundException('Student profile not found');
    } else if (currentUser.role === Role.PARENT) {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: currentUser.id },
        include: { children: { include: { class: true, section: true } } },
      });
      if (!parent || parent.children.length === 0) throw new NotFoundException('No linked children found');

      if (studentIdQuery) {
        targetStudent = parent.children.find((c) => c.id === studentIdQuery);
        if (!targetStudent) throw new ForbiddenException('Child not linked to this parent');
      } else {
        targetStudent = parent.children[0];
      }
    } else {
      throw new BadRequestException('Endpoint intended for Students and Parents');
    }

    const periods = await this.prisma.timetablePeriod.findMany({
      where: {
        sessionId: currentSession.id,
        classId: targetStudent.classId,
        sectionId: targetStudent.sectionId,
      },
      include: {
        subject: true,
        teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNo: 'asc' }],
    });

    return {
      class: targetStudent.class.name,
      section: targetStudent.section.name,
      studentName: `${targetStudent.firstName} ${targetStudent.lastName}`,
      periods,
    };
  }

  async getMyTeacherSchedule(teacherUserId: string) {
    const staff = await this.prisma.staff.findUnique({ where: { userId: teacherUserId } });
    if (!staff) throw new NotFoundException('Teacher staff record not found');

    const currentSession = await this.prisma.academicSession.findFirst({ where: { isCurrent: true } });

    return this.prisma.timetablePeriod.findMany({
      where: {
        teacherId: staff.id,
        ...(currentSession ? { sessionId: currentSession.id } : {}),
      },
      include: {
        class: true,
        section: true,
        subject: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNo: 'asc' }],
    });
  }

  async createPeriod(dto: CreateTimetablePeriodDto) {
    // 1. Conflict Check: Teacher already booked in another class in this period
    const teacherConflict = await this.prisma.timetablePeriod.findUnique({
      where: {
        sessionId_teacherId_dayOfWeek_periodNo: {
          sessionId: dto.sessionId,
          teacherId: dto.teacherId,
          dayOfWeek: dto.dayOfWeek,
          periodNo: dto.periodNo,
        },
      },
      include: { class: true, section: true },
    });
    if (teacherConflict) {
      throw new BadRequestException(
        `Teacher is already assigned to ${teacherConflict.class.name}-${teacherConflict.section.name} on ${dto.dayOfWeek} period ${dto.periodNo}`,
      );
    }

    // 2. Conflict Check: Room already occupied
    const roomConflict = await this.prisma.timetablePeriod.findUnique({
      where: {
        sessionId_roomNo_dayOfWeek_periodNo: {
          sessionId: dto.sessionId,
          roomNo: dto.roomNo,
          dayOfWeek: dto.dayOfWeek,
          periodNo: dto.periodNo,
        },
      },
      include: { class: true, section: true },
    });
    if (roomConflict) {
      throw new BadRequestException(
        `${dto.roomNo} is already booked by ${roomConflict.class.name}-${roomConflict.section.name} on ${dto.dayOfWeek} period ${dto.periodNo}`,
      );
    }

    // 3. Conflict Check: Class & Section already has a period
    const classConflict = await this.prisma.timetablePeriod.findUnique({
      where: {
        sessionId_classId_sectionId_dayOfWeek_periodNo: {
          sessionId: dto.sessionId,
          classId: dto.classId,
          sectionId: dto.sectionId,
          dayOfWeek: dto.dayOfWeek,
          periodNo: dto.periodNo,
        },
      },
      include: { subject: true },
    });
    if (classConflict) {
      throw new BadRequestException(
        `This section already has ${classConflict.subject.name} scheduled on ${dto.dayOfWeek} period ${dto.periodNo}`,
      );
    }

    return this.prisma.timetablePeriod.create({
      data: dto,
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: true,
      },
    });
  }

  async deletePeriod(id: string) {
    const period = await this.prisma.timetablePeriod.findUnique({ where: { id } });
    if (!period) {
      throw new NotFoundException('Timetable period not found');
    }
    return this.prisma.timetablePeriod.delete({ where: { id } });
  }
}
