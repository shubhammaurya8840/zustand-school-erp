'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { ProfileManager } from '@/components/common/ProfileManager';

export default function StudentProfilePage() {
  return (
    <DashboardLayout currentRole="student">
      <PageHeader
        title="Student Academic Profile"
        subtitle="View digital school ID card, enrollment details and update credentials"
        badge="Enrolled Scholar"
      />
      <ProfileManager currentRole="student" />
    </DashboardLayout>
  );
}

