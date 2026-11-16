'use client';

import React from 'react';

interface CourseProgressProps {
  title?: string;
  courseName?: string;
  progressPercent?: number;
  subtext?: string;
}

export const CourseProgressWidget: React.FC<CourseProgressProps> = ({
  title = 'Course Progress',
  courseName = 'Introduction to Programming',
  progressPercent = 75,
  subtext,
}) => {
  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full">
      <h3 className="text-sm font-bold text-slate-800 tracking-tight">
        {title}
      </h3>

      <div className="my-auto py-2">
        <div className="text-xs font-semibold text-slate-700 mb-2">
          {courseName}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-200/70 rounded-full h-3.5 overflow-hidden p-0.5">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-teal-400 rounded-full transition-all duration-700 ease-out"
            />
          </div>
          <span className="text-xs font-bold text-slate-600 min-w-[32px] text-right">
            {progressPercent}%
          </span>
        </div>

        {subtext && (
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            {subtext}
          </div>
        )}
      </div>

      <div className="h-1" />
    </div>
  );
};
