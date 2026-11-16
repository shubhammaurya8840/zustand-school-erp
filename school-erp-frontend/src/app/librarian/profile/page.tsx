'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { ProfileManager } from '@/components/common/ProfileManager';

export default function LibrarianProfilePage() {
  return (
    <DashboardLayout currentRole="librarian">
      <PageHeader
        title="Librarian Profile"
        subtitle="Manage knowledge center officer credentials and security"
        badge="Media & Archives"
      />
      <ProfileManager currentRole="librarian" />
    </DashboardLayout>
  );
}

