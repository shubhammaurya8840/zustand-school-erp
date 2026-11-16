import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class ParentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(query: { search?: string; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { fatherName: { contains: query.search, mode: 'insensitive' } },
        { motherName: { contains: query.search, mode: 'insensitive' } },
        { primaryPhone: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, parents] = await Promise.all([
      this.prisma.parent.count({ where }),
      this.prisma.parent.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, username: true, isActive: true, lastLoginAt: true } },
          children: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNo: true,
              rollNo: true,
              status: true,
              class: { select: { id: true, name: true } },
              section: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { fatherName: 'asc' },
      }),
    ]);

    return { total, page, limit, parents };
  }

  async findOne(id: string, currentUser?: { id: string; role: Role }) {
    const parent = await this.prisma.parent.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, isActive: true, lastLoginAt: true } },
        children: {
          include: {
            class: true,
            section: true,
            fees: {
              include: { session: true },
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
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent record not found');
    }

    // Security check: if caller is a PARENT, verify it matches their own parent profile
    if (currentUser && currentUser.role === Role.PARENT && parent.userId !== currentUser.id) {
      throw new ForbiddenException('Access denied: You may only access your own family and children records.');
    }

    return parent;
  }

  async create(dto: CreateParentDto, adminUserId: string) {
    const cleanEmail = dto.email.toLowerCase().trim();
    const cleanPhone = dto.primaryPhone.trim();

    // Check duplicate parent by email or phone
    const existingParent = await this.prisma.parent.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { primaryPhone: cleanPhone },
        ],
      },
    });
    if (existingParent) {
      if (existingParent.email.toLowerCase() === cleanEmail) {
        throw new BadRequestException(`Parent account already exists with email: ${cleanEmail} (${existingParent.fatherName})`);
      }
      throw new BadRequestException(`Parent account already exists with phone: ${cleanPhone} (${existingParent.fatherName})`);
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email: cleanEmail },
    });
    if (existingUser) {
      throw new BadRequestException(`A user account with email ${cleanEmail} already exists`);
    }

    const passwordToUse = dto.temporaryPassword || 'ParentPass2026!@';
    const passwordHash = await bcrypt.hash(passwordToUse, 12);
    const username = cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(100 + Math.random() * 900);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          username,
          passwordHash,
          role: 'PARENT',
          isActive: true,
        },
      });

      const parent = await tx.parent.create({
        data: {
          userId: user.id,
          fatherName: dto.fatherName,
          motherName: dto.motherName || null,
          guardianName: dto.guardianName || null,
          primaryPhone: cleanPhone,
          alternatePhone: dto.alternatePhone ? dto.alternatePhone.trim() : null,
          email: cleanEmail,
          occupation: dto.occupation || null,
          address: dto.address,
          emergencyContact: dto.emergencyContact,
          visiblePassword: passwordToUse,
        },
      });

      await this.auditLogsService.log({
        userId: adminUserId,
        action: 'CREATE',
        module: 'PARENTS',
        entityId: parent.id,
        details: { email: parent.email, fatherName: parent.fatherName },
      });

      return {
        ...parent,
        credentials: {
          username: user.username,
          temporaryPassword: passwordToUse,
        },
      };
    });
  }

  async update(id: string, dto: UpdateParentDto, adminUserId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!parent) {
      throw new NotFoundException('Parent record not found');
    }

    if (dto.email) {
      const cleanEmail = dto.email.toLowerCase().trim();
      if (cleanEmail !== parent.email.toLowerCase()) {
        const existingEmail = await this.prisma.parent.findFirst({
          where: { email: cleanEmail, id: { not: id } },
        });
        if (existingEmail) {
          throw new BadRequestException(`Email ${cleanEmail} is already used by another parent (${existingEmail.fatherName})`);
        }
      }
    }

    if (dto.primaryPhone) {
      const cleanPhone = dto.primaryPhone.trim();
      if (cleanPhone !== parent.primaryPhone) {
        const existingPhone = await this.prisma.parent.findFirst({
          where: { primaryPhone: cleanPhone, id: { not: id } },
        });
        if (existingPhone) {
          throw new BadRequestException(`Phone ${cleanPhone} is already used by another parent (${existingPhone.fatherName})`);
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (parent.userId) {
        const userUpdateData: any = {};
        if (dto.email) {
          userUpdateData.email = dto.email.toLowerCase().trim();
        }
        if (dto.temporaryPassword) {
          userUpdateData.passwordHash = await bcrypt.hash(dto.temporaryPassword, 12);
        }
        if (Object.keys(userUpdateData).length > 0) {
          await tx.user.update({
            where: { id: parent.userId },
            data: userUpdateData,
          });
        }
      }

      const updated = await tx.parent.update({
        where: { id },
        data: {
          fatherName: dto.fatherName !== undefined ? dto.fatherName : undefined,
          motherName: dto.motherName !== undefined ? dto.motherName : undefined,
          guardianName: dto.guardianName !== undefined ? dto.guardianName : undefined,
          primaryPhone: dto.primaryPhone !== undefined ? dto.primaryPhone.trim() : undefined,
          alternatePhone: dto.alternatePhone !== undefined ? dto.alternatePhone.trim() : undefined,
          email: dto.email !== undefined ? dto.email.toLowerCase().trim() : undefined,
          occupation: dto.occupation !== undefined ? dto.occupation : undefined,
          address: dto.address !== undefined ? dto.address : undefined,
          emergencyContact: dto.emergencyContact !== undefined ? dto.emergencyContact : undefined,
          visiblePassword: dto.temporaryPassword !== undefined ? dto.temporaryPassword : undefined,
        },
        include: {
          user: { select: { id: true, username: true, isActive: true, lastLoginAt: true } },
          children: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNo: true,
              rollNo: true,
              status: true,
              class: { select: { id: true, name: true } },
              section: { select: { id: true, name: true } },
            },
          },
        },
      });

      await this.auditLogsService.log({
        userId: adminUserId,
        action: 'UPDATE',
        module: 'PARENTS',
        entityId: parent.id,
        details: { changes: dto },
      });

      return updated;
    });
  }

  async delete(id: string, adminUserId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!parent) {
      throw new NotFoundException('Parent record not found');
    }

    if (parent.children.length > 0) {
      throw new BadRequestException(
        `Cannot delete parent: ${parent.children.length} scholar(s) are actively linked to this profile. Please transfer or reassign the student(s) first.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.parent.delete({ where: { id } });
      if (parent.userId) {
        await tx.user.delete({ where: { id: parent.userId } });
      }

      await this.auditLogsService.log({
        userId: adminUserId,
        action: 'DELETE',
        module: 'PARENTS',
        entityId: id,
        details: { fatherName: parent.fatherName, email: parent.email },
      });

      return { success: true, message: 'Parent profile and login account successfully removed' };
    });
  }

  async getMyChildren(user: { id: string; role: Role }, parentId?: string) {
    let parent: any = null;

    if (user.role === Role.PARENT) {
      parent = await this.prisma.parent.findUnique({
        where: { userId: user.id },
        include: {
          children: {
            include: {
              class: true,
              section: true,
              fees: {
                include: { session: true },
              },
              examResults: {
                where: { isPublished: true },
                include: {
                  examSchedule: {
                    include: { exam: true, subject: true },
                  },
                },
              },
              attendance: {
                take: 30,
                orderBy: { date: 'desc' },
              },
            },
          },
        },
      });
    } else if (user.role === Role.SCHOOL_ADMIN) {
      // If School Admin is previewing/inspecting the Parent Portal, fetch mapped children
      parent = await this.prisma.parent.findFirst({
        where: parentId ? { id: parentId } : { children: { some: {} } },
        include: {
          children: {
            include: {
              class: true,
              section: true,
              fees: {
                include: { session: true },
              },
              examResults: {
                where: { isPublished: true },
                include: {
                  examSchedule: {
                    include: { exam: true, subject: true },
                  },
                },
              },
              attendance: {
                take: 30,
                orderBy: { date: 'desc' },
              },
            },
          },
        },
      });
    }

    if (!parent) {
      return [];
    }

    return parent.children || [];
  }
}

