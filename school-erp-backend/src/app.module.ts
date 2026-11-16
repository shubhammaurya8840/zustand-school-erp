import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SchoolSettingsModule } from './modules/school-settings/school-settings.module';
import { AcademicSessionsModule } from './modules/academic-sessions/academic-sessions.module';
import { ClassesModule } from './modules/classes/classes.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { StaffModule } from './modules/staff/staff.module';
import { ParentsModule } from './modules/parents/parents.module';
import { StudentsModule } from './modules/students/students.module';
import { FeesModule } from './modules/fees/fees.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { TimetableModule } from './modules/timetable/timetable.module';
import { ExamsModule } from './modules/exams/exams.module';
import { NoticesModule } from './modules/notices/notices.module';
import { LibraryModule } from './modules/library/library.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HomeworkModule } from './modules/homework/homework.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL || 60000),
        limit: Number(process.env.THROTTLE_LIMIT || 100),
      },
    ]),
    PrismaModule,
    AuditLogsModule,
    AuthModule,
    UsersModule,
    SchoolSettingsModule,
    AcademicSessionsModule,
    ClassesModule,
    SubjectsModule,
    StaffModule,
    ParentsModule,
    StudentsModule,
    FeesModule,
    AttendanceModule,
    TimetableModule,
    ExamsModule,
    NoticesModule,
    LibraryModule,
    ReportsModule,
    UploadsModule,
    HomeworkModule,
  ],
})
export class AppModule {}

