'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  BookOpen,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { homeworkService, HomeworkItem } from '@/services/homework.service';

export default function StudentHomeworkPage() {
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHw, setSelectedHw] = useState<HomeworkItem | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadHomework = async () => {
    try {
      setLoading(true);
      const data = await homeworkService.getAll();
      setHomeworkList(data || []);
    } catch (err: any) {
      console.error('Failed to load homework:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomework();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHw || !submissionText.trim()) return;

    try {
      setSubmitting(true);
      setMsg(null);
      await homeworkService.submit(selectedHw.id, {
        submissionText,
        attachmentUrl: attachmentUrl || undefined,
      });
      setMsg({ type: 'success', text: 'Homework submitted successfully!' });
      setSelectedHw(null);
      setSubmissionText('');
      setAttachmentUrl('');
      await loadHomework();
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'Failed to submit homework.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <FileText className="w-7 h-7 text-navy/70" />
              My Homework & Academic Assignments
            </h1>
            <p className="text-sm text-navy/60">
              Assigned coursework, problem sets, and submission status for your class
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-navy/10 text-navy">
            {homeworkList.length} Active Assignment{homeworkList.length !== 1 ? 's' : ''}
          </span>
        </div>

        {msg && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              msg.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/20'
                : 'bg-rose-500/15 text-rose-900 border border-rose-500/20'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{msg.text}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Retrieving your coursework...</p>
          </div>
        ) : homeworkList.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <FileText className="w-12 h-12 text-navy/30 mx-auto mb-3" />
            <p className="font-semibold text-navy text-base">No Homework Assigned</p>
            <p className="text-xs text-navy/60 mt-1 max-w-sm mx-auto">
              You are all caught up! There are currently no pending homework assignments for your class.
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {homeworkList.map((hw) => {
              const submission = hw.submissions && hw.submissions.length > 0 ? hw.submissions[0] : null;
              const isOverdue = new Date(hw.dueDate).getTime() < Date.now() && !submission;

              return (
                <GlassCard
                  key={hw.id}
                  className="p-5 flex flex-col justify-between hover:shadow-lg transition-all border border-white/60 space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-900 border border-indigo-500/20">
                        {hw.subject?.name} ({hw.subject?.code})
                      </span>
                      {hw.targetType === 'INDIVIDUAL_STUDENT' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          Individual Task
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-navy text-base">{hw.title}</h3>
                    <p className="text-xs text-navy/70 mt-2 whitespace-pre-wrap">{hw.description}</p>
                  </div>

                  {submission && (
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-emerald-900">
                        <span>Status: {submission.status}</span>
                        {typeof submission.marksAwarded === 'number' && (
                          <span>Score: {submission.marksAwarded} / {hw.totalMarks || 100}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-800/80">Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</p>
                      {submission.feedback && (
                        <p className="text-[11px] font-medium text-emerald-950 mt-1">Teacher Feedback: {submission.feedback}</p>
                      )}
                    </div>
                  )}

                  <div className="pt-3 border-t border-navy/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-navy/60">
                      <Clock className="w-3.5 h-3.5 text-navy/40" />
                      <span>Due: </span>
                      <strong className={isOverdue ? 'text-rose-600 font-bold' : 'text-navy'}>
                        {new Date(hw.dueDate).toLocaleDateString()}
                      </strong>
                    </div>

                    {!submission ? (
                      <GlassButton
                        onClick={() => setSelectedHw(hw)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-navy text-white shadow-sm flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Work</span>
                      </GlassButton>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Completed
                      </span>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* Submit Modal */}
        {selectedHw && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm animate-in fade-in duration-200">
            <GlassCard className="max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-navy/10">
                <div>
                  <h3 className="text-base font-bold text-navy">Submit Assignment</h3>
                  <p className="text-xs text-navy/60">{selectedHw.title} • {selectedHw.subject?.name}</p>
                </div>
                <button onClick={() => setSelectedHw(null)} className="text-navy/50 hover:text-navy text-sm font-bold">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Your Answers / Solution Notes</label>
                  <textarea
                    rows={5}
                    placeholder="Type or paste your homework solutions, steps, or answers here..."
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border border-white/60 bg-white/70 text-xs text-navy focus:outline-none focus:ring-2 focus:ring-navy/20 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Attachment Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... or cloud document link"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border border-white/60 bg-white/70 text-xs text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-navy/10">
                  <GlassButton
                    type="button"
                    onClick={() => setSelectedHw(null)}
                    className="px-4 py-2 text-xs font-semibold bg-white text-navy/70"
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-semibold bg-navy text-white shadow-sm flex items-center gap-1.5"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Submit to Faculty</span>
                  </GlassButton>
                </div>
              </form>
            </GlassCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
