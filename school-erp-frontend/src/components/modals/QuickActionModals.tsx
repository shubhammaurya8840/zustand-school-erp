'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { studentService } from '@/services/student.service';
import { feeService } from '@/services/fee.service';
import { libraryService } from '@/services/library.service';
import { noticeService } from '@/services/notice.service';
import { masterDataService, ClassModel, ParentModel } from '@/services/master-data.service';

interface QuickActionModalsProps {
  activeModal: 'add-student' | 'collect-fee' | 'issue-book' | 'send-notice' | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickActionModals({ activeModal, onClose, onSuccess }: QuickActionModalsProps) {
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live master data from PostgreSQL
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [parents, setParents] = useState<ParentModel[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);

  // Admission Form state
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    classId: '',
    sectionId: '',
    parentId: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentAddress: '',
    dob: '2011-05-14',
    gender: 'Male',
    bloodGroup: 'B+',
    address: 'Campus Enclave, New Delhi',
    emergencyPhone: '+91 98765 00000',
    admissionNo: '',
    rollNo: 1,
    studentPassword: '',
  });

  // Fee Form state
  const [feeForm, setFeeForm] = useState({
    studentId: '',
    amount: '15000',
    method: 'UPI' as 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE',
    referenceNo: '',
    remarks: 'Term tuition fee collection',
  });

  // Book Issue state
  const [bookForm, setBookForm] = useState({
    bookId: '',
    studentId: '',
    loanDays: 14,
  });

  // Notice Form state
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    targetAudience: 'ALL',
    content: '',
  });

  // Fetch live master data on modal open
  useEffect(() => {
    if (!activeModal) return;

    let isMounted = true;
    setLoadingData(true);
    setErrorMessage(null);
    setSubmittedMessage(null);

    async function loadModalData() {
      try {
        if (activeModal === 'add-student') {
          const [clsList, parentRes] = await Promise.all([
            masterDataService.getClasses(),
            masterDataService.getParents(),
          ]);
          if (!isMounted) return;
          setClasses(clsList);
          setParents(parentRes.parents || []);

          if (clsList.length > 0) {
            const firstClass = clsList[0];
            const firstSection = firstClass.sections[0];
            const firstParent = parentRes.parents?.[0];

            setStudentForm((prev) => ({
              ...prev,
              classId: firstClass.id,
              sectionId: firstSection ? firstSection.id : '',
              parentId: firstParent ? firstParent.id : 'new',
              admissionNo: `ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              rollNo: Math.floor(1 + Math.random() * 40),
            }));
          }
        } else if (activeModal === 'collect-fee') {
          const stdRes = await studentService.getAll({ limit: 100 });
          if (!isMounted) return;
          setStudents(stdRes.students || []);
          if (stdRes.students?.length > 0) {
            setFeeForm((prev) => ({
              ...prev,
              studentId: stdRes.students[0].id,
              referenceNo: `UPI-${Date.now().toString().slice(-6)}`,
            }));
          }
        } else if (activeModal === 'issue-book') {
          const [bRes, sRes] = await Promise.all([
            libraryService.getBooks({ limit: 50 }),
            studentService.getAll({ limit: 100 }),
          ]);
          if (!isMounted) return;
          setBooks(bRes.books || []);
          setStudents(sRes.students || []);
          if (bRes.books?.length > 0) {
            setBookForm((prev) => ({
              ...prev,
              bookId: bRes.books[0].id,
              studentId: sRes.students?.[0]?.id || '',
            }));
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to load reference data from server.');
        }
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }

    loadModalData();
    return () => {
      isMounted = false;
    };
  }, [activeModal]);

  // Handle Class change in Admission Modal and update available sections
  const handleClassChange = (selectedClassId: string) => {
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    const newSectionId = selectedClass?.sections[0]?.id || '';
    setStudentForm((prev) => ({
      ...prev,
      classId: selectedClassId,
      sectionId: newSectionId,
    }));
  };

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      let finalParentId = studentForm.parentId;

      // If user selected "new parent", create the parent record first
      if (studentForm.parentId === 'new' || !studentForm.parentId) {
        if (!studentForm.parentName || !studentForm.parentPhone) {
          throw new Error('Please enter parent name and primary phone number.');
        }
        const createdParent = await masterDataService.createParent({
          fatherName: studentForm.parentName,
          primaryPhone: studentForm.parentPhone,
          email: studentForm.parentEmail || `parent.${Date.now()}@zustand.edu`,
          address: studentForm.parentAddress || studentForm.address,
          emergencyContact: studentForm.emergencyPhone || studentForm.parentPhone,
        });
        finalParentId = createdParent.id;
      }

      if (!studentForm.classId || !studentForm.sectionId) {
        throw new Error('Please select both a valid Class and Section.');
      }

      const res = await studentService.admit({
        admissionNo: studentForm.admissionNo.trim(),
        rollNo: Number(studentForm.rollNo),
        firstName: studentForm.firstName.trim(),
        lastName: studentForm.lastName.trim(),
        dob: studentForm.dob,
        gender: studentForm.gender,
        bloodGroup: studentForm.bloodGroup,
        address: studentForm.address.trim(),
        emergencyContact: studentForm.emergencyPhone.trim(),
        classId: studentForm.classId,
        sectionId: studentForm.sectionId,
        parentId: finalParentId,
        studentPassword: studentForm.studentPassword || undefined,
      });

      setSubmittedMessage(`Student admitted successfully! Admission No: ${res.admissionNo || studentForm.admissionNo}`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Admission failed. Please review the details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (!feeForm.studentId) {
        throw new Error('Please select a student for fee collection.');
      }

      const res = await feeService.collectFee({
        studentId: feeForm.studentId,
        amount: Number(feeForm.amount),
        paymentMethod: feeForm.method,
        referenceNo: feeForm.referenceNo || `TXN-${Date.now()}`,
        remarks: feeForm.remarks,
      });

      setSubmittedMessage(`Fee receipt generated successfully! Receipt No: ${res.payment?.receiptNo || 'Confirmed'}`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record fee payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (!bookForm.bookId) {
        throw new Error('Please select a book from the library catalogue.');
      }
      if (!bookForm.studentId) {
        throw new Error('Please select a student borrower.');
      }

      const res = await libraryService.issueBook({
        bookId: bookForm.bookId,
        studentId: bookForm.studentId,
        loanDays: Number(bookForm.loanDays),
      });

      setSubmittedMessage(`Book issued successfully! Due Date: ${new Date(res.dueDate).toLocaleDateString()}`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to issue book from library.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
        throw new Error('Please provide notice title and content.');
      }

      await noticeService.create({
        title: noticeForm.title.trim(),
        content: noticeForm.content.trim(),
        category: noticeForm.category,
        priority: noticeForm.priority,
        targetAudience: noticeForm.targetAudience,
      });

      setSubmittedMessage('Institutional announcement published to notice board!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to publish notice.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeClassObj = classes.find((c) => c.id === studentForm.classId);

  return (
    <>
      {/* 1. Add Student Modal */}
      <Modal
        isOpen={activeModal === 'add-student'}
        onClose={onClose}
        title="Student Admission Registration"
        subtitle="Zustand Public School • Institutional Enrolment Form"
        maxWidth="max-w-2xl"
      >
        {submittedMessage ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-slate-800">Admission Processed</h4>
            <p className="text-xs text-slate-600">{submittedMessage}</p>
          </div>
        ) : loadingData ? (
          <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading school classes and parent records...</span>
          </div>
        ) : (
          <form onSubmit={handleAdmissionSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">First Name *</label>
                <input
                  required
                  placeholder="e.g. Aarav"
                  value={studentForm.firstName}
                  onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Last Name *</label>
                <input
                  required
                  placeholder="e.g. Sharma"
                  value={studentForm.lastName}
                  onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Class *</label>
                <select
                  required
                  value={studentForm.classId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.stream ? `(${c.stream})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Section *</label>
                <select
                  required
                  value={studentForm.sectionId}
                  onChange={(e) => setStudentForm({ ...studentForm, sectionId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {activeClassObj?.sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      Section {s.name} (Cap: {s.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Admission Number *</label>
                <input
                  required
                  value={studentForm.admissionNo}
                  onChange={(e) => setStudentForm({ ...studentForm, admissionNo: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Roll Number *</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="100"
                  value={studentForm.rollNo}
                  onChange={(e) => setStudentForm({ ...studentForm, rollNo: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Date of Birth *</label>
                <input
                  required
                  type="date"
                  value={studentForm.dob}
                  onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Gender *</label>
                <select
                  value={studentForm.gender}
                  onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Parent Record Selection */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Parent / Guardian Record *</label>
                <select
                  value={studentForm.parentId}
                  onChange={(e) => setStudentForm({ ...studentForm, parentId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 mb-2"
                >
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fatherName} {p.motherName ? `& ${p.motherName}` : ''} ({p.primaryPhone} • {p.email})
                    </option>
                  ))}
                  <option value="new">+ Register New Parent Details</option>
                </select>

                {studentForm.parentId === 'new' && (
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2 mt-2">
                    <div className="text-[11px] font-bold text-slate-700">New Parent Details</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        placeholder="Father/Guardian Name *"
                        value={studentForm.parentName}
                        onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                      <input
                        placeholder="Primary Phone Number *"
                        value={studentForm.parentPhone}
                        onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                      <input
                        placeholder="Parent Email (optional)"
                        value={studentForm.parentEmail}
                        onChange={(e) => setStudentForm({ ...studentForm, parentEmail: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                      <input
                        placeholder="Residential Address"
                        value={studentForm.parentAddress}
                        onChange={(e) => setStudentForm({ ...studentForm, parentAddress: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Emergency Phone *</label>
                <input
                  required
                  value={studentForm.emergencyPhone}
                  onChange={(e) => setStudentForm({ ...studentForm, emergencyPhone: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Residential Address *</label>
                <input
                  required
                  value={studentForm.address}
                  onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/80">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{submitting ? 'Admitting...' : 'Register Admission'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 2. Collect Fee Modal */}
      <Modal
        isOpen={activeModal === 'collect-fee'}
        onClose={onClose}
        title="Fee Collection (Manual Receipt)"
        subtitle="Record Cash, UPI, Bank Transfer or Cheque Payment"
        maxWidth="max-w-md"
      >
        {submittedMessage ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-slate-800">Fee Payment Recorded</h4>
            <p className="text-xs text-slate-600">{submittedMessage}</p>
          </div>
        ) : loadingData ? (
          <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading student ledger records...</span>
          </div>
        ) : (
          <form onSubmit={handleFeeSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Student Record *</label>
              <select
                required
                value={feeForm.studentId}
                onChange={(e) => setFeeForm({ ...feeForm, studentId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.admissionNo} • Class {s.class?.name || ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                value={feeForm.amount}
                onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Manual Payment Method *</label>
              <select
                value={feeForm.method}
                onChange={(e) => setFeeForm({ ...feeForm, method: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="UPI">UPI / Digital QR</option>
                <option value="CASH">Cash Over Counter</option>
                <option value="BANK_TRANSFER">Direct Bank Transfer (NEFT/RTGS)</option>
                <option value="CHEQUE">Bank Cheque / DD</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Reference / Transaction ID</label>
              <input
                placeholder="e.g. UPI-98432109 or Cheque #4521"
                value={feeForm.referenceNo}
                onChange={(e) => setFeeForm({ ...feeForm, referenceNo: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/80">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{submitting ? 'Recording...' : 'Record Payment'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 3. Issue Book Modal */}
      <Modal
        isOpen={activeModal === 'issue-book'}
        onClose={onClose}
        title="Library Book Circulation"
        subtitle="Issue Catalogued Book to Student"
        maxWidth="max-w-md"
      >
        {submittedMessage ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-slate-800">Book Issued</h4>
            <p className="text-xs text-slate-600">{submittedMessage}</p>
          </div>
        ) : loadingData ? (
          <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading library catalogue...</span>
          </div>
        ) : (
          <form onSubmit={handleBookSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Select Book *</label>
              <select
                required
                value={bookForm.bookId}
                onChange={(e) => setBookForm({ ...bookForm, bookId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.barcode} • Avail: {b.availableCopies}/{b.totalCopies})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Borrower Student *</label>
              <select
                required
                value={bookForm.studentId}
                onChange={(e) => setBookForm({ ...bookForm, studentId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.admissionNo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Loan Duration (Days)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={bookForm.loanDays}
                onChange={(e) => setBookForm({ ...bookForm, loanDays: parseInt(e.target.value) || 14 })}
                className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/80">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{submitting ? 'Issuing...' : 'Issue Book'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 4. Send Notice Modal */}
      <Modal
        isOpen={activeModal === 'send-notice'}
        onClose={onClose}
        title="Publish Official Notice"
        subtitle="Zustand Public School • Institutional Communication"
        maxWidth="max-w-lg"
      >
        {submittedMessage ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-slate-800">Notice Published</h4>
            <p className="text-xs text-slate-600">{submittedMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleNoticeSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Notice Title *</label>
              <input
                required
                placeholder="e.g. Schedule for First Term Examinations 2026"
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Category</label>
                <select
                  value={noticeForm.category}
                  onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="GENERAL">General</option>
                  <option value="ACADEMIC">Academic</option>
                  <option value="EXAM">Examination</option>
                  <option value="EVENT">Event</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Priority</label>
                <select
                  value={noticeForm.priority}
                  onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Target Audience</label>
                <select
                  value={noticeForm.targetAudience}
                  onChange={(e) => setNoticeForm({ ...noticeForm, targetAudience: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="ALL">Entire School</option>
                  <option value="STUDENTS">Students Only</option>
                  <option value="TEACHERS">Teachers Only</option>
                  <option value="PARENTS">Parents Only</option>
                  <option value="STAFF">All Staff</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Notice Content *</label>
              <textarea
                required
                rows={4}
                placeholder="Draft official institutional communication..."
                value={noticeForm.content}
                onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/80">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{submitting ? 'Publishing...' : 'Publish Announcement'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
