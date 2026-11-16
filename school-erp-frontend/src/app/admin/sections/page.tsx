'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Users,
  UserCheck,
  Search,
  X,
  Loader2,
  CheckCircle2,
  GraduationCap,
  School,
  ArrowRight,
  Plus,
  Trash2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { masterDataService, ClassModel } from '@/services/master-data.service';
import { staffService, StaffListItem } from '@/services/staff.service';

export default function AdminSectionsPage() {
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [teachers, setTeachers] = useState<StaffListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState<{ id: string; name: string; className: string } | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classData, staffData] = await Promise.all([
        masterDataService.getClasses(),
        staffService.getAll({ role: 'TEACHER', limit: 100 }),
      ]);
      setClasses(classData);
      setTeachers(staffData.staff || []);
    } catch (err: any) {
      console.error('Failed to load sections data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection || !selectedTeacherId) return;
    try {
      setSubmitting(true);
      setMessage(null);
      await masterDataService.assignClassTeacher(selectedSection.id, selectedTeacherId);
      setMessage({
        type: 'success',
        text: `Class Teacher successfully assigned to ${selectedSection.className} - Section ${selectedSection.name}!`,
      });
      setSelectedSection(null);
      setSelectedTeacherId('');
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to assign class teacher' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSection = async (sectionId: string, sectionName: string, className: string) => {
    if (!window.confirm(`Are you sure you want to delete Section "${sectionName}" of ${className}? This action cannot be undone.`)) {
      return;
    }
    try {
      setLoading(true);
      setMessage(null);
      const res = await masterDataService.deleteSection(sectionId);
      setMessage({ type: 'success', text: res.message || `Section ${sectionName} deleted successfully!` });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to delete section' });
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.sections?.some((s) => s.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Layers className="w-7 h-7 text-navy/70" />
              Class Sections & In-Charge Mentors
            </h1>
            <p className="text-sm text-navy/60">
              Assign dedicated class teachers and monitor student capacities per section
            </p>
          </div>
          <Link
            href="/admin/classes"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Manage & Add Sections</span>
          </Link>
        </div>

        {/* Alerts */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl flex items-center justify-between text-sm ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-800'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-800'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="p-1 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Search */}
        <GlassCard className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="text"
              placeholder="Search by class name or section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-white/60 border border-white/60 text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>
        </GlassCard>

        {/* Section Roster by Class */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Loading sections and faculty assignments...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <Layers className="w-12 h-12 mx-auto text-navy/20 mb-3" />
            <p className="text-base font-semibold text-navy">No class sections found</p>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {filteredClasses.map((cls) => (
              <GlassCard key={cls.id} className="p-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/50 mb-4">
                  <div className="flex items-center gap-2">
                    <School className="w-5 h-5 text-navy/70" />
                    <h2 className="text-lg font-bold text-navy">{cls.name}</h2>
                    <span className="text-xs font-mono text-navy/40">({cls.code})</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-navy/5 text-navy/70">
                    {cls.sections?.length || 0} Section{(cls.sections?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cls.sections && cls.sections.length > 0 ? (
                    cls.sections.map((sec: any) => (
                      <div
                        key={sec.id}
                        className="p-4 rounded-2xl bg-white/50 border border-white/80 flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs uppercase font-bold tracking-wider text-navy/40">Section</span>
                            <h3 className="text-xl font-bold text-navy">{sec.name}</h3>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-800 border border-blue-500/20 font-medium">
                            Cap: {sec.capacity}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-navy/70 border-t border-navy/5 pt-2">
                          <span className="text-navy/40 block text-[11px]">Class Teacher / Mentor:</span>
                          <div className="flex items-center gap-1.5 font-medium text-navy">
                            <UserCheck className="w-3.5 h-3.5 text-navy/60" />
                            <span>
                              {sec.classTeacher
                                ? `${sec.classTeacher.firstName} ${sec.classTeacher.lastName}`
                                : 'Unassigned'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <GlassButton
                            onClick={() => {
                              setSelectedSection({ id: sec.id, name: sec.name, className: cls.name });
                              setSelectedTeacherId(sec.classTeacherId || '');
                            }}
                            className="flex-1 text-xs py-1.5 flex items-center justify-center gap-1.5"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            {sec.classTeacher ? 'Reassign Teacher' : 'Assign Teacher'}
                          </GlassButton>
                          <button
                            type="button"
                            onClick={() => handleDeleteSection(sec.id, sec.name, cls.name)}
                            title={`Delete Section ${sec.name}`}
                            className="p-2 rounded-xl border border-rose-200/80 bg-rose-50/50 hover:bg-rose-100 text-rose-600 transition shadow-2xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-navy/40 italic col-span-3 py-2">No sections defined for this class.</p>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Assign Teacher Modal */}
        <AnimatePresence>
          {selectedSection && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-navy/10 pb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-navy" />
                    <h2 className="text-lg font-bold text-navy">Assign Class Teacher</h2>
                  </div>
                  <button onClick={() => setSelectedSection(null)} className="p-1 rounded-full hover:bg-navy/5 text-navy/60">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-navy/5 text-xs text-navy/80 space-y-1">
                  <p>
                    <span className="font-semibold">Target Class:</span> {selectedSection.className}
                  </p>
                  <p>
                    <span className="font-semibold">Section:</span> {selectedSection.name}
                  </p>
                </div>

                <form onSubmit={handleAssignTeacher} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Select Faculty Member *</label>
                    <select
                      required
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    >
                      <option value="">-- Choose Teacher --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.firstName} {t.lastName} ({t.employeeId} - {t.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-navy/10">
                    <button
                      type="button"
                      onClick={() => setSelectedSection(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-navy/60 hover:bg-navy/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-slate-900 text-white hover:bg-slate-800 text-xs px-5 py-2 rounded-xl shadow-md cursor-pointer font-bold disabled:opacity-50"
                    >
                      {submitting ? 'Assigning...' : 'Save Assignment'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

