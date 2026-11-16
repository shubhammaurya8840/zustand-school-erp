'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { ProfileManager } from '@/components/common/ProfileManager';

export default function TeacherProfilePage() {
  return (
    <DashboardLayout currentRole="teacher">
      <PageHeader
        title="Faculty Profile"
        subtitle="Manage academic credentials, qualifications and password"
        badge="STEM Department"
      />
      <ProfileManager currentRole="teacher" />
    </DashboardLayout>
  );
}

