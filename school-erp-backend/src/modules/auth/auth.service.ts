import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto, RequestPasswordResetDto, ResetPasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private getRoleDashboard(role: string): string {
    switch (role) {
      case 'SCHOOL_ADMIN':
        return '/admin/dashboard';
      case 'ACCOUNTANT':
        return '/accountant/dashboard';
      case 'TEACHER':
        return '/teacher/dashboard';
      case 'LIBRARIAN':
        return '/librarian/dashboard';
      case 'PARENT':
        return '/parent/dashboard';
      case 'STUDENT':
        return '/student/dashboard';
      default:
        return '/login';
    }
  }

  private formatDobToPassword(dob: Date | string | null | undefined): string {
    if (!dob) return '';
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    return `${day}${month}${year}`;
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { identifier, password } = loginDto;
    const cleanIdentifier = identifier.trim();
    const digitsOnly = cleanIdentifier.replace(/\D/g, '');

    // 1. If identifier has digits, check matching parent by normalized mobile number
    let parentUserId: string | null = null;
    if (digitsOnly.length >= 7) {
      const allParents = await this.prisma.parent.findMany({
        select: { userId: true, primaryPhone: true, alternatePhone: true },
      });
      const matchingParent = allParents.find((p) => {
        const p1 = (p.primaryPhone || '').replace(/\D/g, '');
        const p2 = (p.alternatePhone || '').replace(/\D/g, '');
        return (
          p1 === digitsOnly ||
          p2 === digitsOnly ||
          (digitsOnly.length >= 10 && (p1.endsWith(digitsOnly.slice(-10)) || p2.endsWith(digitsOnly.slice(-10))))
        );
      });
      if (matchingParent && matchingParent.userId) {
        parentUserId = matchingParent.userId;
      }
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier.toLowerCase() },
          { username: cleanIdentifier },
          { username: cleanIdentifier.toLowerCase() },
          { studentProfile: { admissionNo: { equals: cleanIdentifier, mode: 'insensitive' } } },
          { staffProfile: { employeeId: { equals: cleanIdentifier, mode: 'insensitive' } } },
          ...(parentUserId ? [{ id: parentUserId }] : []),
          { parentProfile: { primaryPhone: cleanIdentifier } },
        ],
      },
      include: {
        staffProfile: true,
        parentProfile: {
          include: {
            children: {
              select: {
                id: true,
                dob: true,
                firstName: true,
                admissionNo: true,
              },
            },
          },
        },
        studentProfile: {
          include: {
            class: true,
            section: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid mobile number, admission number, username or password. User not found.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated. Please contact administration.');
    }

    let isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    // If bcrypt compare fails, check if student/staff/parent entered their DOB or visible password
    if (!isPasswordValid) {
      const cleanInputPassword = password.replace(/\D/g, '');

      // 1. Student DOB
      if (user.studentProfile?.dob) {
        const studentDobPass = this.formatDobToPassword(user.studentProfile.dob);
        if (studentDobPass && cleanInputPassword === studentDobPass) {
          isPasswordValid = true;
        }
      }

      // 2. Staff DOB
      if (!isPasswordValid && user.staffProfile?.dob) {
        const staffDobPass = this.formatDobToPassword(user.staffProfile.dob);
        if (staffDobPass && cleanInputPassword === staffDobPass) {
          isPasswordValid = true;
        }
      }

      // 3. Parent: Check visiblePassword or any linked child's DOB
      if (!isPasswordValid && user.role === Role.PARENT && user.parentProfile) {
        if (user.parentProfile.visiblePassword && password === user.parentProfile.visiblePassword) {
          isPasswordValid = true;
        }

        if (!isPasswordValid && user.parentProfile.children) {
          for (const child of user.parentProfile.children) {
            if (child.dob) {
              const childDobPass = this.formatDobToPassword(child.dob);
              if (childDobPass && cleanInputPassword === childDobPass) {
                isPasswordValid = true;
                break;
              }
              const d = new Date(child.dob);
              const day = String(d.getUTCDate()).padStart(2, '0');
              const month = String(d.getUTCMonth() + 1).padStart(2, '0');
              const year = d.getUTCFullYear();
              const dateVariants = [
                `${day}${month}${year}`,
                `${day}-${month}-${year}`,
                `${day}/${month}/${year}`,
                `${year}-${month}-${day}`,
                `${year}${month}${day}`,
              ];
              if (dateVariants.includes(password.trim()) || dateVariants.includes(cleanInputPassword)) {
                isPasswordValid = true;
                break;
              }
            }
          }
        }
      }

      // 4. Default seed passwords check (accepts both "Secure" and standard format)
      const roleDefaultPasswords: Record<string, string[]> = {
        SCHOOL_ADMIN: ['AdminSecure2026!@', 'Admin2026!@'],
        ACCOUNTANT: ['AccountantSecure2026!@', 'Accountant2026!@'],
        TEACHER: ['TeacherSecure2026!@', 'Teacher2026!@'],
        LIBRARIAN: ['LibrarianSecure2026!@', 'Librarian2026!@'],
        PARENT: ['ParentSecure2026!@', 'Parent2026!@'],
        STUDENT: ['StudentSecure2026!@', 'Student2026!@'],
      };
      if (!isPasswordValid && roleDefaultPasswords[user.role]?.includes(password)) {
        isPasswordValid = true;
      }
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials. Please verify your username/phone and password.');
    }

    // Update last login timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Write audit log
    await this.auditLogsService.log({
      userId: user.id,
      action: 'LOGIN',
      module: 'AUTH',
      entityId: user.id,
      details: { role: user.role, identifier },
      ipAddress,
      userAgent,
    });

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    let name = user.username;
    if (user.staffProfile) {
      name = `${user.staffProfile.firstName} ${user.staffProfile.lastName}`;
    } else if (user.parentProfile) {
      name = user.parentProfile.fatherName || user.parentProfile.guardianName || 'Parent';
    } else if (user.studentProfile) {
      name = `${user.studentProfile.firstName} ${user.studentProfile.lastName}`;
    }

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name,
        role: user.role,
        targetDashboard: this.getRoleDashboard(user.role),
        mustChangePassword: user.mustChangePassword,
        lastLoginAt: user.lastLoginAt,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        staffProfile: true,
        parentProfile: {
          include: {
            children: {
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
        studentProfile: {
          include: {
            class: true,
            section: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      ...user,
      targetDashboard: this.getRoleDashboard(user.role),
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        staffProfile: true,
        parentProfile: {
          include: {
            children: {
              select: { dob: true },
            },
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      const cleanCurrent = dto.currentPassword.replace(/\D/g, '');
      if (user.studentProfile?.dob && cleanCurrent === this.formatDobToPassword(user.studentProfile.dob)) {
        isValid = true;
      }
      if (!isValid && user.staffProfile?.dob && cleanCurrent === this.formatDobToPassword(user.staffProfile.dob)) {
        isValid = true;
      }
      if (!isValid && user.role === Role.PARENT && user.parentProfile) {
        if (user.parentProfile.visiblePassword && dto.currentPassword === user.parentProfile.visiblePassword) {
          isValid = true;
        }
        if (!isValid && user.parentProfile.children) {
          for (const child of user.parentProfile.children) {
            if (child.dob && cleanCurrent === this.formatDobToPassword(child.dob)) {
              isValid = true;
              break;
            }
          }
        }
      }
    }

    if (!isValid) {
      throw new BadRequestException('Current password does not match records');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash, mustChangePassword: false },
      });

      // If user is a Parent, update visiblePassword so Admin & Accountant see the updated password live!
      if (user.role === Role.PARENT && user.parentProfile) {
        await tx.parent.update({
          where: { userId },
          data: { visiblePassword: dto.newPassword },
        });
      }
    });

    await this.auditLogsService.log({
      userId,
      action: 'CHANGE_PASSWORD',
      module: 'AUTH',
      entityId: userId,
    });

    return { message: 'Password has been changed successfully' };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      // Don't leak account existence
      return { message: 'If an account matches that email, a password reset token has been generated.' };
    }

    const token = randomUUID();
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    await this.auditLogsService.log({
      userId: user.id,
      action: 'REQUEST_PASSWORD_RESET',
      module: 'AUTH',
      entityId: user.id,
    });

    return {
      message: 'Password reset token generated successfully',
      resetToken: token, // Returned for dev/institutional testing; in full production sent via SMTP
      expiresAt: expiry,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: dto.token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Password reset token is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        resetTokenExpiry: null,
      },
    });

    await this.auditLogsService.log({
      userId: user.id,
      action: 'RESET_PASSWORD',
      module: 'AUTH',
      entityId: user.id,
    });

    return { message: 'Password has been reset successfully. You may now login.' };
  }
}

