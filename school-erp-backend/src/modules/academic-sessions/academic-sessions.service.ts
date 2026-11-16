import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAcademicSessionDto } from './dto/create-session.dto';

@Injectable()
export class AcademicSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.academicSession.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: {
            studentEnrollment: true,
            exams: true,
            feeStructures: true,
          },
        },
      },
    });
  }

  async getCurrent() {
    const current = await this.prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });
    if (!current) {
      // Fallback to latest
      return this.prisma.academicSession.findFirst({
        orderBy: { startDate: 'desc' },
      });
    }
    return current;
  }

  async create(dto: CreateAcademicSessionDto) {
    const existing = await this.prisma.academicSession.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new BadRequestException(`Academic session with name "${dto.name}" already exists`);
    }

    if (dto.isCurrent) {
      // Deactivate others
      await this.prisma.academicSession.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const session = await this.prisma.academicSession.create({
      data: {
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isCurrent: dto.isCurrent ?? false,
      },
    });

    if (dto.isCurrent) {
      const settings = await this.prisma.schoolSettings.findFirst();
      if (settings) {
        await this.prisma.schoolSettings.update({
          where: { id: settings.id },
          data: { currentSessionId: session.id },
        });
      }
    }

    return session;
  }

  async setCurrent(id: string) {
    const target = await this.prisma.academicSession.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('Academic session not found');
    }

    await this.prisma.academicSession.updateMany({
      data: { isCurrent: false },
    });

    const updated = await this.prisma.academicSession.update({
      where: { id },
      data: { isCurrent: true },
    });

    const settings = await this.prisma.schoolSettings.findFirst();
    if (settings) {
      await this.prisma.schoolSettings.update({
        where: { id: settings.id },
        data: { currentSessionId: updated.id },
      });
    }

    return updated;
  }

  async promoteStudents(data: {
    fromSessionId: string;
    toSessionId: string;
    fromClassId: string;
    toClassId: string;
    fromSectionId: string;
    toSectionId: string;
  }) {
    const students = await this.prisma.student.findMany({
      where: {
        classId: data.fromClassId,
        sectionId: data.fromSectionId,
        status: 'ACTIVE',
      },
    });

    let promotedCount = 0;
    for (const student of students) {
      await this.prisma.$transaction(async (tx) => {
        // Record enrollment in target session
        await tx.studentClassEnrollment.upsert({
          where: {
            studentId_sessionId: {
              studentId: student.id,
              sessionId: data.toSessionId,
            },
          },
          update: {
            classId: data.toClassId,
            sectionId: data.toSectionId,
          },
          create: {
            studentId: student.id,
            sessionId: data.toSessionId,
            classId: data.toClassId,
            sectionId: data.toSectionId,
          },
        });

        // Update current student record
        await tx.student.update({
          where: { id: student.id },
          data: {
            classId: data.toClassId,
            sectionId: data.toSectionId,
          },
        });
      });
      promotedCount++;
    }

    return {
      message: `Successfully promoted ${promotedCount} students`,
      promotedCount,
    };
  }
}

