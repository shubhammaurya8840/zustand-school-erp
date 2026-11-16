'use client';

import React from 'react';
import AdminParentsPage from '@/app/admin/parents/page';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Accountant Parents Directory reusing the full-featured registry
export default function AccountantParentsPage() {
  return (
    <div className="accountant-parents-wrapper">
      <AdminParentsPage />
    </div>
  );
}

