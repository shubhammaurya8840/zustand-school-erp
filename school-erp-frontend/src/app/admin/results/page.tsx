'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  Award,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  Printer,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { examService } from '@/services/exam.service';
import { masterDataService, AcademicSessionModel, ClassModel } from '@/services/master-data.service';
import { studentService, StudentListItem } from '@/services/student.service';

export default function AdminResultsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  // Report Card Modal
  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null);
  const [reportCardData, setReportCardData] = useState<any | null>(null);
  const [fetchingReport, setFetchingReport] = useState(false);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [sessData, classData] = await Promise.all([
        masterDataService.getAcademicSessions(),
        masterDataService.getClasses(),
      ]);
      setClasses(classData);

      const currentSess = sessData.find((s) => s.isCurrent) || sessData[0];
      if (currentSess) {
        const examsData = await examService.getAll(currentSess.id);
        setExams(examsData || []);
        if (examsData && examsData.length > 0) {
          setSelectedExamId(examsData[0].id);
        }
      }
      if (classData && classData.length > 0) {
        setSelectedClassId(classData[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load initial results data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadStudents = async () => {
    if (!selectedClassId) return;
    try {
      setLoading(true);
      const res = await studentService.getAll({ classId: selectedClassId, limit: 100 });
      setStudents(res.students || []);
    } catch (err: any) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [selectedClassId]);

  const handleOpenReportCard = async (student: StudentListItem) => {
    setSelectedStudent(student);
    if (!selectedExamId) return;
    try {
      setFetchingReport(true);
      const data = await examService.getReportCard(student.id, selectedExamId);
      setReportCardData(data);
    } catch (err: any) {
      console.error('Failed to get report card:', err);
      setReportCardData(null);
    } finally {
      setFetchingReport(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <FileText className="w-7 h-7 text-navy/70" />
              Examination Results & Report Cards
            </h1>
            <p className="text-sm text-navy/60">
              Audit institutional marks, calculate grade percentiles, and generate official student report cards
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-semibold text-navy/70 mb-1">Select Examination</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.type}) {ex.isPublished ? '— Published' : '— Draft'}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-semibold text-navy/70 mb-1">Select Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Students Table */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 border-b border-white/60 flex items-center justify-between">
            <h3 className="font-bold text-sm text-navy">
              Enrolled Students ({students.length})
            </h3>
            <span className="text-xs text-navy/50">Click "View Report Card" to generate transcript</span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
              <p className="text-sm">Loading student records...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-navy/50">
              <p className="font-semibold text-navy">No students enrolled in this class</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/40 text-navy/60 font-semibold border-b border-navy/5">
                  <tr>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-white/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-navy/70">
                        {st.rollNo ? String(st.rollNo).padStart(2, '0') : '--'}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-navy">{st.admissionNo}</td>
                      <td className="py-3 px-4 font-bold text-navy">
                        {st.firstName} {st.lastName}
                      </td>
                      <td className="py-3 px-4">{st.section?.name || 'A'}</td>
                      <td className="py-3 px-4 text-navy/60 capitalize">{(st.gender || 'Student').toLowerCase()}</td>
                      <td className="py-3 px-4 text-right">
                        <GlassButton
                          onClick={() => handleOpenReportCard(st)}
                          className="text-xs px-3 py-1 flex items-center gap-1.5 ml-auto"
                        >
                          <Award className="w-3.5 h-3.5 text-navy/70" />
                          View Report Card
                        </GlassButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        {/* Report Card Modal */}
        <AnimatePresence>
          {selectedStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/80 space-y-5 max-h-[90vh] overflow-y-auto"
              >
                {/* School Header on Report Card */}
                <div className="flex items-start justify-between border-b border-navy/10 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-navy tracking-tight">Zustand Public School</h2>
                    <p className="text-xs text-navy/60">Knowledge | Character | Bright Future</p>
                    <p className="text-xs font-semibold text-navy/80 mt-1">Official Student Performance Transcript</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="p-2 rounded-xl bg-navy/5 hover:bg-navy/10 text-navy transition-colors"
                      title="Print Report Card"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStudent(null);
                        setReportCardData(null);
                      }}
                      className="p-2 rounded-xl bg-navy/5 hover:bg-navy/10 text-navy transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Student Details Card */}
                <div className="p-4 rounded-2xl bg-white/70 border border-navy/5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-navy/40 block">Student Name:</span>
                    <span className="font-bold text-navy">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-navy/40 block">Admission No:</span>
                    <span className="font-mono font-medium text-navy">{selectedStudent.admissionNo}</span>
                  </div>
                  <div>
                    <span className="text-navy/40 block">Class & Section:</span>
                    <span className="font-medium text-navy">
                      {selectedStudent.class?.name || 'Class'} - {selectedStudent.section?.name || 'A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-navy/40 block">Roll No:</span>
                    <span className="font-medium text-navy">{selectedStudent.rollNo || '--'}</span>
                  </div>
                </div>

                {/* Marks Breakdown Table */}
                {fetchingReport ? (
                  <div className="py-12 flex flex-col items-center justify-center text-navy/50 space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-navy/60" />
                    <p className="text-xs">Computing examination marks and rankings...</p>
                  </div>
                ) : !reportCardData || !reportCardData.subjectResults || reportCardData.subjectResults.length === 0 ? (
                  <div className="p-8 text-center text-navy/50 rounded-2xl bg-white/40">
                    <p className="text-sm font-semibold text-navy">No examination marks logged</p>
                    <p className="text-xs text-navy/40 mt-1">
                      Marks have not yet been recorded by faculty for this student.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded-2xl border border-navy/5">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-navy/5 text-navy font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">Subject</th>
                            <th className="py-2.5 px-3 text-center">Max Marks</th>
                            <th className="py-2.5 px-3 text-center">Pass Marks</th>
                            <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                            <th className="py-2.5 px-3 text-center">Grade</th>
                            <th className="py-2.5 px-3 text-right">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy/5 bg-white/50">
                          {reportCardData.subjectResults.map((sr: any, idx: number) => (
                            <tr key={idx}>
                              <td className="py-2.5 px-3 font-semibold text-navy">{sr.subjectName}</td>
                              <td className="py-2.5 px-3 text-center text-navy/60">{sr.maxMarks}</td>
                              <td className="py-2.5 px-3 text-center text-navy/60">{sr.passMarks}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-navy">{sr.marksObtained}</td>
                              <td className="py-2.5 px-3 text-center font-semibold text-indigo-700">{sr.grade}</td>
                              <td className="py-2.5 px-3 text-right text-navy/60 italic">{sr.remarks || 'Satisfactory'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Aggregate Summary */}
                    <div className="p-4 rounded-2xl bg-navy/5 border border-navy/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-navy/50 block">Aggregate Score:</span>
                        <span className="font-bold text-base text-navy">
                          {reportCardData.totalMarksObtained} / {reportCardData.totalMaxMarks}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-navy/50 block">Percentage:</span>
                        <span className="font-bold text-base text-navy">
                          {reportCardData.percentage ? `${reportCardData.percentage}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-navy/50 block">Overall Status:</span>
                        <span
                          className={`font-bold text-base ${
                            reportCardData.status === 'PASSED' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {reportCardData.status || 'PASSED'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
