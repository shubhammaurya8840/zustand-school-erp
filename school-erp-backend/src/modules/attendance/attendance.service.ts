import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { MarkClassAttendanceDto, MarkStaffAttendanceDto } from './dto/mark-attendance.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Helper to normalize a date string (YYYY-MM-DD) to UTC midnight
   * to align perfectly with PostgreSQL @db.Date.
   */
  private normalizeDate(dateStr: string): Date {
    const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanStr.split('-').map(Number);
    if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
      throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
    }
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  }

  /**
   * Strict Teacher-Class-Section authorization validation.
   */
  async validateTeacherClassAccess(teacherUserId: string, classId: string, sectionId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { userId: teacherUserId },
      include: { classTeacherOf: true },
    });

    if (!staff) {
      throw new ForbiddenException('Teacher profile not linked to user account.');
    }

    const isClassTeacher = staff.classTeacherOf?.id === sectionId && staff.classTeacherOf?.classId === classId;
    const isSubjectTeacher = await this.prisma.teacherAssignment.count({
      where: {
        teacherId: staff.id,
        classId,
        sectionId,
      },
    });

    if (!isClassTeacher && isSubjectTeacher === 0) {
      throw new ForbiddenException(
        'Access denied: You are not authorized to view or mark attendance for this unassigned class and section.',
      );
    }
  }

  async getClassAttendance(
    classId: string,
    sectionId: string,
    dateStr: string,
    currentUser?: { id: string; role: Role },
  ) {
    if (!classId || !sectionId || !dateStr) {
      throw new BadRequestException('classId, sectionId, and date query parameters are all required.');
    }

    // Role check for teachers
    if (currentUser && currentUser.role === Role.TEACHER) {
      await this.validateTeacherClassAccess(currentUser.id, classId, sectionId);
    }

    // 1. Validate section and relationship to class
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { class: true },
    });

    if (!section) {
      throw new NotFoundException('Selected section was not found.');
    }
    if (section.classId !== classId) {
      throw new BadRequestException('Selected section does not belong to the specified class.');
    }

    const targetDate = this.normalizeDate(dateStr);

    // 2. Fetch all active students belonging strictly to this class and section
    const students = await this.prisma.student.findMany({
      where: {
        classId,
        sectionId,
        status: 'ACTIVE',
      },
      include: {
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
        parent: { select: { id: true, fatherName: true, primaryPhone: true } },
      },
      orderBy: { rollNo: 'asc' },
    });

    // 3. Fetch any existing attendance records for this date
    const existingAttendance = await this.prisma.studentAttendance.findMany({
      where: {
        classId,
        sectionId,
        date: targetDate,
      },
    });

    const attendanceMap = new Map(existingAttendance.map((a) => [a.studentId, a]));

    // 4. Return complete roster with their current attendance status
    return students.map((stu) => {
      const att = attendanceMap.get(stu.id);
      return {
        studentId: stu.id,
        admissionNo: stu.admissionNo,
        rollNo: stu.rollNo,
        firstName: stu.firstName,
        lastName: stu.lastName,
        classId: stu.classId,
        className: stu.class.name,
        sectionId: stu.sectionId,
        sectionName: stu.section.name,
        parentName: stu.parent?.fatherName || null,
        parentPhone: stu.parent?.primaryPhone || null,
        status: att ? att.status : null,
        remarks: att?.remarks || null,
        attendanceRecordId: att?.id || null,
      };
    });
  }

  async markClassAttendance(
    dto: MarkClassAttendanceDto,
    actorUserId: string,
    userRole?: Role,
  ) {
    if (!dto.classId || !dto.sectionId || !dto.date) {
      throw new BadRequestException('classId, sectionId, and date are required fields.');
    }

    // Role check for teachers
    if (userRole === Role.TEACHER) {
      await this.validateTeacherClassAccess(actorUserId, dto.classId, dto.sectionId);
    }

    // 1. Validate section and verify relationship to class
    const section = await this.prisma.section.findUnique({
      where: { id: dto.sectionId },
      include: { class: true },
    });

    if (!section) {
      throw new NotFoundException('Selected section was not found.');
    }
    if (section.classId !== dto.classId) {
      throw new BadRequestException('Selected section does not belong to the specified class.');
    }

    // 2. Verify active academic session
    const currentSession = await this.prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });
    if (!currentSession) {
      throw new BadRequestException('No active academic session found for recording attendance.');
    }

    const date = this.normalizeDate(dto.date);

    if (!dto.attendanceList || !Array.isArray(dto.attendanceList) || dto.attendanceList.length === 0) {
      throw new BadRequestException('attendanceList must contain at least one student attendance record.');
    }

    // 3. Validate student membership: ensure each student belongs to the selected class & section
    const requestedStudentIds = dto.attendanceList.map((item) => item.studentId);
    const validStudents = await this.prisma.student.findMany({
      where: {
        id: { in: requestedStudentIds },
        classId: dto.classId,
        sectionId: dto.sectionId,
        status: 'ACTIVE',
      },
      select: { id: true, firstName: true, lastName: true },
    });

    const validStudentMap = new Map(validStudents.map((s) => [s.id, s]));

    for (const item of dto.attendanceList) {
      if (!validStudentMap.has(item.studentId)) {
        throw new BadRequestException(
          `Student with ID "${item.studentId}" does not belong to Class ${section.class.name} Section ${section.name}. Cross-class attendance marking is prohibited.`,
        );
      }
    }

    // 4. Upsert attendance records atomically in a transaction
    const results = await this.prisma.$transaction(async (tx) => {
      const records = [];
      for (const item of dto.attendanceList) {
        const record = await tx.studentAttendance.upsert({
          where: {
            studentId_date: {
              studentId: item.studentId,
              date,
            },
          },
          update: {
            status: item.status,
            remarks: item.remarks ? item.remarks.trim() : null,
            markedById: actorUserId,
            classId: dto.classId,
            sectionId: dto.sectionId,
            sessionId: currentSession.id,
          },
          create: {
            studentId: item.studentId,
            sessionId: currentSession.id,
            classId: dto.classId,
            sectionId: dto.sectionId,
            date,
            status: item.status,
            remarks: item.remarks ? item.remarks.trim() : null,
            markedById: actorUserId,
          },
        });
        records.push(record);
      }
      return records;
    });

    await this.auditLogsService.log({
      userId: actorUserId,
      action: 'MARK_ATTENDANCE',
      module: 'ATTENDANCE',
      details: {
        classId: dto.classId,
        className: section.class.name,
        sectionId: dto.sectionId,
        sectionName: section.name,
        date: date.toISOString().split('T')[0],
        count: results.length,
      },
    });

    return {
      message: `Successfully recorded attendance for ${results.length} students in ${section.class.name}-${section.name} on ${date.toISOString().split('T')[0]}`,
      count: results.length,
    };
  }

  // ==========================================
  // Student Personal Attendance (Strict Isolation)
  // ==========================================

  async getMyAttendance(studentUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
      include: {
        class: true,
        section: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student record not found for authenticated user');
    }

    const records = await this.prisma.studentAttendance.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' },
      take: 120,
    });

    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    const absentCount = records.filter((r) => r.status === 'ABSENT').length;
    const lateCount = records.filter((r) => r.status === 'LATE').length;
    const leaveCount = records.filter((r) => r.status === 'LEAVE').length;
    const totalMarked = records.length;
    const percentage = totalMarked > 0 ? Number(((presentCount / totalMarked) * 100).toFixed(1)) : 0;

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        rollNo: student.rollNo,
        class: student.class.name,
        section: student.section.name,
      },
      stats: {
        totalMarked,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        leave: leaveCount,
        percentage,
      },
      records,
    };
  }

  async getStudentAttendance(studentId: string, currentUser: { id: string; role: Role }) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, section: true, parent: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Role-based authorization
    if (currentUser.role === Role.STUDENT && student.userId !== currentUser.id) {
      throw new ForbiddenException('Access denied: You can only view your own attendance history.');
    }

    if (currentUser.role === Role.PARENT && student.parent?.userId !== currentUser.id) {
      throw new ForbiddenException('Access denied: You can only view attendance for your linked children.');
    }

    if (currentUser.role === Role.TEACHER) {
      await this.validateTeacherClassAccess(currentUser.id, student.classId, student.sectionId);
    }

    const records = await this.prisma.studentAttendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 120,
    });

    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    const absentCount = records.filter((r) => r.status === 'ABSENT').length;
    const lateCount = records.filter((r) => r.status === 'LATE').length;
    const leaveCount = records.filter((r) => r.status === 'LEAVE').length;
    const totalMarked = records.length;
    const percentage = totalMarked > 0 ? Number(((presentCount / totalMarked) * 100).toFixed(1)) : 0;

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        rollNo: student.rollNo,
        class: student.class.name,
        section: student.section.name,
      },
      stats: {
        totalMarked,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        leave: leaveCount,
        percentage,
      },
      records,
    };
  }

  async markStaffAttendance(dto: MarkStaffAttendanceDto, actorUserId: string) {
    const date = this.normalizeDate(dto.date);

    const results = await this.prisma.$transaction(async (tx) => {
      const records = [];
      for (const item of dto.attendanceList) {
        const record = await tx.staffAttendance.upsert({
          where: {
            staffId_date: {
              staffId: item.staffId,
              date,
            },
          },
          update: {
            status: item.status,
            remarks: item.remarks || null,
            markedById: actorUserId,
          },
          create: {
            staffId: item.staffId,
            date,
            status: item.status,
            remarks: item.remarks || null,
            markedById: actorUserId,
          },
        });
        records.push(record);
      }
      return records;
    });

    await this.auditLogsService.log({
      userId: actorUserId,
      action: 'MARK_STAFF_ATTENDANCE',
      module: 'ATTENDANCE',
      details: { date: dto.date, count: results.length },
    });

    return {
      message: `Successfully marked staff attendance for ${results.length} members on ${dto.date}`,
      count: results.length,
    };
  }

  async getStaffAttendance(dateStr: string) {
    const date = this.normalizeDate(dateStr);
    return this.prisma.staffAttendance.findMany({
      where: { date },
      include: {
        staff: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: { staff: { firstName: 'asc' } },
    });
  }

  async getDailySummary(dateStr: string) {
    const date = this.normalizeDate(dateStr);

    const [totalStudents, presentCount, absentCount, lateCount, leaveCount] = await Promise.all([
      this.prisma.student.count({ where: { status: 'ACTIVE' } }),
      this.prisma.studentAttendance.count({ where: { date, status: 'PRESENT' } }),
      this.prisma.studentAttendance.count({ where: { date, status: 'ABSENT' } }),
      this.prisma.studentAttendance.count({ where: { date, status: 'LATE' } }),
      this.prisma.studentAttendance.count({ where: { date, status: 'LEAVE' } }),
    ]);

    const markedCount = presentCount + absentCount + lateCount + leaveCount;
    const percentage = markedCount > 0 ? ((presentCount / markedCount) * 100).toFixed(1) : '0.0';

    return {
      date: dateStr,
      totalActiveStudents: totalStudents,
      marked: markedCount,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      leave: leaveCount,
      percentage: Number(percentage),
    };
  }
}
