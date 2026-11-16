import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubjectDto, AssignSubjectToClassDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.subject.findMany({
      orderBy: { name: 'asc' },
      include: {
        classSubjects: {
          include: {
            class: true,
            teacher: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  async create(dto: CreateSubjectDto) {
    const existing = await this.prisma.subject.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException(`Subject with code "${dto.code}" already exists`);
    }

    return this.prisma.subject.create({
      data: {
        name: dto.name,
        code: dto.code.toUpperCase().trim(),
        type: dto.type || 'THEORY',
        isOptional: dto.isOptional ?? false,
      },
    });
  }

  async assignToClass(dto: AssignSubjectToClassDto) {
    return this.prisma.classSubject.upsert({
      where: {
        classId_subjectId: {
          classId: dto.classId,
          subjectId: dto.subjectId,
        },
      },
      update: {
        teacherId: dto.teacherId || null,
        periodsPerWeek: dto.periodsPerWeek ?? 5,
      },
      create: {
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId || null,
        periodsPerWeek: dto.periodsPerWeek ?? 5,
      },
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
    });
  }
}

