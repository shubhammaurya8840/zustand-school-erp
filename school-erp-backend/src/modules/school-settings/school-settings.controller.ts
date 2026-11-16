import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SchoolSettingsService } from './school-settings.service';
import { UpdateSchoolSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('School Settings')
@Controller('school-settings')
export class SchoolSettingsController {
  constructor(private readonly settingsService: SchoolSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get institutional branding and settings (Public/Internal)' })
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update institutional configuration (School Admin only)' })
  async updateSettings(
    @Body() dto: UpdateSchoolSettingsDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.settingsService.updateSettings(dto, adminUserId);
  }
}

