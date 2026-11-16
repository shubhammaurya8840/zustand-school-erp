import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassDto, CreateSectionDto } from './dto/create-class.dto';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.class.findMany({
      orderBy: { numericOrder: 'asc' },
      include: {
        sections: {
          orderBy: { name: 'asc' },
          include: {
            classTeacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
            _count: {
              select: { students: true },
            },
          },
        },
        classSubjects: {
          include: {
            subject: true,
            teacher: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        _count: {
          select: { students: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            classTeacher: true,
            students: {
              where: { status: 'ACTIVE' },
              orderBy: { rollNo: 'asc' },
            },
          },
        },
        classSubjects: {
          include: {
            subject: true,
            teacher: true,
          },
        },
      },
    });
    if (!cls) {
      throw new NotFoundException(`Class with ID "${id}" not found`);
    }
    return cls;
  }

  async create(dto: CreateClassDto) {
    const cleanName = dto.name.trim();
    const cleanCode = dto.code.trim().toUpperCase();

    const existing = await this.prisma.class.findFirst({
      where: {
        OR: [{ name: cleanName }, { code: cleanCode }, { numericOrder: dto.numericOrder }],
      },
    });
    if (existing) {
      if (existing.name.toLowerCase() === cleanName.toLowerCase()) {
        throw new BadRequestException(`Class already exists: A class named "${cleanName}" is already registered.`);
      }
      if (existing.code.toUpperCase() === cleanCode) {
        throw new BadRequestException(`Class already exists: A class with code "${cleanCode}" is already registered.`);
      }
      throw new BadRequestException(`Class already exists: Numeric order ${dto.numericOrder} is already assigned to ${existing.name}.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const createdClass = await tx.class.create({
        data: {
          name: cleanName,
          code: cleanCode,
          numericOrder: dto.numericOrder,
          stream: dto.stream ? dto.stream.trim() : null,
        },
      });

      // Section is optional: only create if provided
      if (dto.initialSection && dto.initialSection.trim().length > 0) {
        const secName = dto.initialSection.trim().toUpperCase();
        await tx.section.create({
          data: {
            classId: createdClass.id,
            name: secName,
            capacity: dto.initialCapacity ?? 40,
          },
        });
      }

      return tx.class.findUnique({
        where: { id: createdClass.id },
        include: {
          sections: {
            include: {
              classTeacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
              _count: { select: { students: true } },
            },
          },
          _count: { select: { students: true } },
        },
      });
    });
  }

  async addSection(classId: string, dto: CreateSectionDto) {
    const cls = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!cls) {
      throw new NotFoundException('Class not found');
    }

    const secName = dto.name.toUpperCase().trim();
    const existingSection = await this.prisma.section.findUnique({
      where: {
        classId_name: {
          classId,
          name: secName,
        },
      },
    });
    if (existingSection) {
      throw new BadRequestException(`Section already exists: Section "${secName}" is already registered for ${cls.name}.`);
    }

    return this.prisma.section.create({
      data: {
        classId,
        name: secName,
        capacity: dto.capacity ?? 40,
        classTeacherId: dto.classTeacherId || null,
      },
      include: {
        classTeacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        _count: { select: { students: true } },
      },
    });
  }

  async assignClassTeacher(sectionId: string, staffId: string | null) {
    const section = await this.prisma.section.findUnique({ where: { id: sectionId } });
    if (!section) {
      throw new NotFoundException('Section not found');
    }

    return this.prisma.section.update({
      where: { id: sectionId },
      data: { classTeacherId: staffId },
      include: { classTeacher: true },
    });
  }

  async deleteSection(sectionId: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        class: true,
        _count: {
          select: {
            students: true,
            enrollments: true,
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID "${sectionId}" not found`);
    }

    if (section._count.students > 0 || section._count.enrollments > 0) {
      const count = section._count.students || section._count.enrollments;
      throw new BadRequestException(
        `Cannot delete Section "${section.name}": ${count} student(s) are currently enrolled in this section. Please reassign or transfer students first.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.timetablePeriod.deleteMany({ where: { sectionId } });
      await tx.studentAttendance.deleteMany({ where: { sectionId } });
      await tx.teacherAssignment.deleteMany({ where: { sectionId } });
      await tx.homework.deleteMany({ where: { sectionId } });
      await tx.section.delete({ where: { id: sectionId } });
      return { success: true, message: `Section "${section.name}" of ${section.class.name} deleted successfully` };
    });
  }
}

