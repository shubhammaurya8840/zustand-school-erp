'use client';

import React from 'react';

interface UpcomingClassesWidgetProps {
  title?: string;
  classNameTitle?: string;
  timeSlot?: string;
  classes?: any[];
}

export const UpcomingClassesWidget: React.FC<UpcomingClassesWidgetProps> = ({
  title = 'Upcoming Classes',
  classNameTitle = 'Data Structures',
  timeSlot = 'Apr 24  1:00 PM–2:30 PM',
  classes,
}) => {
  const currentClass = classes && classes.length > 0 ? classes[0] : null;
  const displayTitle = currentClass ? (currentClass.subject || currentClass.name) : classNameTitle;
  const displayTime = currentClass ? `${currentClass.time || ''} • ${currentClass.room || ''}` : timeSlot;

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full">
      <h3 className="text-sm font-bold text-slate-800 tracking-tight">
        {title}
      </h3>

      <div className="my-auto py-2">
        <div className="text-xs font-semibold text-slate-800">
          {displayTitle}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {displayTime}
        </div>
      </div>

      <div className="h-1" />
    </div>
  );
};
