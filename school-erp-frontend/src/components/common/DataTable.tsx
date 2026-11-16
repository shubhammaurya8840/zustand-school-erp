'use client';

import React from 'react';
import { GlassCard } from './GlassCard';
import { Inbox } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  title?: string;
  subtitle?: string;
  columns: ColumnDef<T>[];
  data: T[];
  emptyMessage?: string;
  isLoading?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export function DataTable<T extends { id?: string | number }>({
  title,
  subtitle,
  columns,
  data,
  emptyMessage = 'No records found for this period.',
  isLoading = false,
  actions,
  className = '',
}: DataTableProps<T>) {
  return (
    <GlassCard padding="none" className={`overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="p-4 sm:px-5 sm:py-4 border-b border-white/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            {title && (
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100/80 bg-white/40 text-slate-500 font-semibold tracking-wider uppercase text-[10px]">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  style={col.width ? { width: col.width } : undefined}
                  className="px-4 py-3 first:pl-5 last:pr-5"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-8 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <span>Loading school records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr
                  key={item.id ?? rowIdx}
                  className="hover:bg-white/60 transition-colors group text-slate-700"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || colIdx}
                      className="px-4 py-3 first:pl-5 last:pr-5 whitespace-nowrap"
                    >
                      {col.render
                        ? col.render(item, rowIdx)
                        : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

