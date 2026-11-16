'use client';

import React from 'react';
import { Folder, Check, RotateCw, Percent } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  iconType: 'folder' | 'check' | 'refresh' | 'percent';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  iconType,
}) => {
  const getIcon = () => {
    switch (iconType) {
      case 'folder':
        return (
          <div className="w-7 h-7 rounded-lg bg-sky-100/70 border border-sky-200/50 flex items-center justify-center text-sky-600">
            <Folder className="w-4 h-4 stroke-[2]" />
          </div>
        );
      case 'check':
        return (
          <div className="w-7 h-7 rounded-lg bg-emerald-100/70 border border-emerald-200/50 flex items-center justify-center text-emerald-600">
            <Check className="w-4 h-4 stroke-[2.5]" />
          </div>
        );
      case 'refresh':
        return (
          <div className="w-7 h-7 rounded-lg bg-indigo-100/70 border border-indigo-200/50 flex items-center justify-center text-indigo-600">
            <RotateCw className="w-4 h-4 stroke-[2]" />
          </div>
        );
      case 'percent':
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-100/70 border border-amber-200/50 flex items-center justify-center text-amber-600">
            <Percent className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        );
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      <div className="flex items-center gap-3">
        {getIcon()}
        <div className="text-2xl font-bold tracking-tight text-slate-800">
          {value}
        </div>
      </div>
      <div className="text-xs font-medium text-slate-500 mt-3">
        {label}
      </div>
    </div>
  );
};

