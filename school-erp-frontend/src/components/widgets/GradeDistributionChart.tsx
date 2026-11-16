'use client';

import React from 'react';

export const GradeDistributionChart: React.FC = () => {
  const bars = [
    { grade: 'A', heightPercent: 38 },
    { grade: 'B', heightPercent: 92 },
    { grade: 'C', heightPercent: 64 },
    { grade: 'D', heightPercent: 44 },
    { grade: 'F', heightPercent: 22 },
  ];

  const yAxis = ['A', 'B', 'C', 'D', 'F'];

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full">
      <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-3">
        Grade Distribution
      </h3>

      <div className="flex items-stretch gap-3 flex-1 min-h-[140px] pt-1 pb-1">
        {/* Y Axis */}
        <div className="flex flex-col justify-between text-[11px] font-medium text-slate-400 pb-5 pr-1">
          {yAxis.map((label) => (
            <span key={label} className="leading-none">{label}</span>
          ))}
        </div>

        {/* Bars Container */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="flex items-end justify-between gap-3 flex-1 pb-1">
            {bars.map((item) => (
              <div key={item.grade} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  style={{ height: `${item.heightPercent}%` }}
                  className="w-full max-w-[28px] bg-[#8b8df2] rounded-t-lg transition-all duration-700 ease-out hover:bg-[#7b7df0]"
                />
              </div>
            ))}
          </div>

          {/* X Axis */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100/80">
            {bars.map((item) => (
              <span key={item.grade} className="flex-1 text-center text-[11px] font-semibold text-slate-500">
                {item.grade}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
