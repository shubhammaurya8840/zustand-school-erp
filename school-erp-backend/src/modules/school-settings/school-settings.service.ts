import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UpdateSchoolSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SchoolSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getSettings() {
    let settings = await this.prisma.schoolSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.schoolSettings.create({
        data: {
          schoolName: 'Zustand Public School',
          tagline: 'Knowledge | Character | Bright Future',
          logoPath: '/school-logo.svg',
          address: '108 Academic Enclave, Vidya Nagar, New Delhi - 110001',
          phone: '+91 (011) 2345-6789',
          email: 'info@zustandpublicschool.edu.in',
          website: 'https://zustandpublicschool.edu.in',
          affiliationNo: 'CBSE-AFF-2026/89432',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        },
      });
    }
    return settings;
  }

  async updateSettings(dto: UpdateSchoolSettingsDto, adminUserId: string) {
    const current = await this.getSettings();

    const updated = await this.prisma.schoolSettings.update({
      where: { id: current.id },
      data: {
        ...dto,
      },
    });

    await this.auditLogsService.log({
      userId: adminUserId,
      action: 'UPDATE',
      module: 'SETTINGS',
      entityId: updated.id,
      details: dto,
    });

    return updated;
  }
}

