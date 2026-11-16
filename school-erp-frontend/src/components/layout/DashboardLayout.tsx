'use client';

import React, { useState } from 'react';
import { SchoolHeader } from './SchoolHeader';
import { Sidebar } from './Sidebar';
import { UserRole } from '@/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentRole?: UserRole;
  role?: UserRole;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentRole,
  role,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeRole: UserRole = role || currentRole || 'admin';

  return (
    <div className="min-h-screen liquid-canvas flex flex-col text-slate-800">
      {/* Top Header */}
      <SchoolHeader
        currentRole={activeRole}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto relative">
        <Sidebar
          currentRole={activeRole}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
