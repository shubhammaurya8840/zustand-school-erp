'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { studentService } from '@/services/student.service';
import { staffService } from '@/services/staff.service';
import {
  Users,
  Search,
  CheckCircle2,
  GraduationCap,
  RefreshCw,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

export default function LibrarianMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'STUDENT' | 'STAFF'>('ALL');

  const loadMembers = async () => {
    try {
      setLoading(true);
      const [stdRes, staffRes] = await Promise.all([
        studentService.getAll({ limit: 100 }).catch(() => ({ students: [] })),
        staffService.getAll({ limit: 100 }).catch(() => ({ staff: [] })),
      ]);

      const formattedStudents = (stdRes.students || []).map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        type: 'STUDENT',
        cardNo: s.admissionNo,
        group: s.class ? `${s.class.name} - ${s.section?.name || 'A'}` : 'Class 10-A',
        contact: s.parent?.primaryPhone || 'N/A',
        status: 'ACTIVE',
      }));

      const formattedStaff = (staffRes.staff || []).map((st) => ({
        id: st.id,
        name: `${st.firstName} ${st.lastName}`,
        type: 'STAFF',
        cardNo: st.employeeId,
        group: st.department || 'Faculty',
        contact: st.phone || 'N/A',
        status: st.status || 'ACTIVE',
      }));

      setMembers([...formattedStudents, ...formattedStaff]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const filteredMembers = members.filter((m) => {
    if (typeFilter !== 'ALL' && m.type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return m.name.toLowerCase().includes(q) || m.cardNo.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <DashboardLayout currentRole="librarian">
      <PageHeader
        title="Library Membership Registry"
        subtitle="Registered borrower accounts across student scholars and faculty"
        badge="Card Catalog"
        actions={
          <button
            onClick={() => loadMembers()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      <GlassCard padding="md" className="border-white/80 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search member by Name, Admission #, Employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/70 border border-white/90 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 bg-white/80 border border-white/90 rounded-xl text-xs font-bold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="ALL">All Borrowers</option>
              <option value="STUDENT">Students Only</option>
              <option value="STAFF">Faculty / Staff Only</option>
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard padding="none" className="border-white/80 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-white/60 bg-white/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800">Borrower Directory</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Registered members: <span className="font-bold text-slate-800">{filteredMembers.length}</span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Loading membership accounts...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-2 opacity-60" />
            <h4 className="text-sm font-bold text-slate-800">No members found</h4>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/60 bg-white/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Borrower Card ID</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Class / Department</th>
                  <th className="py-3 px-4">Registered Contact</th>
                  <th className="py-3 px-4 text-right">Card Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 text-xs">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-white/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">
                        {m.name[0]}
                      </div>
                      <span>{m.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 text-xs">
                      {m.cardNo}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.type === 'STUDENT'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{m.group}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{m.contact}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Authorized</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </DashboardLayout>
  );
}

