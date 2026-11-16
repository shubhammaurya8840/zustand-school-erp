'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { AttendanceManager } from '@/components/attendance/AttendanceManager';

export default function AdminAttendancePage() {
  return (
    <DashboardLayout currentRole="admin">
      <PageHeader
        title="School Attendance Management"
        subtitle="Campus-wide student roll call registers, section rosters & audit logs"
        badge="Executive Directorate"
      />
      <AttendanceManager currentRole="admin" />
    </DashboardLayout>
  );
}

