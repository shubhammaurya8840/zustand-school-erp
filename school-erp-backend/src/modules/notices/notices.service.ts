import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class NoticesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(query: { userRole?: Role; category?: string; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { isArchived: false };
    if (query.category) where.category = query.category;

    if (query.userRole && query.userRole !== Role.SCHOOL_ADMIN) {
      const audiences: string[] = ['ALL'];
      if (query.userRole === Role.TEACHER) audiences.push('TEACHERS', 'STAFF');
      if (query.userRole === Role.ACCOUNTANT || query.userRole === Role.LIBRARIAN) audiences.push('STAFF');
      if (query.userRole === Role.STUDENT) audiences.push('STUDENTS');
      if (query.userRole === Role.PARENT) audiences.push('PARENTS');

      where.targetAudience = { in: audiences };
    }

    const [total, notices] = await Promise.all([
      this.prisma.notice.count({ where }),
      this.prisma.notice.findMany({
        where,
        skip,
        take: limit,
        include: {
          publishedBy: {
            select: { id: true, username: true, role: true },
          },
        },
        orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
      }),
    ]);

    return { total, page, limit, notices };
  }

  async findOne(id: string, userId?: string) {
    const notice = await this.prisma.notice.findUnique({
      where: { id },
      include: {
        publishedBy: {
          select: { id: true, username: true, role: true },
        },
      },
    });

    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    if (userId) {
      await this.prisma.noticeRead.upsert({
        where: {
          noticeId_userId: { noticeId: id, userId },
        },
        update: { readAt: new Date() },
        create: { noticeId: id, userId },
      });
    }

    return notice;
  }

  async create(dto: CreateNoticeDto, publisherUserId: string) {
    const notice = await this.prisma.notice.create({
      data: {
        title: dto.title.trim(),
        content: dto.content,
        category: dto.category,
        priority: dto.priority,
        targetAudience: dto.targetAudience,
        targetClassId: dto.targetClassId || null,
        targetSectionId: dto.targetSectionId || null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        publishedById: publisherUserId,
      },
      include: { publishedBy: { select: { username: true, role: true } } },
    });

    await this.auditLogsService.log({
      userId: publisherUserId,
      action: 'PUBLISH_NOTICE',
      module: 'NOTICES',
      entityId: notice.id,
      details: { title: notice.title, audience: notice.targetAudience },
    });

    return notice;
  }

  async archive(id: string, adminUserId: string) {
    const notice = await this.prisma.notice.findUnique({ where: { id } });
    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    const updated = await this.prisma.notice.update({
      where: { id },
      data: { isArchived: true },
    });

    await this.auditLogsService.log({
      userId: adminUserId,
      action: 'ARCHIVE_NOTICE',
      module: 'NOTICES',
      entityId: id,
    });

    return updated;
  }
}

