'use client';

import React from 'react';

interface AttendanceGaugeProps {
  percentage?: number;
  label?: string;
  subtext?: string;
}

export const AttendanceGauge: React.FC<AttendanceGaugeProps> = ({
  percentage = 85,
}) => {
  const radius = 48;
  const strokeWidth = 11;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full">
      <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-2">
        Attendance
      </h3>

      <div className="flex-1 flex items-center justify-center py-2">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background track circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Value stroke circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#2dd4bf"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Centered Percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-800 tracking-tight">
              {percentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
