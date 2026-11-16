'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  BookOpen,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { studentService } from '@/services/student.service';
import { homeworkService, HomeworkItem } from '@/services/homework.service';

export default function ParentHomeworkPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingHw, setFetchingHw] = useState(false);

  useEffect(() => {
    studentService
      .getMyChildren()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.children || [];
        setChildren(list);
        if (list.length > 0) {
          setSelectedChildId(list[0].id);
        }
      })
      .catch((err) => console.error('Failed to load children:', err))
      .finally(() => setLoading(false));
  }, []);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  useEffect(() => {
    if (!selectedChildId || !selectedChild) return;
    setFetchingHw(true);
    const cid = selectedChild.classId || selectedChild.class?.id;
    const sid = selectedChild.sectionId || selectedChild.section?.id;

    homeworkService
      .getAll({ classId: cid, sectionId: sid, studentId: selectedChildId })
      .then((data) => setHomeworkList(data || []))
      .catch((err) => {
        console.error('Failed to load child homework:', err);
        setHomeworkList([]);
      })
      .finally(() => setFetchingHw(false));
  }, [selectedChildId]);

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <FileText className="w-7 h-7 text-navy/70" />
              Ward Homework & Academic Tasks
            </h1>
            <p className="text-sm text-navy/60">
              Track assignments, project deadlines, and teacher evaluations for your children
            </p>
          </div>

          {children.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-navy/70">Select Ward:</span>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-white/70 border border-white/80 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20 font-semibold"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.class?.name || 'Class'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Retrieving linked wards...</p>
          </div>
        ) : children.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <Users className="w-12 h-12 text-navy/30 mx-auto mb-3" />
            <p className="font-semibold text-navy text-base">No Linked Children Found</p>
            <p className="text-xs text-navy/60 mt-1 max-w-sm mx-auto">
              No students are currently linked to your parent account.
            </p>
          </GlassCard>
        ) : (
          <>
            {/* Selected Child Info */}
            {selectedChild && (
              <GlassCard className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-navy text-sm">
                    {selectedChild.firstName} {selectedChild.lastName}
                  </h3>
                  <p className="text-xs text-navy/60">
                    Admission No: {selectedChild.admissionNo} • {selectedChild.class?.name} - {selectedChild.section?.name}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-navy/10 text-navy">
                  {homeworkList.length} Tasks
                </span>
              </GlassCard>
            )}

            {fetchingHw ? (
              <div className="py-16 flex justify-center text-navy/50">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : homeworkList.length === 0 ? (
              <GlassCard className="p-12 text-center text-navy/50">
                <FileText className="w-12 h-12 text-navy/30 mx-auto mb-3" />
                <p className="font-semibold text-navy text-base">No Pending Homework</p>
                <p className="text-xs text-navy/60 mt-1 max-w-sm mx-auto">
                  Your child has no pending homework assignments on file.
                </p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {homeworkList.map((hw) => {
                  const submission = hw.submissions && hw.submissions.length > 0 ? hw.submissions[0] : null;

                  return (
                    <GlassCard key={hw.id} className="p-5 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-900 border border-indigo-500/20">
                            {hw.subject?.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              submission
                                ? 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-900 border border-amber-500/30'
                            }`}
                          >
                            {submission ? 'Submitted' : 'Pending Submission'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-navy mt-1.5">{hw.title}</h4>
                        <p className="text-xs text-navy/70 mt-1 line-clamp-3 whitespace-pre-wrap">{hw.description}</p>
                      </div>

                      {submission && typeof submission.marksAwarded === 'number' && (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                          <span className="font-bold text-emerald-900">
                            Grade Awarded: {submission.marksAwarded} / {hw.totalMarks || 100}
                          </span>
                          {submission.feedback && (
                            <p className="text-[11px] text-emerald-800 mt-0.5">Feedback: {submission.feedback}</p>
                          )}
                        </div>
                      )}

                      <div className="pt-3 border-t border-navy/10 flex items-center justify-between text-xs text-navy/60">
                        <span>Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                        <span>Assigned by: {hw.teacher?.firstName || 'Faculty'}</span>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

