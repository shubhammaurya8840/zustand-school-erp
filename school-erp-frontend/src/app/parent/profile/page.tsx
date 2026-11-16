'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { ProfileManager } from '@/components/common/ProfileManager';

export default function ParentProfilePage() {
  return (
    <DashboardLayout currentRole="parent">
      <PageHeader
        title="Guardian Profile"
        subtitle="Manage family records, primary telephone and security credentials"
        badge="Parent Portal"
      />
      <ProfileManager currentRole="parent" />
    </DashboardLayout>
  );
}

