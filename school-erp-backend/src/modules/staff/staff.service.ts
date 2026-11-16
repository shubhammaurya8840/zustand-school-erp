import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { AssignTeacherDto, UpdateTeacherAssignmentDto } from './dto/assign-teacher.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(query: { role?: Role; department?: string; search?: string; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.department) where.department = query.department;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { employeeId: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, staff] = await Promise.all([
      this.prisma.staff.count({ where }),
      this.prisma.staff.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, username: true, isActive: true, lastLoginAt: true } },
          classTeacherOf: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
          assignedSubjects: {
            include: {
              subject: true,
              class: true,
            },
          },
          teacherAssignments: {
            include: {
              class: true,
              section: true,
              subject: true,
            },
          },
        },
        orderBy: { firstName: 'asc' },
      }),
    ]);

    return { total, page, limit, staff };
  }

  async getNextEmployeeId(role?: Role): Promise<{ nextEmployeeId: string; sequenceNumber: number }> {
    const totalStaffCount = await this.prisma.staff.count();
    let prefix = 'ZPS-STF';
    if (role === Role.TEACHER) prefix = 'ZPS-TCH';
    else if (role === Role.ACCOUNTANT) prefix = 'ZPS-ACC';
    else if (role === Role.LIBRARIAN) prefix = 'ZPS-LIB';
    else if (role === Role.SCHOOL_ADMIN) prefix = 'ZPS-ADM';

    let nextSeq = totalStaffCount + 1;
    let candidate = `${prefix}-${String(nextSeq).padStart(3, '0')}`;

    // Guarantee uniqueness
    while (await this.prisma.staff.findUnique({ where: { employeeId: candidate } })) {
      nextSeq++;
      candidate = `${prefix}-${String(nextSeq).padStart(3, '0')}`;
    }

    return { nextEmployeeId: candidate, sequenceNumber: nextSeq };
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, isActive: true, lastLoginAt: true } },
        classTeacherOf: {
          include: {
            class: true,
            students: { where: { status: 'ACTIVE' }, orderBy: { rollNo: 'asc' } },
          },
        },
        assignedSubjects: {
          include: {
            subject: true,
            class: true,
          },
        },
        teacherAssignments: {
          include: {
            class: true,
            section: true,
            subject: true,
          },
        },
        timetablePeriods: {
          include: {
            class: true,
            section: true,
            subject: true,
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff record not found');
    }

    return staff;
  }

  async create(dto: CreateStaffDto, adminUserId: string) {
    const existingEmp = await this.prisma.staff.findUnique({ where: { employeeId: dto.employeeId.trim() } });
    if (existingEmp) {
      throw new BadRequestException(`Employee ID "${dto.employeeId}" is already registered`);
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existingUser) {
      throw new BadRequestException('A user account with this email address already exists');
    }

    let staffDobPass = '';
    if (dto.dob) {
      const d = new Date(dto.dob);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear());
      staffDobPass = `${day}${month}${year}`;
    }

    const passwordToUse = dto.temporaryPassword?.trim() || staffDobPass || 'Teacher2026!@';
    const passwordHash = await bcrypt.hash(passwordToUse, 12);
    const username = dto.employeeId.trim();

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          username,
          passwordHash,
          role: dto.role,
          isActive: true,
          mustChangePassword: true,
        },
      });

      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          employeeId: dto.employeeId.trim(),
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          role: dto.role,
          designation: dto.designation.trim(),
          qualification: dto.qualification.trim(),
          phone: dto.phone.trim(),
          email: dto.email.toLowerCase().trim(),
          dob: dto.dob ? new Date(dto.dob) : null,
          joiningDate: new Date(dto.joiningDate),
          department: dto.department.trim(),
        },
      });

      await this.auditLogsService.log({
        userId: adminUserId,
        action: 'CREATE',
        module: 'STAFF',
        entityId: staff.id,
        details: { employeeId: staff.employeeId, role: staff.role },
      });

      return {
        ...staff,
        credentials: {
          username: user.username,
          temporaryPassword: passwordToUse,
        },
      };
    });
  }

  async update(id: string, dto: UpdateStaffDto, adminUserId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!staff) {
      throw new NotFoundException('Staff record not found');
    }

    // If email is changing, verify it is not already taken
    if (dto.email && dto.email.toLowerCase().trim() !== staff.email.toLowerCase()) {
      const emailConflict = await this.prisma.user.findFirst({
        where: {
          email: dto.email.toLowerCase().trim(),
          id: { not: staff.userId },
        },
      });
      if (emailConflict) {
        throw new BadRequestException('Another user account with this email address already exists');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Update User if email or role changed
      if (dto.email || dto.role) {
        await tx.user.update({
          where: { id: staff.userId },
          data: {
            ...(dto.email ? { email: dto.email.toLowerCase().trim() } : {}),
            ...(dto.role ? { role: dto.role } : {}),
          },
        });
      }

      // Update Staff record
      const updatedStaff = await tx.staff.update({
        where: { id },
        data: {
          ...(dto.firstName ? { firstName: dto.firstName.trim() } : {}),
          ...(dto.lastName ? { lastName: dto.lastName.trim() } : {}),
          ...(dto.role ? { role: dto.role } : {}),
          ...(dto.designation ? { designation: dto.designation.trim() } : {}),
          ...(dto.qualification ? { qualification: dto.qualification.trim() } : {}),
          ...(dto.phone ? { phone: dto.phone.trim() } : {}),
          ...(dto.email ? { email: dto.email.toLowerCase().trim() } : {}),
          ...(dto.dob !== undefined ? { dob: dto.dob ? new Date(dto.dob) : null } : {}),
          ...(dto.joiningDate ? { joiningDate: new Date(dto.joiningDate) } : {}),
          ...(dto.department ? { department: dto.department.trim() } : {}),
          ...(dto.status ? { status: dto.status } : {}),
        },
        include: {
          user: { select: { id: true, username: true, isActive: true, role: true } },
        },
      });

      await this.auditLogsService.log({
        userId: adminUserId,
        action: 'UPDATE_STAFF',
        module: 'STAFF',
        entityId: id,
        details: { employeeId: staff.employeeId, updatedFields: Object.keys(dto) },
      });

      return updatedStaff;
    });
  }

  async toggleActiveStatus(id: string, adminUserId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!staff) {
      throw new NotFoundException('Staff record not found');
    }

    const newStatus = !staff.user.isActive;
    await this.prisma.user.update({
      where: { id: staff.userId },
      data: { isActive: newStatus },
    });

    await this.auditLogsService.log({
      userId: adminUserId,
      action: 'TOGGLE_STATUS',
      module: 'STAFF',
      entityId: staff.id,
      details: { newActiveStatus: newStatus },
    });

    return {
      message: `Staff member ${newStatus ? 'activated' : 'deactivated'} successfully`,
      isActive: newStatus,
    };
  }

  // ==========================================
  // Teacher Class-Section-Subject Assignments
  // ==========================================

  async getTeacherAssignments(query: { teacherId?: string; sessionId?: string; classId?: string; sectionId?: string }) {
    const where: any = {};
    if (query.teacherId) where.teacherId = query.teacherId;
    if (query.sessionId) where.sessionId = query.sessionId;
    if (query.classId) where.classId = query.classId;
    if (query.sectionId) where.sectionId = query.sectionId;

    return this.prisma.teacherAssignment.findMany({
      where,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        session: { select: { id: true, name: true } },
      },
      orderBy: [{ class: { numericOrder: 'asc' } }, { section: { name: 'asc' } }],
    });
  }

  async assignTeacher(dto: AssignTeacherDto, adminUserId: string) {
    const { teacherId, sessionId } = dto;

    // Verify teacher exists
    const teacher = await this.prisma.staff.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException('Selected teacher not found');

    // Build normalized allocation list
    const targets: Array<{ classId: string; sectionId: string; subjectIds: string[] }> = [];

    if (dto.allocations && dto.allocations.length > 0) {
      for (const item of dto.allocations) {
        const subIds = item.subjectIds?.length
          ? item.subjectIds
          : item.subjectId
          ? [item.subjectId]
          : [];
        if (!subIds.length) {
          throw new BadRequestException('Each allocation must include at least one subject');
        }
        targets.push({
          classId: item.classId,
          sectionId: item.sectionId,
          subjectIds: subIds,
        });
      }
    } else {
      if (!dto.classId || !dto.sectionId) {
        throw new BadRequestException('Class and section are required for teacher allocation');
      }
      const subIds = dto.subjectIds?.length
        ? dto.subjectIds
        : dto.subjectId
        ? [dto.subjectId]
        : [];
      if (!subIds.length) {
        throw new BadRequestException('At least one subject must be selected for assignment');
      }
      targets.push({
        classId: dto.classId,
        sectionId: dto.sectionId,
        subjectIds: subIds,
      });
    }

    // Validate that sections belong to their respective classes
    for (const target of targets) {
      const section = await this.prisma.section.findUnique({
        where: { id: target.sectionId },
        include: { class: true },
      });
      if (!section || section.classId !== target.classId) {
        throw new BadRequestException(`Selected section does not belong to specified class`);
      }
    }

    const createdAssignments = await this.prisma.$transaction(async (tx) => {
      const records = [];
      for (const target of targets) {
        for (const subjectId of target.subjectIds) {
          const record = await tx.teacherAssignment.upsert({
            where: {
              sessionId_classId_sectionId_subjectId: {
                sessionId,
                classId: target.classId,
                sectionId: target.sectionId,
                subjectId,
              },
            },
            update: { teacherId },
            create: {
              teacherId,
              sessionId,
              classId: target.classId,
              sectionId: target.sectionId,
              subjectId,
            },
            include: {
              subject: true,
              class: true,
              section: true,
            },
          });
          records.push(record);
        }
      }
      return records;
    });

    await this.auditLogsService.log({
      userId: adminUserId,
      action: 'ASSIGN_TEACHER',
      module: 'STAFF',
      details: {
        teacherId,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        allocationCount: createdAssignments.length,
      },
    });

    return createdAssignments;
  }

  async updateTeacherAssignment(id: string, dto: UpdateTeacherAssignmentDto, adminUserId: string) {
    const assignment = await this.prisma.teacherAssignment.findUnique({ where: { id } });
    if (!assignment) {
      throw new NotFoundException('Teacher assignment not found');
    }

    const classId = dto.classId || assignment.classId;
    const sectionId = dto.sectionId || assignment.sectionId;

    if (dto.classId || dto.sectionId) {
      const section = await this.prisma.section.findUnique({ where: { id: sectionId } });
      if (!section || section.classId !== classId) {
        throw new BadRequestException('Selected section does not belong to specified class');
      }
    }

    const updated = await this.prisma.teacherAssignment.update({
      where: { id },
      data: {
        ...(dto.teacherId ? { teacherId: dto.teacherId } : {}),
        ...(dto.sessionId ? { sessionId: dto.sessionId } : {}),
        ...(dto.classId ? { classId: dto.classId } : {}),
        ...(dto.sectionId ? { sectionId: dto.sectionId } : {}),
        ...(dto.subjectId ? { subjectId: dto.subjectId } : {}),
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        session: { select: { id: true, name: true } },
      },
    });

    await this.auditLogsService.log({
      userId: adminUserId,
      action: 'UPDATE_TEACHER_ASSIGNMENT',
      module: 'STAFF',
      entityId: id,
      details: {
        teacherId: updated.teacherId,
        class: updated.class.name,
        section: updated.section.name,
        subject: updated.subject.name,
      },
    });

    return updated;
  }

  async removeTeacherAssignment(id: string, adminUserId: string) {
    const assignment = await this.prisma.teacherAssignment.findUnique({ where: { id } });
    if (!assignment) {
      throw new NotFoundException('Teacher assignment not found');
    }

    await this.prisma.teacherAssignment.delete({ where: { id } });

    await this.auditLogsService.log({
      userId: adminUserId,
      action: 'REMOVE_TEACHER_ASSIGNMENT',
      module: 'STAFF',
      entityId: id,
    });

    return { message: 'Teacher assignment removed successfully' };
  }

  // ==========================================
  // Teacher Academic Console & Isolation
  // ==========================================

  async getMyAssignedClasses(teacherUserId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { userId: teacherUserId },
      include: {
        classTeacherOf: {
          include: {
            class: true,
            _count: { select: { students: { where: { status: 'ACTIVE' } } } },
          },
        },
        teacherAssignments: {
          include: {
            class: true,
            section: true,
            subject: true,
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException('Teacher profile not linked to user account');
    }

    // Map of unique classId_sectionId
    const classMap = new Map<string, {
      classId: string;
      className: string;
      numericOrder: number;
      sectionId: string;
      sectionName: string;
      isClassTeacher: boolean;
      subjects: { id: string; name: string; code: string }[];
    }>();

    // 1. If class teacher of a section
    if (staff.classTeacherOf) {
      const sec = staff.classTeacherOf;
      const key = `${sec.classId}_${sec.id}`;
      classMap.set(key, {
        classId: sec.classId,
        className: sec.class.name,
        numericOrder: sec.class.numericOrder,
        sectionId: sec.id,
        sectionName: sec.name,
        isClassTeacher: true,
        subjects: [],
      });
    }

    // 2. Add subject-assigned classes
    for (const a of staff.teacherAssignments) {
      const key = `${a.classId}_${a.sectionId}`;
      if (!classMap.has(key)) {
        classMap.set(key, {
          classId: a.classId,
          className: a.class.name,
          numericOrder: a.class.numericOrder,
          sectionId: a.sectionId,
          sectionName: a.section.name,
          isClassTeacher: false,
          subjects: [],
        });
      }
      const item = classMap.get(key)!;
      if (!item.subjects.some((s) => s.id === a.subject.id)) {
        item.subjects.push({
          id: a.subject.id,
          name: a.subject.name,
          code: a.subject.code,
        });
      }
    }

    // Calculate student counts for each class
    const results = [];
    for (const item of Array.from(classMap.values())) {
      const count = await this.prisma.student.count({
        where: {
          classId: item.classId,
          sectionId: item.sectionId,
          status: 'ACTIVE',
        },
      });

      results.push({
        ...item,
        studentCount: count,
      });
    }

    results.sort((a, b) => a.numericOrder - b.numericOrder || a.sectionName.localeCompare(b.sectionName));
    return results;
  }

  async getMyAssignedSubjects(teacherUserId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { userId: teacherUserId },
      include: {
        teacherAssignments: {
          include: {
            class: true,
            section: true,
            subject: true,
          },
        },
        assignedSubjects: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException('Teacher profile not linked to user account');
    }

    const subjectMap = new Map<string, {
      id: string;
      name: string;
      code: string;
      type: string;
      isOptional: boolean;
      assignedClasses: {
        classId: string;
        className: string;
        sectionId?: string;
        sectionName?: string;
      }[];
      totalSections: number;
      studentCount: number;
    }>();

    // 1. Process from teacherAssignments (direct section-level allocations)
    for (const a of staff.teacherAssignments) {
      if (!subjectMap.has(a.subjectId)) {
        subjectMap.set(a.subjectId, {
          id: a.subject.id,
          name: a.subject.name,
          code: a.subject.code,
          type: a.subject.type,
          isOptional: a.subject.isOptional,
          assignedClasses: [],
          totalSections: 0,
          studentCount: 0,
        });
      }
      const item = subjectMap.get(a.subjectId)!;
      const alreadyHas = item.assignedClasses.some(
        (c) => c.classId === a.classId && c.sectionId === a.sectionId,
      );
      if (!alreadyHas) {
        item.assignedClasses.push({
          classId: a.classId,
          className: a.class.name,
          sectionId: a.sectionId,
          sectionName: a.section.name,
        });
      }
    }

    // 2. Process from assignedSubjects (classSubject assignments)
    for (const cs of staff.assignedSubjects) {
      if (!subjectMap.has(cs.subjectId)) {
        subjectMap.set(cs.subjectId, {
          id: cs.subject.id,
          name: cs.subject.name,
          code: cs.subject.code,
          type: cs.subject.type,
          isOptional: cs.subject.isOptional,
          assignedClasses: [],
          totalSections: 0,
          studentCount: 0,
        });
      }
      const item = subjectMap.get(cs.subjectId)!;
      const alreadyHas = item.assignedClasses.some((c) => c.classId === cs.classId);
      if (!alreadyHas) {
        item.assignedClasses.push({
          classId: cs.classId,
          className: cs.class.name,
        });
      }
    }

    // Compute live student counts
    const results = [];
    for (const entry of Array.from(subjectMap.values())) {
      let totalStudents = 0;
      for (const ac of entry.assignedClasses) {
        if (ac.sectionId) {
          const count = await this.prisma.student.count({
            where: {
              classId: ac.classId,
              sectionId: ac.sectionId,
              status: 'ACTIVE',
            },
          });
          totalStudents += count;
        } else {
          const count = await this.prisma.student.count({
            where: {
              classId: ac.classId,
              status: 'ACTIVE',
            },
          });
          totalStudents += count;
        }
      }
      entry.totalSections = entry.assignedClasses.length;
      entry.studentCount = totalStudents;
      results.push(entry);
    }

    results.sort((a, b) => a.name.localeCompare(b.name));
    return results;
  }

  async getClassWorkspace(classId: string, sectionId: string, currentUser: { id: string; role: Role }) {
    // 1. Security Check: verify teacher is actually assigned to this class and section
    if (currentUser.role === Role.TEACHER) {
      const staff = await this.prisma.staff.findUnique({
        where: { userId: currentUser.id },
      });
      if (!staff) {
        throw new ForbiddenException('No teacher record found for your user account.');
      }

      // Check if Class Teacher
      const section = await this.prisma.section.findUnique({
        where: { id: sectionId },
      });
      const isClassTeacher = section?.classTeacherId === staff.id;

      // Check if Subject Teacher
      const assignmentCount = await this.prisma.teacherAssignment.count({
        where: {
          teacherId: staff.id,
          classId,
          sectionId,
        },
      });

      if (!isClassTeacher && assignmentCount === 0) {
        throw new ForbiddenException(
          'Access denied: You are not assigned to teach or manage this class and section.',
        );
      }
    }

    // 2. Fetch section, class, and active session
    const currentSession = await this.prisma.academicSession.findFirst({ where: { isCurrent: true } });

    const [section, roster, timetable, homeworks, examSchedules, assignments] = await Promise.all([
      this.prisma.section.findUnique({
        where: { id: sectionId },
        include: {
          class: true,
          classTeacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        },
      }),
      this.prisma.student.findMany({
        where: { classId, sectionId, status: 'ACTIVE' },
        include: {
          parent: { select: { fatherName: true, primaryPhone: true, email: true } },
        },
        orderBy: { rollNo: 'asc' },
      }),
      this.prisma.timetablePeriod.findMany({
        where: { classId, sectionId, ...(currentSession ? { sessionId: currentSession.id } : {}) },
        include: {
          subject: true,
          teacher: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { periodNo: 'asc' }],
      }),
      this.prisma.homework.findMany({
        where: { classId, sectionId, isArchived: false },
        include: {
          subject: true,
          teacher: { select: { firstName: true, lastName: true } },
          student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: { dueDate: 'desc' },
      }),
      this.prisma.examSchedule.findMany({
        where: { classId },
        include: {
          exam: true,
          subject: true,
          _count: { select: { results: true } },
        },
        orderBy: { examDate: 'desc' },
      }),
      this.prisma.teacherAssignment.findMany({
        where: { classId, sectionId },
        include: {
          subject: true,
          teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        },
      }),
    ]);

    if (!section || section.classId !== classId) {
      throw new NotFoundException('Class or Section not found');
    }

    return {
      class: section.class,
      section: {
        id: section.id,
        name: section.name,
        capacity: section.capacity,
        classTeacher: section.classTeacher,
      },
      roster,
      students: roster,
      timetable,
      homeworks,
      homework: homeworks,
      examSchedules,
      exams: examSchedules,
      assignments,
      subjects: assignments.map((a) => a.subject),
    };
  }
}
