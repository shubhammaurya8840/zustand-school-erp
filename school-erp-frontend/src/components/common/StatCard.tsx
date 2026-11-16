'use client';

import React from 'react';
import { GlassCard } from './GlassCard';
import {
  Users,
  GraduationCap,
  CalendarCheck2,
  Wallet,
  TrendingUp,
  TrendingDown,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Library,
  BookmarkCheck,
  CreditCard,
  FileCheck,
  Layers,
} from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  change?: string;
  isPositive?: boolean;
  iconName?: string;
  iconColor?: string;
  bgTint?: string;
  className?: string;
}

const iconRegistry: Record<string, React.ElementType> = {
  Users,
  GraduationCap,
  CalendarCheck2,
  Wallet,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Library,
  BookmarkCheck,
  CreditCard,
  FileCheck,
  Layers,
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  change,
  isPositive = true,
  iconName = 'Users',
  iconColor = 'text-indigo-600',
  bgTint = 'bg-indigo-50/70',
  className = '',
}) => {
  const IconComponent = iconRegistry[iconName] || Users;

  return (
    <GlassCard hoverEffect padding="md" className={`relative overflow-hidden ${className}`}>
      {/* Subtle Top-Right Ambient Glow */}
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/40 blur-xl pointer-events-none" />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgTint} ${iconColor} border border-white/60 shadow-xs`}
          >
            <IconComponent className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-800">
              {value}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">
              {label}
            </div>
          </div>
        </div>

        {change && (
          <div
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs ${
              isPositive
                ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200/60'
                : 'bg-rose-50/90 text-rose-700 border-rose-200/60'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{change}</span>
          </div>
        )}
      </div>

      {subValue && (
        <div className="mt-3 pt-2 border-t border-slate-100/70 text-[11px] text-slate-500 flex items-center justify-between">
          <span>{subValue}</span>
          <span className="text-[10px] text-amber-600/90 font-medium">Verified Demo</span>
        </div>
      )}
    </GlassCard>
  );
};
