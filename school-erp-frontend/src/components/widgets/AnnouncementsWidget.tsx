'use client';

import React from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { Bell, ArrowRight } from 'lucide-react';
import { ANNOUNCEMENTS } from '@/data/mockData';

interface AnnouncementsWidgetProps {
  limit?: number;
}

export const AnnouncementsWidget: React.FC<AnnouncementsWidgetProps> = ({
  limit = 2,
}) => {
  const displayed = ANNOUNCEMENTS.slice(0, limit);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {displayed.map((ann) => (
        <GlassCard key={ann.id} hoverEffect padding="md" className="flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 border border-pink-200/50 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 tracking-tight">Announcements</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">{ann.date}</span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium line-clamp-2 my-1">
            {ann.description}
          </p>

          <div className="pt-2 border-t border-slate-100/70 mt-2 flex items-center justify-between text-[11px]">
            <span className="text-indigo-600 font-semibold">{ann.title}</span>
            <span className="text-slate-400 group-hover:text-indigo-600 flex items-center gap-0.5">
              Read <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </GlassCard>
      ))}
    </div>
  );
};
