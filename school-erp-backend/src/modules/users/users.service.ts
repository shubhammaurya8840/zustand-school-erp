import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(query: { role?: Role; search?: string; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { username: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, page, limit, users };
  }

  async toggleActive(userId: string, adminUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newStatus = !user.isActive;
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: newStatus },
      select: { id: true, username: true, email: true, role: true, isActive: true },
    });

    await this.auditLogsService.log({
      userId: adminUserId,
      action: 'TOGGLE_USER_ACTIVE',
      module: 'USERS',
      entityId: userId,
      details: { newActiveStatus: newStatus },
    });

    return updated;
  }

  async adminResetPassword(userId: string, newPlainPass: string, adminUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(newPlainPass, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.auditLogsService.log({
      userId: adminUserId,
      action: 'ADMIN_RESET_PASSWORD',
      module: 'USERS',
      entityId: userId,
    });

    return { message: `Password for user ${user.username} has been reset by Administrator.` };
  }
}

