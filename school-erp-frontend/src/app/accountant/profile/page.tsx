'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { ProfileManager } from '@/components/common/ProfileManager';

export default function AccountantProfilePage() {
  return (
    <DashboardLayout currentRole="accountant">
      <PageHeader
        title="Finance Officer Profile"
        subtitle="Manage Bursar credentials, departmental contacts and security"
        badge="Treasury & Accounts"
      />
      <ProfileManager currentRole="accountant" />
    </DashboardLayout>
  );
}

