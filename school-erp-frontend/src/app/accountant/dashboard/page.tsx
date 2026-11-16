'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { GlassCard } from '@/components/common/GlassCard';
import { MiniCalendar } from '@/components/widgets/MiniCalendar';
import { QuickActionModals } from '@/components/modals/QuickActionModals';
import { reportService } from '@/services/report.service';
import { feeService } from '@/services/fee.service';
import {
  Download,
  PlusCircle,
  RefreshCw,
  UserPlus,
  GraduationCap,
  BookMarked,
  Wallet,
} from 'lucide-react';

export default function AccountantDashboardPage() {
  const [modal, setModal] = useState<'collect-fee' | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [receipts, setReceipts] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accDash, recRes] = await Promise.all([
        reportService.getAccountantDashboard().catch(() => null),
        feeService.getRecentReceipts(20).catch(() => []),
      ]);
      if (accDash) setDashboardData(accDash);
      if (Array.isArray(recRes)) setReceipts(recRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const feeColumns: ColumnDef<any>[] = [
    {
      key: 'receiptNo',
      header: 'Receipt #',
      render: (fee) => <span className="font-mono font-bold text-indigo-700 text-xs">{fee.receiptNo}</span>,
    },
    {
      key: 'student',
      header: 'Student',
      render: (fee) => (
        <span className="font-semibold text-slate-800 text-xs">
          {fee.student ? `${fee.student.firstName} ${fee.student.lastName}` : (fee.studentName || 'Student')}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount (INR)',
      render: (fee) => <span className="font-bold text-slate-900 text-xs">₹{Number(fee.amount).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'method',
      header: 'Payment Mode',
      render: (fee) => <span className="text-slate-600 text-xs font-medium">{fee.paymentMethod || fee.method}</span>,
    },
    {
      key: 'date',
      header: 'Timestamp',
      render: (fee) => (
        <span className="text-slate-400 text-xs">
          {new Date(fee.createdAt || fee.date || Date.now()).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (fee) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {fee.isReversed ? 'REVERSED' : 'SETTLED'}
        </span>
      ),
    },
  ];

  const kpi = dashboardData?.kpi || {
    totalCollected: receipts.reduce((acc, r) => acc + Number(r.amount || 0), 0),
    todayCollection: receipts.reduce((acc, r) => acc + Number(r.amount || 0), 0),
    totalPendingDues: 0,
    defaulterCount: 0,
  };

  return (
    <DashboardLayout currentRole="accountant">
      <PageHeader
        title="Bursar & Accounts Dashboard"
        subtitle="Zustand Public School • Tuition Management, Fee Invoicing & Bank Reconciliation"
        badge="FY 2026–2027 Active"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => loadData()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
              type="button"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setModal('collect-fee')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all"
              type="button"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Collect Fee</span>
            </button>
            <Link
              href="/accountant/students/admission"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Admission</span>
            </Link>
            <Link
              href="/accountant/staff"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-xs font-semibold border border-white/90 shadow-2xs transition-all"
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
              <span>Add Staff</span>
            </Link>
            <Link
              href="/accountant/library"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-xs font-semibold border border-white/90 shadow-2xs transition-all"
            >
              <BookMarked className="w-3.5 h-3.5 text-indigo-600" />
              <span>Add Book</span>
            </Link>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Fee Collection"
          value={`₹${kpi.totalCollected.toLocaleString('en-IN')}`}
          subValue="Fiscal Year 2026–2027"
          change="Real-time"
          isPositive={true}
          iconName="Wallet"
          iconColor="text-indigo-600"
          bgTint="bg-indigo-50/80"
        />
        <StatCard
          label="Today's Collection"
          value={`₹${kpi.todayCollection.toLocaleString('en-IN')}`}
          subValue="Counters & Online UPI"
          change="Today"
          isPositive={true}
          iconName="CreditCard"
          iconColor="text-emerald-600"
          bgTint="bg-emerald-50/80"
        />
        <StatCard
          label="Outstanding Dues"
          value={`₹${kpi.totalPendingDues.toLocaleString('en-IN')}`}
          subValue="Term 1 Pending Invoices"
          change="Pending"
          isPositive={false}
          iconName="BookmarkCheck"
          iconColor="text-amber-600"
          bgTint="bg-amber-50/80"
        />
        <StatCard
          label="Fee Defaulters"
          value={kpi.defaulterCount}
          subValue="Notice reminder required"
          change="Review"
          isPositive={false}
          iconName="FileCheck"
          iconColor="text-rose-600"
          bgTint="bg-rose-50/80"
        />
      </div>

      {/* Main Ledger Table and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <DataTable
            title="Recent Manual Fee Receipts"
            subtitle="Live collection receipts registered in PostgreSQL ledger"
            columns={feeColumns}
            data={receipts}
            emptyMessage="No fee receipts recorded yet. Click 'Collect Fee' to record a payment."
          />
        </div>
        <div>
          <MiniCalendar />
        </div>
      </div>

      <QuickActionModals
        activeModal={modal}
        onClose={() => setModal(null)}
        onSuccess={() => loadData()}
      />
    </DashboardLayout>
  );
}
