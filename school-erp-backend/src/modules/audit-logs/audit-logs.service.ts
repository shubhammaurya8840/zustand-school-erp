import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateAuditLogParams {
  userId?: string;
  action: string;
  module: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: CreateAuditLogParams) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          module: params.module,
          entityId: params.entityId,
          detailsJson: params.details || {},
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (e) {
      // Never let audit log failure crash the primary business logic
      console.error('Failed to write audit log:', e.message);
      return null;
    }
  }

  async findAll(query: { module?: string; action?: string; limit?: number; page?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.module) where.module = query.module;
    if (query.action) where.action = query.action;

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, email: true, role: true },
          },
        },
      }),
    ]);

    return { total, page, limit, logs };
  }
}

