'use client';

import React, { useState } from 'react';
import { SchoolLogo } from '@/components/common/SchoolLogo';
import { SearchBar } from '@/components/common/SearchBar';
import { NotificationPanel } from '@/components/common/NotificationPanel';
import { ProfileDropdown } from '@/components/common/ProfileDropdown';
import { UserRole } from '@/types';
import { Calendar, Menu } from 'lucide-react';

interface SchoolHeaderProps {
  currentRole: UserRole;
  onToggleSidebar?: () => void;
}

export const SchoolHeader: React.FC<SchoolHeaderProps> = ({
  currentRole,
  onToggleSidebar,
}) => {
  const [session, setSession] = useState('2026–2027');

  return (
    <header className="w-full glass-panel sticky top-0 z-40 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-white/60">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-3 sm:gap-6">
        {/* Left Section: Mobile Menu Trigger + School Brand */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden w-9 h-9 rounded-xl bg-white/70 hover:bg-white/95 border border-white/80 shadow-2xs flex items-center justify-center text-slate-700 transition-colors"
            aria-label="Toggle Navigation"
            type="button"
          >
            <Menu className="w-4 h-4" />
          </button>

          <SchoolLogo size="md" showTagline={true} />
        </div>

        {/* Center Section: Academic Session Badge & Search Bar */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-4">
          <div className="relative flex-1">
            <SearchBar placeholder="Search students, teachers, grades, fees..." />
          </div>

          {/* Academic Session Selector */}
          <div className="relative flex items-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 border border-white/80 text-xs font-semibold text-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Session:</span>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="bg-transparent font-bold text-indigo-900 focus:outline-none cursor-pointer pr-1"
              >
                <option value="2026–2027">2026–2027</option>
                <option value="2025–2026">2025–2026</option>
                <option value="2027–2028 (Upcoming)">2027–2028 (Upcoming)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Section: Notification Panel + Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationPanel />
          <ProfileDropdown currentRole={currentRole} />
        </div>
      </div>
    </header>
  );
};
