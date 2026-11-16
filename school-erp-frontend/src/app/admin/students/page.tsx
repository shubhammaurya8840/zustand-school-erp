'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { studentService, StudentListItem } from '@/services/student.service';
import { masterDataService, ClassItem } from '@/services/master-data.service';
import { feeService } from '@/services/fee.service';
import {
  Users,
  Search,
  PlusCircle,
  Filter,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Eye,
  X,
  Edit,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  KeyRound,
  Receipt,
  ArrowRight,
  UserCheck,
  CreditCard,
  Trash2,
} from 'lucide-react';

function formatDobToPassword(dobStr: string | null | undefined): string {
  if (!dobStr) return '';
  const d = new Date(dobStr);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  return `${day}${month}${year}`;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected Student Drawer State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'details' | 'edit' | 'collect-fee'>('details');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    rollNo: 1,
    classId: '',
    sectionId: '',
    dob: '',
    gender: 'Male',
    bloodGroup: 'O+',
    address: '',
    emergencyContact: '',
    status: 'ACTIVE',
    totalFee: 0,
    discountAmount: 0,
  });

  // Collect Fee Form State
  const [feeForm, setFeeForm] = useState({
    amount: 0,
    paymentMethod: 'CASH' as 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE',
    referenceNo: '',
    remarks: '',
  });

  const loadStudents = async () => {
    try {
      setLoading(true);
      const [stdRes, clsRes] = await Promise.all([
        studentService.getAll({
          classId: selectedClassId || undefined,
          search: search.trim() || undefined,
          limit: 100,
        }),
        masterDataService.getClasses().catch(() => []),
      ]);

      setStudents(stdRes.students || []);
      setTotal(stdRes.total || 0);
      setClasses(clsRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [selectedClassId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents();
  };

  // Open Student Details Modal / Drawer
  const openStudentModal = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setLoadingDetail(true);
    setActiveTab('details');
    setFeedbackMsg(null);

    try {
      const data = await studentService.getById(studentId);
      setStudentDetail(data);

      const fee = data.fees?.[0];
      const tot = fee ? Number(fee.totalAmount) : 0;
      const disc = fee ? Number(fee.discountAmount) : 0;
      const due = fee ? Number(fee.dueAmount) : 0;

      // Populate edit form
      setEditForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        rollNo: data.rollNo || 1,
        classId: data.classId || '',
        sectionId: data.sectionId || '',
        dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
        gender: data.gender || 'Male',
        bloodGroup: data.bloodGroup || 'O+',
        address: data.address || '',
        emergencyContact: data.emergencyContact || '',
        status: data.status || 'ACTIVE',
        totalFee: tot,
        discountAmount: disc,
      });

      // Default fee collector to current due amount
      setFeeForm({
        amount: due > 0 ? due : 0,
        paymentMethod: 'CASH',
        referenceNo: '',
        remarks: `Manual fee collection for ${data.firstName} ${data.lastName}`,
      });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to fetch student details.' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteStudent = async (student: { id: string; firstName: string; lastName: string; admissionNo: string }) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete scholar "${student.firstName} ${student.lastName}" (Admission No: ${student.admissionNo})?\n\nThis will remove the student profile, attendance, enrollments, and portal login account.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await studentService.delete(student.id);
      alert(`Scholar ${student.firstName} ${student.lastName} has been deleted.`);
      if (selectedStudentId === student.id) {
        setSelectedStudentId(null);
        setStudentDetail(null);
      }
      await loadStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete student.');
    } finally {
      setLoading(false);
    }
  };

  const handleClassChangeInEdit = (newClassId: string) => {
    const cls = classes.find((c) => c.id === newClassId);
    setEditForm((prev) => ({
      ...prev,
      classId: newClassId,
      sectionId: cls?.sections?.[0]?.id || '',
    }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    try {
      setIsSubmitting(true);
      setFeedbackMsg(null);

      await studentService.update(selectedStudentId, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        rollNo: Number(editForm.rollNo),
        classId: editForm.classId,
        sectionId: editForm.sectionId,
        dob: editForm.dob,
        gender: editForm.gender,
        bloodGroup: editForm.bloodGroup,
        address: editForm.address.trim(),
        emergencyContact: editForm.emergencyContact.trim(),
        status: editForm.status,
        totalFee: Number(editForm.totalFee),
        discountAmount: Number(editForm.discountAmount),
      });

      setFeedbackMsg({ type: 'success', text: 'Student details & fee structure updated successfully!' });
      // Reload both drawer details and parent list
      const refreshed = await studentService.getById(selectedStudentId);
      setStudentDetail(refreshed);
      loadStudents();
      setActiveTab('details');
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update student profile.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollectFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || feeForm.amount <= 0) {
      setFeedbackMsg({ type: 'error', text: 'Please enter a valid fee amount greater than 0.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedbackMsg(null);

      const res = await feeService.collectFee({
        studentId: selectedStudentId,
        amount: Number(feeForm.amount),
        paymentMethod: feeForm.paymentMethod,
        referenceNo: feeForm.referenceNo || `RCP-${Date.now()}`,
        remarks: feeForm.remarks,
      });

      setFeedbackMsg({
        type: 'success',
        text: `Fee collected successfully! Receipt No: ${res.payment?.receiptNo || 'Confirmed'}`,
      });

      const refreshed = await studentService.getById(selectedStudentId);
      setStudentDetail(refreshed);
      loadStudents();
      setActiveTab('details');
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to record fee payment.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedStudentId || !studentDetail) return;
    try {
      setIsSubmitting(true);
      setFeedbackMsg(null);

      const res = await studentService.resetPassword(selectedStudentId);
      setFeedbackMsg({
        type: 'success',
        text: `Password successfully reset to DOB (${res.temporaryPassword || formatDobToPassword(studentDetail.dob)}). Student can now log in using Admission No & DOB!`,
      });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to reset password.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fee calculation for drawer
  const currentFee = studentDetail?.fees?.[0];
  const feeTotal = currentFee ? Number(currentFee.totalAmount) : 0;
  const feeDiscount = currentFee ? Number(currentFee.discountAmount) : 0;
  const feeNetPayable = Math.max(0, feeTotal - feeDiscount);
  const feePaid = currentFee ? Number(currentFee.paidAmount) : 0;
  const feeDue = currentFee ? Number(currentFee.dueAmount) : Math.max(0, feeNetPayable - feePaid);
  const feeStatus = currentFee ? currentFee.status : 'PENDING';
  const paymentsList = currentFee?.payments || studentDetail?.payments || [];

  const availableSections = classes.find((c) => c.id === editForm.classId)?.sections || [];

  return (
    <DashboardLayout currentRole="admin">
      <PageHeader
        title="Student Scholar Directory"
        subtitle="Manage enrolled students, academic records, fee dues and login accounts"
        badge="Admissions & Records"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadStudents()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/admin/students/admission"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>New Admission</span>
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <GlassCard padding="md" className="border-white/80 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, Roll #, Admission No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/70 border border-white/90 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-700">Class Filter:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 bg-white/80 border border-white/90 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      {/* Students Table */}
      <GlassCard padding="none" className="border-white/80 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-white/60 bg-white/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800">Enrolled Student Roster</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Total active records: <span className="font-bold text-slate-800">{total}</span> • Click any student to view full details, fees & edit
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">No students found matching filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/60 bg-white/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Student & Admission #</th>
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Parent / Guardian</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-center">Fee Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {students.map((s) => {
                  const fee = s.fees?.[0];
                  const feeStatusBadge = fee ? fee.status : 'PENDING';
                  const due = fee ? Number(fee.dueAmount) : 0;

                  return (
                    <tr
                      key={s.id}
                      onClick={() => openStudentModal(s.id)}
                      className="hover:bg-white/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shadow-2xs group-hover:scale-105 transition-transform">
                            {s.firstName[0]}
                            {s.lastName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {s.firstName} {s.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{s.admissionNo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">#{s.rollNo}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/80 border border-white text-slate-700 font-semibold text-[11px] shadow-2xs">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>{s.class?.name || 'Class 10'} — {s.section?.name || 'A'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {s.parent?.fatherName || 'Parent'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {s.parent?.primaryPhone || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            feeStatusBadge === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : feeStatusBadge === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {feeStatusBadge}
                          {due > 0 && <span className="ml-1 opacity-75">(₹{due.toLocaleString('en-IN')})</span>}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openStudentModal(s.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-indigo-50 border border-slate-200/80 text-indigo-700 text-[11px] font-bold shadow-2xs transition-all inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Details & Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStudent(s);
                            }}
                            title="Delete Scholar Record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Interactive Student Details & Edit Drawer / Modal */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl my-auto bg-white/95 backdrop-blur-md rounded-3xl border border-white/90 shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-indigo-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md">
                  {studentDetail ? `${studentDetail.firstName?.[0]}${studentDetail.lastName?.[0]}` : 'ST'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {studentDetail ? `${studentDetail.firstName} ${studentDetail.lastName}` : 'Student Scholar'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 font-mono">
                      {studentDetail?.admissionNo}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        studentDetail?.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {studentDetail?.status || 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {studentDetail?.class?.name} • Section {studentDetail?.section?.name} • Roll #{studentDetail?.rollNo}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentId(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200/60 bg-white/50 px-5 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('details');
                  setFeedbackMsg(null);
                }}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'details'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Overview & Fees</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('edit');
                  setFeedbackMsg(null);
                }}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'edit'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Student & Fee</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('collect-fee');
                  setFeedbackMsg(null);
                }}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'collect-fee'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Collect Fee</span>
              </button>
            </div>

            {/* Feedback Alert */}
            {feedbackMsg && (
              <div
                className={`mx-5 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {feedbackMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            {/* Modal Content */}
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5">
              {loadingDetail ? (
                <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <span className="text-xs font-semibold">Loading student profile & ledger records...</span>
                </div>
              ) : activeTab === 'details' ? (
                /* TAB 1: DETAILS & FEE SUMMARY */
                <div className="space-y-5">
                  {/* Comprehensive Fee Breakdown ("Kitna Fee Hai Kitna Bcha Hai") */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          Fee Status & Accounts Breakdown
                        </h4>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                          feeStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : feeStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {feeStatus === 'PAID' ? 'FEES FULLY PAID' : `FEE STATUS: ${feeStatus}`}
                      </span>
                    </div>

                    {/* 4 Metric Highlights */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div className="p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Annual Fee</span>
                        <span className="text-base font-black text-slate-800">₹{feeTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Concession / Disc.</span>
                        <span className="text-base font-black text-slate-600">₹{feeDiscount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                        <span className="text-[10px] font-bold text-emerald-600 block uppercase">Total Paid</span>
                        <span className="text-base font-black text-emerald-700">₹{feePaid.toLocaleString('en-IN')}</span>
                      </div>
                      <div
                        className={`p-3 rounded-xl border shadow-2xs ${
                          feeDue > 0
                            ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                            : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        }`}
                      >
                        <span className="text-[10px] font-bold block uppercase">
                          Remaining Due (Bacha Hai)
                        </span>
                        <span className="text-base font-black">₹{feeDue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Prominent Due Banner */}
                    {feeDue > 0 ? (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>
                            Pending Balance Dues: <strong>₹{feeDue.toLocaleString('en-IN')}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('collect-fee')}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-2xs"
                        >
                          Collect Fee Now
                        </button>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>All academic fees have been fully cleared for this student.</span>
                      </div>
                    )}

                    {/* Receipts History */}
                    {paymentsList.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-200/60">
                        <h5 className="text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          <span>Recorded Payment Receipts ({paymentsList.length})</span>
                        </h5>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {paymentsList.map((p: any) => (
                            <div
                              key={p.id}
                              className="p-2 rounded-lg bg-white/80 border border-slate-200/60 text-xs flex items-center justify-between"
                            >
                              <div>
                                <span className="font-mono font-bold text-indigo-700">{p.receiptNo}</span>
                                <span className="text-slate-400 text-[10px] ml-2">
                                  {new Date(p.createdAt).toLocaleDateString('en-IN')}
                                </span>
                                <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                                  {p.paymentMethod}
                                </span>
                              </div>
                              <span className="font-bold text-slate-800">
                                ₹{Number(p.amount).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Student Scholar Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Personal & Academic Data */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                        <span>Personal & Academic Info</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Date of Birth</span>
                          <span className="font-semibold text-slate-800">
                            {studentDetail?.dob ? new Date(studentDetail.dob).toLocaleDateString('en-IN') : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Default Password</span>
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {formatDobToPassword(studentDetail?.dob) || 'DOB DDMMYYYY'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Gender</span>
                          <span className="font-semibold text-slate-800">{studentDetail?.gender || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Blood Group</span>
                          <span className="font-semibold text-slate-800">{studentDetail?.bloodGroup || 'N/A'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Residential Address</span>
                          <span className="font-medium text-slate-700">{studentDetail?.address || 'N/A'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Emergency Phone</span>
                          <span className="font-mono font-semibold text-slate-800">
                            {studentDetail?.emergencyContact || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Parent / Guardian Data */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>Parent / Guardian Information</span>
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Father / Guardian</span>
                          <span className="font-semibold text-slate-800">
                            {studentDetail?.parent?.fatherName || studentDetail?.parent?.guardianName || 'N/A'}
                          </span>
                        </div>
                        {studentDetail?.parent?.motherName && (
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Mother's Name</span>
                            <span className="font-semibold text-slate-800">{studentDetail.parent.motherName}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Primary Phone</span>
                          <span className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{studentDetail?.parent?.primaryPhone || 'N/A'}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Registered Email</span>
                          <span className="font-medium text-slate-700 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{studentDetail?.parent?.email || 'N/A'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleResetPassword}
                      className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Reset Password to DOB</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('collect-fee')}
                        className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Collect Fee</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('edit')}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Edit className="w-3.5 h-3.5 text-amber-400" />
                        <span>Edit Student & Fee</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'edit' ? (
                /* TAB 2: EDIT STUDENT & FEE FORM ("admin change v kr skta hai") */
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 font-medium">
                    Modify scholar personal details, class assignment, or annual fee structure. Changes are saved directly to PostgreSQL.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">First Name *</label>
                      <input
                        required
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Last Name *</label>
                      <input
                        required
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Roll Number *</label>
                      <input
                        required
                        type="number"
                        value={editForm.rollNo}
                        onChange={(e) => setEditForm({ ...editForm, rollNo: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Student Status *</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="ALUMNI">ALUMNI</option>
                        <option value="TRANSFERRED">TRANSFERRED</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Class *</label>
                      <select
                        required
                        value={editForm.classId}
                        onChange={(e) => handleClassChangeInEdit(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Section *</label>
                      <select
                        required
                        value={editForm.sectionId}
                        onChange={(e) => setEditForm({ ...editForm, sectionId: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        {availableSections.map((s) => (
                          <option key={s.id} value={s.id}>
                            Section {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Date of Birth *</label>
                      <input
                        required
                        type="date"
                        value={editForm.dob}
                        onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Gender *</label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Blood Group</label>
                      <input
                        type="text"
                        placeholder="e.g. O+, A+, B+"
                        value={editForm.bloodGroup}
                        onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Emergency Phone</label>
                      <input
                        type="text"
                        value={editForm.emergencyContact}
                        onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>

                    <div className="col-span-full">
                      <label className="text-xs font-bold text-slate-700 block mb-1">Residential Address</label>
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>

                  {/* Fee Update Fields */}
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
                    <h5 className="text-xs font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>Adjust Student Annual Fee Structure</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Total Annual Fee (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.totalFee}
                          onChange={(e) => setEditForm({ ...editForm, totalFee: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Discount / Concession (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.discountAmount}
                          onChange={(e) => setEditForm({ ...editForm, discountAmount: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                    </div>
                    <div className="text-[11px] text-indigo-900 font-medium">
                      Net Payable will be <strong>₹{Math.max(0, editForm.totalFee - editForm.discountAmount).toLocaleString('en-IN')}</strong>. Remaining balance will be recalculated automatically against payments already recorded.
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setActiveTab('details')}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* TAB 3: COLLECT FEE FORM */
                <form onSubmit={handleCollectFeeSubmit} className="space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between">
                    <div>
                      <span>Current Outstanding Balance:</span>
                      <strong className="text-sm font-black text-emerald-900 ml-1">
                        ₹{feeDue.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 bg-white/80 px-2 py-0.5 rounded">
                      Official Receipt
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Payment Amount (₹) *</label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={feeForm.amount}
                        onChange={(e) => setFeeForm({ ...feeForm, amount: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Payment Mode *</label>
                      <select
                        value={feeForm.paymentMethod}
                        onChange={(e) => setFeeForm({ ...feeForm, paymentMethod: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        <option value="CASH">CASH</option>
                        <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                        <option value="BANK_TRANSFER">BANK TRANSFER (NEFT / IMPS)</option>
                        <option value="CHEQUE">CHEQUE</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Reference # / Cheque No / UPI Txn ID</label>
                      <input
                        type="text"
                        placeholder="e.g. UPI-2026-98745 or Cheque #12345"
                        value={feeForm.referenceNo}
                        onChange={(e) => setFeeForm({ ...feeForm, referenceNo: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Remarks / Note</label>
                      <input
                        type="text"
                        placeholder="e.g. Q1 Tuition Fee paid in cash"
                        value={feeForm.remarks}
                        onChange={(e) => setFeeForm({ ...feeForm, remarks: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setActiveTab('details')}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Official Receipt...</span>
                        </>
                      ) : (
                        <>
                          <Receipt className="w-4 h-4 text-emerald-200" />
                          <span>Record Receipt & Update Ledger</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
