'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { ProfileManager } from '@/components/common/ProfileManager';

export default function AdminProfilePage() {
  return (
    <DashboardLayout currentRole="admin">
      <PageHeader
        title="Administrator Profile"
        subtitle="Manage your institutional credentials, contact records and account security"
        badge="Executive Directorate"
      />
      <ProfileManager currentRole="admin" />
    </DashboardLayout>
  );
}

