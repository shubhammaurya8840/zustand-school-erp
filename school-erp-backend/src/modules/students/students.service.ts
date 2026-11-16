import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateStudentDto, UpdateStudentDto } from './dto/create-student.dto';
import { StudentStatus, Role } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(query: {
    classId?: string;
    sectionId?: string;
    status?: StudentStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.classId) where.classId = query.classId;
    if (query.sectionId) where.sectionId = query.sectionId;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { admissionNo: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, students] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          class: { select: { id: true, name: true, code: true } },
          section: { select: { id: true, name: true } },
          parent: { select: { id: true, fatherName: true, primaryPhone: true, email: true } },
          user: { select: { id: true, username: true, email: true, isActive: true, mustChangePassword: true } },
          fees: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { totalAmount: true, paidAmount: true, dueAmount: true, status: true },
          },
        },
        orderBy: [{ classId: 'asc' }, { sectionId: 'asc' }, { rollNo: 'asc' }],
      }),
    ]);

    return { total, page, limit, students };
  }

  async getMe(studentUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
      include: {
        class: true,
        section: true,
        parent: true,
        user: { select: { id: true, username: true, email: true, isActive: true, mustChangePassword: true } },
        fees: {
          include: {
            session: true,
            payments: { orderBy: { createdAt: 'desc' } },
          },
        },
        attendance: {
          take: 60,
          orderBy: { date: 'desc' },
        },
        examResults: {
          where: { isPublished: true },
          include: {
            examSchedule: {
              include: { exam: true, subject: true },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Authenticated student profile not found in database');
    }

    return student;
  }

  async findOne(id: string, currentUser?: { id: string; role: Role }) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        section: true,
        parent: true,
        user: { select: { id: true, username: true, email: true, isActive: true, mustChangePassword: true } },
        fees: {
          include: {
            session: true,
            payments: { orderBy: { createdAt: 'desc' } },
          },
        },
        attendance: {
          take: 30,
          orderBy: { date: 'desc' },
        },
        examResults: {
          where: { isPublished: true },
          include: {
            examSchedule: {
              include: { exam: true, subject: true },
            },
          },
        },
        bookIssues: {
          include: { book: true },
          orderBy: { issuedAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student record not found for ID "${id}"`);
    }

    // Strict security check for STUDENT and PARENT roles
    if (currentUser) {
      if (currentUser.role === Role.STUDENT && student.userId !== currentUser.id) {
        throw new ForbiddenException('Access denied: You may only view your own student records.');
      }
      if (currentUser.role === Role.PARENT && student.parent?.userId !== currentUser.id) {
        throw new ForbiddenException('Access denied: You may only view records for your registered children.');
      }
    }

    return student;
  }

  formatDobToPassword(dob: Date | string): string {
    const d = new Date(dob);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    return `${day}${month}${year}`;
  }

  async create(dto: CreateStudentDto, actorUserId: string) {
    const admissionNoClean = dto.admissionNo.trim();

    const existingAdm = await this.prisma.student.findUnique({
      where: { admissionNo: admissionNoClean },
    });
    if (existingAdm) {
      throw new BadRequestException(`Admission number "${dto.admissionNo}" is already in use`);
    }

    // Check duplicate roll number within same class and section
    const existingRoll = await this.prisma.student.findUnique({
      where: {
        classId_sectionId_rollNo: {
          classId: dto.classId,
          sectionId: dto.sectionId,
          rollNo: dto.rollNo,
        },
      },
    });
    if (existingRoll) {
      throw new BadRequestException(`Roll number ${dto.rollNo} already assigned in this class and section`);
    }

    // Prepare credentials for user account creation
    const dobPassword = this.formatDobToPassword(dto.dob);
    const studentTempPass = dto.studentPassword?.trim() || dobPassword;
    const passwordHash = await bcrypt.hash(studentTempPass, 12);
    const username = admissionNoClean;
    const email = `${admissionNoClean.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.zustandpublicschool.edu.in`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create User account atomically in transaction
      const user = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
          role: Role.STUDENT,
          isActive: true,
          mustChangePassword: true,
        },
      });

      // 2. Create Student record linked to User
      const student = await tx.student.create({
        data: {
          admissionNo: admissionNoClean,
          rollNo: dto.rollNo,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          dob: new Date(dto.dob),
          gender: dto.gender,
          bloodGroup: dto.bloodGroup || null,
          address: dto.address,
          emergencyContact: dto.emergencyContact,
          photoUrl: dto.photoUrl || null,
          classId: dto.classId,
          sectionId: dto.sectionId,
          parentId: dto.parentId,
          userId: user.id,
          status: 'ACTIVE',
        },
        include: {
          class: true,
          section: true,
          parent: true,
        },
      });

      // 3. Get current academic session and create student fee ledger entry
      const currentSession = await tx.academicSession.findFirst({ where: { isCurrent: true } });
      if (currentSession) {
        // Calculate class fee total
        const classFees = await tx.feeStructure.findMany({
          where: { classId: dto.classId, sessionId: currentSession.id },
        });
        const totalFee = classFees.reduce((acc, f) => acc + Number(f.amount), 0);

        await tx.studentFee.create({
          data: {
            studentId: student.id,
            sessionId: currentSession.id,
            totalAmount: totalFee,
            dueAmount: totalFee,
            paidAmount: 0,
            status: 'PENDING',
          },
        });

        // Record initial enrollment
        await tx.studentClassEnrollment.create({
          data: {
            studentId: student.id,
            sessionId: currentSession.id,
            classId: dto.classId,
            sectionId: dto.sectionId,
          },
        });
      }

      await this.auditLogsService.log({
        userId: actorUserId,
        action: 'ADMISSION',
        module: 'STUDENTS',
        entityId: student.id,
        details: { admissionNo: student.admissionNo, name: `${student.firstName} ${student.lastName}` },
      });

      return {
        ...student,
        loginCredentials: {
          admissionNo: student.admissionNo,
          username: user.username,
          temporaryPassword: studentTempPass,
        },
      };
    });
  }

  async update(id: string, dto: UpdateStudentDto, actorUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });
    if (!student) {
      throw new NotFoundException('Student record not found');
    }

    const { totalFee, discountAmount, dob, ...restData } = dto;
    const dataToUpdate: any = { ...restData };
    if (dob) {
      dataToUpdate.dob = new Date(dob);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedStudent = await tx.student.update({
        where: { id },
        data: dataToUpdate,
        include: { class: true, section: true, parent: true },
      });

      if (totalFee !== undefined || discountAmount !== undefined) {
        const currentSession = await tx.academicSession.findFirst({
          where: { isCurrent: true },
        });

        if (currentSession) {
          const existingFee = await tx.studentFee.findUnique({
            where: {
              studentId_sessionId: {
                studentId: id,
                sessionId: currentSession.id,
              },
            },
          });

          if (existingFee) {
            const newTotal = totalFee !== undefined ? Number(totalFee) : Number(existingFee.totalAmount);
            const newDiscount = discountAmount !== undefined ? Number(discountAmount) : Number(existingFee.discountAmount);
            const paid = Number(existingFee.paidAmount);
            const netPayable = Math.max(0, newTotal - newDiscount);
            const newDue = Math.max(0, netPayable - paid);
            const status = paid >= netPayable ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING';

            await tx.studentFee.update({
              where: { id: existingFee.id },
              data: {
                totalAmount: newTotal,
                discountAmount: newDiscount,
                dueAmount: newDue,
                status,
              },
            });
          } else {
            const tot = totalFee !== undefined ? Number(totalFee) : 0;
            const disc = discountAmount !== undefined ? Number(discountAmount) : 0;
            const net = Math.max(0, tot - disc);
            await tx.studentFee.create({
              data: {
                studentId: id,
                sessionId: currentSession.id,
                totalAmount: tot,
                discountAmount: disc,
                dueAmount: net,
                paidAmount: 0,
                status: 'PENDING',
              },
            });
          }
        }
      }

      return updatedStudent;
    });

    await this.auditLogsService.log({
      userId: actorUserId,
      action: 'UPDATE',
      module: 'STUDENTS',
      entityId: id,
      details: dto,
    });

    return updated;
  }

  async resetPassword(studentId: string, newPassword?: string, actorUserId?: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student record not found');
    }

    const passwordToSet = newPassword?.trim() || (student.dob ? this.formatDobToPassword(student.dob) : `Student@${Math.floor(1000 + Math.random() * 9000)}`);
    const passwordHash = await bcrypt.hash(passwordToSet, 12);

    if (student.userId) {
      await this.prisma.user.update({
        where: { id: student.userId },
        data: {
          passwordHash,
          mustChangePassword: true,
          isActive: true,
        },
      });
    } else {
      // Create user if student previously had none
      const username = student.admissionNo.trim();
      const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.zustandpublicschool.edu.in`;

      const newUser = await this.prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          role: Role.STUDENT,
          isActive: true,
          mustChangePassword: true,
        },
      });

      await this.prisma.student.update({
        where: { id: student.id },
        data: { userId: newUser.id },
      });
    }

    if (actorUserId) {
      await this.auditLogsService.log({
        userId: actorUserId,
        action: 'RESET_STUDENT_PASSWORD',
        module: 'STUDENTS',
        entityId: student.id,
        details: { admissionNo: student.admissionNo },
      });
    }

    return {
      message: `Password reset successfully for student ${student.firstName} (${student.admissionNo})`,
      temporaryPassword: passwordToSet,
    };
  }

  async delete(id: string, actorUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        fees: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student record not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Delete homework submissions
      await tx.homeworkSubmission.deleteMany({ where: { studentId: id } });
      // 2. Delete exam results
      await tx.examResult.deleteMany({ where: { studentId: id } });
      // 3. Delete attendance
      await tx.studentAttendance.deleteMany({ where: { studentId: id } });
      // 4. Delete fee payments & fees
      for (const fee of student.fees || []) {
        await tx.feePayment.deleteMany({ where: { studentFeeId: fee.id } });
      }
      await tx.studentFee.deleteMany({ where: { studentId: id } });
      // 5. Delete library book issues
      await tx.bookIssue.deleteMany({ where: { studentId: id } });
      // 6. Delete class enrollments
      await tx.studentClassEnrollment.deleteMany({ where: { studentId: id } });
      // 7. Delete student record
      await tx.student.delete({ where: { id } });
      // 8. Delete user login account if linked
      if (student.userId) {
        await tx.user.delete({ where: { id: student.userId } });
      }

      await this.auditLogsService.log({
        userId: actorUserId,
        action: 'DELETE',
        module: 'STUDENTS',
        entityId: id,
        details: {
          admissionNo: student.admissionNo,
          name: `${student.firstName} ${student.lastName}`,
        },
      });

      return {
        success: true,
        message: `Scholar ${student.firstName} ${student.lastName} (${student.admissionNo}) and associated portal account removed.`,
      };
    });
  }
}
