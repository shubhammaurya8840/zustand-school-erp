'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  Loader2,
  Calendar,
  CheckCircle2,
  School,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { studentService, StudentListItem } from '@/services/student.service';
import { masterDataService, ClassModel } from '@/services/master-data.service';

export default function TeacherStudentsPage() {
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    masterDataService
      .getClasses()
      .then((data) => {
        setClasses(data || []);
        if (data && data.length > 0) {
          setSelectedClassId(data[0].id);
          if (data[0].sections && data[0].sections.length > 0) {
            setSelectedSectionId(data[0].sections[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load classes:', err));
  }, []);

  const loadStudents = async () => {
    if (!selectedClassId) return;
    try {
      setLoading(true);
      const res = await studentService.getAll({
        classId: selectedClassId,
        sectionId: selectedSectionId ? selectedSectionId : undefined,
        limit: 100,
      });
      setStudents(res.students || []);
    } catch (err: any) {
      console.error('Failed to load class students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [selectedClassId, selectedSectionId]);

  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const cls = classes.find((c) => c.id === newClassId);
    if (cls && cls.sections && cls.sections.length > 0) {
      setSelectedSectionId(cls.sections[0].id);
    } else {
      setSelectedSectionId('');
    }
  };

  const currentClass = classes.find((c) => c.id === selectedClassId);

  const filteredStudents = students.filter(
    (st) =>
      `${st.firstName} ${st.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      st.admissionNo.toLowerCase().includes(search.toLowerCase()) ||
      (st.rollNo && String(st.rollNo).includes(search))
  );

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-navy/70" />
              Class Student Roster
            </h1>
            <p className="text-sm text-navy/60">
              Review enrolled students strictly within your assigned class and section
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <GlassCard className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-full md:w-1/3">
              <label className="block text-xs font-semibold text-navy/70 mb-1">Select Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-1/3">
              <label className="block text-xs font-semibold text-navy/70 mb-1">Select Section</label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                <option value="">All Sections</option>
                {currentClass?.sections?.map((s) => (
                  <option key={s.id} value={s.id}>
                    Section {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-1/3">
              <label className="block text-xs font-semibold text-navy/70 mb-1">Search Student</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
                <input
                  type="text"
                  placeholder="Search name, roll no, admission no..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white/70 border border-white/80 text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Student Roster Table */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 border-b border-white/60 flex items-center justify-between">
            <h3 className="font-bold text-sm text-navy">
              Enrolled Students ({filteredStudents.length})
            </h3>
            <span className="text-xs text-navy/50">
              Showing strictly verified students for {currentClass?.name || 'Class'}
            </span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
              <p className="text-sm">Loading student roster...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-navy/50">
              <Users className="w-10 h-10 mx-auto text-navy/20 mb-2" />
              <p className="font-semibold text-navy">No students found for this class & section</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/40 text-navy/60 font-semibold border-b border-navy/5">
                  <tr>
                    <th className="py-3 px-4">Roll</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Parent / Guardian</th>
                    <th className="py-3 px-4">Emergency Contact</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-white/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-navy/80">
                        {st.rollNo ? String(st.rollNo).padStart(2, '0') : '--'}
                      </td>
                      <td className="py-3 px-4 font-bold text-navy">
                        {st.firstName} {st.lastName}
                      </td>
                      <td className="py-3 px-4 font-mono text-navy/60">{st.admissionNo}</td>
                      <td className="py-3 px-4 font-semibold text-navy">
                        {st.section?.name || 'A'}
                      </td>
                      <td className="py-3 px-4 capitalize text-navy/70">{(st.gender || 'student').toLowerCase()}</td>
                      <td className="py-3 px-4 text-navy/80 font-medium">
                        {st.parent?.fatherName || 'Parent'}
                      </td>
                      <td className="py-3 px-4 text-navy/70 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-navy/40" />
                        <span>{st.parent?.primaryPhone || 'N/A'}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                          {st.status || 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
