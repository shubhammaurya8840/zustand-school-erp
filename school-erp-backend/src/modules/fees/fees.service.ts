import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RecordFeePaymentDto, ReversePaymentDto, CreateFeeStructureDto } from './dto/record-payment.dto';
import { FeePaymentStatus } from '@prisma/client';

@Injectable()
export class FeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getFeeHeads() {
    return this.prisma.feeHead.findMany({ orderBy: { name: 'asc' } });
  }

  async getFeeStructures(sessionId?: string, classId?: string) {
    const where: any = {};
    if (sessionId) where.sessionId = sessionId;
    if (classId) where.classId = classId;

    return this.prisma.feeStructure.findMany({
      where,
      include: {
        session: true,
        class: true,
        feeHead: true,
      },
      orderBy: [{ class: { numericOrder: 'asc' } }, { dueDate: 'asc' }],
    });
  }

  async createFeeStructure(dto: CreateFeeStructureDto) {
    return this.prisma.feeStructure.upsert({
      where: {
        sessionId_classId_feeHeadId: {
          sessionId: dto.sessionId,
          classId: dto.classId,
          feeHeadId: dto.feeHeadId,
        },
      },
      update: {
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        frequency: dto.frequency,
      },
      create: {
        sessionId: dto.sessionId,
        classId: dto.classId,
        feeHeadId: dto.feeHeadId,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        frequency: dto.frequency,
      },
      include: { class: true, feeHead: true },
    });
  }

  async getStudentFeeLedger(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        section: true,
        parent: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student record not found');
    }

    const feeLedgers = await this.prisma.studentFee.findMany({
      where: { studentId },
      include: {
        session: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          include: {
            recordedBy: { select: { username: true, role: true } },
            reversedBy: { select: { username: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { student, feeLedgers };
  }

  async recordPayment(dto: RecordFeePaymentDto, actorUserId: string) {
    const currentSession = await this.prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });
    if (!currentSession) {
      throw new BadRequestException('No active academic session found for recording fees');
    }

    // Resolve student by id or admissionNo
    let student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) {
      student = await this.prisma.student.findUnique({ where: { admissionNo: dto.studentId } });
    }
    if (!student) {
      throw new NotFoundException(`Student not found for "${dto.studentId}"`);
    }
    const resolvedStudentId = student.id;

    // Find student fee record
    let studentFee = await this.prisma.studentFee.findUnique({
      where: {
        studentId_sessionId: {
          studentId: resolvedStudentId,
          sessionId: currentSession.id,
        },
      },
    });

    if (!studentFee) {
      // Create student fee record if not existing
      studentFee = await this.prisma.studentFee.create({
        data: {
          studentId: resolvedStudentId,
          sessionId: currentSession.id,
          totalAmount: dto.amount,
          paidAmount: 0,
          dueAmount: dto.amount,
          status: FeePaymentStatus.PENDING,
        },
      });
    }

    // Generate unique sequential receipt number
    const count = await this.prisma.feePayment.count();
    const receiptNo = `REC-2026-${String(count + 1001).padStart(5, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.feePayment.create({
        data: {
          receiptNo,
          studentFeeId: studentFee.id,
          studentId: resolvedStudentId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          referenceNo: dto.referenceNo || null,
          remarks: dto.remarks || null,
          recordedById: actorUserId,
        },
        include: {
          student: {
            include: { class: true, section: true, parent: true },
          },
          recordedBy: {
            select: { id: true, username: true, email: true, role: true },
          },
        },
      });

      // Update student fee totals
      const newPaid = Number(studentFee.paidAmount) + Number(dto.amount);
      const total = Number(studentFee.totalAmount);
      const newDue = Math.max(0, total - newPaid - Number(studentFee.discountAmount));
      const newStatus =
        newDue <= 0
          ? FeePaymentStatus.PAID
          : newPaid > 0
          ? FeePaymentStatus.PARTIAL
          : FeePaymentStatus.PENDING;

      await tx.studentFee.update({
        where: { id: studentFee.id },
        data: {
          paidAmount: newPaid,
          dueAmount: newDue,
          status: newStatus,
        },
      });

      await this.auditLogsService.log({
        userId: actorUserId,
        action: 'COLLECT_FEE',
        module: 'FEES',
        entityId: payment.id,
        details: {
          receiptNo: payment.receiptNo,
          amount: payment.amount,
          method: payment.paymentMethod,
          studentId: dto.studentId,
        },
      });

      return payment;
    });
  }

  async reversePayment(paymentId: string, dto: ReversePaymentDto, actorUserId: string) {
    const payment = await this.prisma.feePayment.findUnique({
      where: { id: paymentId },
      include: { studentFee: true },
    });

    if (!payment) {
      throw new NotFoundException('Fee payment receipt not found');
    }

    if (payment.isReversed) {
      throw new BadRequestException('This payment receipt has already been reversed');
    }

    return this.prisma.$transaction(async (tx) => {
      const reversed = await tx.feePayment.update({
        where: { id: paymentId },
        data: {
          isReversed: true,
          reversalReason: dto.reversalReason,
          reversedAt: new Date(),
          reversedById: actorUserId,
        },
      });

      // Deduct from paid and add back to due
      const sf = payment.studentFee;
      const newPaid = Math.max(0, Number(sf.paidAmount) - Number(payment.amount));
      const total = Number(sf.totalAmount);
      const newDue = total - newPaid - Number(sf.discountAmount);
      const newStatus =
        newDue <= 0
          ? FeePaymentStatus.PAID
          : newPaid > 0
          ? FeePaymentStatus.PARTIAL
          : FeePaymentStatus.PENDING;

      await tx.studentFee.update({
        where: { id: sf.id },
        data: {
          paidAmount: newPaid,
          dueAmount: newDue,
          status: newStatus,
        },
      });

      await this.auditLogsService.log({
        userId: actorUserId,
        action: 'REVERSE_FEE',
        module: 'FEES',
        entityId: paymentId,
        details: { receiptNo: payment.receiptNo, amount: payment.amount, reason: dto.reversalReason },
      });

      return reversed;
    });
  }

  async getDefaulters(classId?: string) {
    const where: any = {
      dueAmount: { gt: 0 },
    };
    if (classId) {
      where.student = { classId };
    }

    return this.prisma.studentFee.findMany({
      where,
      include: {
        student: {
          include: {
            class: true,
            section: true,
            parent: { select: { fatherName: true, primaryPhone: true, email: true } },
          },
        },
        session: true,
      },
      orderBy: { dueAmount: 'desc' },
    });
  }

  async getRecentReceipts(limit = 10) {
    return this.prisma.feePayment.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            class: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
        recordedBy: {
          select: { username: true, role: true },
        },
      },
    });
  }
}

