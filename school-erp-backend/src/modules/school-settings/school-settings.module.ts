import { Module } from '@nestjs/common';
import { SchoolSettingsService } from './school-settings.service';
import { SchoolSettingsController } from './school-settings.controller';

@Module({
  controllers: [SchoolSettingsController],
  providers: [SchoolSettingsService],
  exports: [SchoolSettingsService],
})
export class SchoolSettingsModule {}

