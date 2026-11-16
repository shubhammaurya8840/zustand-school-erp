'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { AttendanceManager } from '@/components/attendance/AttendanceManager';

export default function TeacherAttendancePage() {
  return (
    <DashboardLayout currentRole="teacher">
      <PageHeader
        title="Class Attendance Register"
        subtitle="Daily institutional roll call and section-wise attendance tracking"
        badge="Faculty Portal"
      />
      <AttendanceManager currentRole="teacher" />
    </DashboardLayout>
  );
}

