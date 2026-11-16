'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Info, AlertTriangle, Calendar } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface NotificationItem {
  id: string;
  title: string;
  time: string;
  type: 'info' | 'alert' | 'calendar';
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Mid-term examinations start in 10 days.',
    time: '15m ago',
    type: 'calendar',
    read: false,
  },
  {
    id: '2',
    title: 'Quarterly fee reconciliation report is ready for download.',
    time: '1h ago',
    type: 'info',
    read: false,
  },
  {
    id: '3',
    title: 'Science Lab safety audit completed with 100% score.',
    time: '3h ago',
    type: 'info',
    read: true,
  },
  {
    id: '4',
    title: 'Severe weather advisory: Indoor sports session scheduled.',
    time: '1d ago',
    type: 'alert',
    read: true,
  },
];

export const NotificationPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-xl bg-white/70 hover:bg-white/95 border border-white/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all focus:outline-none"
        title="Notifications"
        type="button"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 z-50 animate-in fade-in zoom-in-95 duration-200">
          <GlassCard padding="none" className="overflow-hidden shadow-xl border border-white/95">
            <div className="px-4 py-3 bg-white/70 border-b border-slate-100/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
                type="button"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100/60 p-1">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl transition-all flex items-start gap-3 ${
                    item.read ? 'opacity-70 hover:opacity-100' : 'bg-white/60'
                  } hover:bg-white/80`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {item.type === 'calendar' && (
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {item.type === 'info' && (
                      <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                        <Info className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {item.type === 'alert' && (
                      <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-800 font-medium leading-relaxed">
                      {item.title}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {item.time}
                    </span>
                  </div>
                  {!item.read && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100/80 text-center">
              <span className="text-[10px] text-slate-400 font-medium">
                Showing Zustand Public School Live Broadcasts
              </span>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

