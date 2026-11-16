'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { studentService } from '@/services/student.service';
import { masterDataService, ClassItem, SectionItem, ParentModel } from '@/services/master-data.service';
import {
  UserPlus,
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  UserCheck,
  Plus,
  Key,
  ShieldCheck,
  Check,
} from 'lucide-react';

export default function AdminStudentAdmissionPage() {
  const router = useRouter();
  const pathname = usePathname();
  const currentRole = pathname.startsWith('/accountant') ? 'accountant' : 'admin';
  const basePath = currentRole === 'accountant' ? '/accountant' : '/admin';

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [parents, setParents] = useState<ParentModel[]>([]);

  // Student Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [admissionNo, setAdmissionNo] = useState(`ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [rollNo, setRollNo] = useState<number>(1);
  const [dob, setDob] = useState('2012-04-15');
  const [gender, setGender] = useState('Female');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('14 Park View Enclave, New Delhi');
  const [emergencyContact, setEmergencyContact] = useState('+91 98111 22334');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');

  // Parent Mode: 'existing' | 'new'
  const [parentMode, setParentMode] = useState<'existing' | 'new'>('existing');
  const [parentId, setParentId] = useState('');

  // New Parent Form Fields
  const [newParentFatherName, setNewParentFatherName] = useState('');
  const [newParentMotherName, setNewParentMotherName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newParentAlternatePhone, setNewParentAlternatePhone] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newParentOccupation, setNewParentOccupation] = useState('');
  const [newParentAddress, setNewParentAddress] = useState('');
  const [newParentEmergency, setNewParentEmergency] = useState('');
  const [newParentPassword, setNewParentPassword] = useState('15-04-2012');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createdStudentAccount, setCreatedStudentAccount] = useState<{ username: string; temporaryPassword?: string } | null>(null);
  const [createdParentCreds, setCreatedParentCreds] = useState<{ username: string; temporaryPassword?: string } | null>(null);

  useEffect(() => {
    const fetchMaster = async () => {
      try {
        setLoading(true);
        const [clsRes, pRes] = await Promise.all([
          masterDataService.getClasses(),
          masterDataService.getParents(),
        ]);
        setClasses(clsRes || []);
        const pList = pRes?.parents || [];
        setParents(pList);

        if (clsRes?.length > 0) {
          const c10 = clsRes.find((c) => c.name === 'Class 10') || clsRes[0];
          setClassId(c10.id);
          if (c10.sections?.length > 0) {
            setSectionId(c10.sections[0].id);
          }
        }

        if (pList.length > 0) {
          setParentId(pList[0].id);
        } else {
          // If no parents exist yet, default to 'new' mode
          setParentMode('new');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load master admissions metadata.');
      } finally {
        setLoading(false);
      }
    };
    fetchMaster();
  }, []);

  const activeSections: SectionItem[] = classes.find((c) => c.id === classId)?.sections || [];

  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    const target = classes.find((c) => c.id === newClassId);
    if (target && target.sections.length > 0) {
      setSectionId(target.sections[0].id);
    } else {
      setSectionId('');
    }
  };

  // Real-time check if new parent credentials already exist
  const duplicateParentMatch = parents.find(
    (p) =>
      (newParentEmail && p.email?.toLowerCase().trim() === newParentEmail.toLowerCase().trim()) ||
      (newParentPhone && p.primaryPhone?.trim() === newParentPhone.trim())
  );

  const handleSelectMatchedParent = () => {
    if (duplicateParentMatch) {
      setParentId(duplicateParentMatch.id);
      setParentMode('existing');
    }
  };

  const handleCopyStudentAddress = () => {
    setNewParentAddress(address);
    setNewParentEmergency(emergencyContact);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !sectionId) {
      setError('Please select a valid Class and Section.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      setCreatedStudentAccount(null);
      setCreatedParentCreds(null);

      let finalParentId = parentId;

      // 1. If Registering a New Parent Inline
      if (parentMode === 'new') {
        if (!newParentFatherName.trim() || !newParentPhone.trim() || !newParentEmail.trim()) {
          setError('Please fill in all required parent fields (Father Name, Primary Mobile Phone, and Email).');
          setSubmitting(false);
          return;
        }

        if (duplicateParentMatch) {
          setError(
            `A parent with this ${duplicateParentMatch.email.toLowerCase() === newParentEmail.toLowerCase() ? 'email' : 'phone'} already exists (${duplicateParentMatch.fatherName}). Click "Select this Existing Parent" above.`
          );
          setSubmitting(false);
          return;
        }

        const parentAddressToUse = newParentAddress.trim() || address.trim() || 'Institutional Address';
        const emergencyToUse = newParentEmergency.trim() || emergencyContact.trim() || newParentPhone.trim();
        const defaultDobPassword = dob ? dob.split('-').reverse().join('-') : '15-04-2012';
        const parentPasswordToSet = newParentPassword.trim() || defaultDobPassword;

        const parentRes = await masterDataService.createParent({
          fatherName: newParentFatherName.trim(),
          motherName: newParentMotherName.trim() || undefined,
          primaryPhone: newParentPhone.trim(),
          alternatePhone: newParentAlternatePhone.trim() || undefined,
          email: newParentEmail.toLowerCase().trim(),
          occupation: newParentOccupation.trim() || undefined,
          address: parentAddressToUse,
          emergencyContact: emergencyToUse,
          temporaryPassword: parentPasswordToSet,
        });

        finalParentId = parentRes.id;
        if (parentRes.credentials) {
          setCreatedParentCreds(parentRes.credentials);
        }

        // Refresh parent list in background
        const refreshed = await masterDataService.getParents();
        setParents(refreshed.parents || []);
      } else {
        if (!finalParentId) {
          setError('Please select an existing parent from the dropdown or switch to "+ Register New Parent".');
          setSubmitting(false);
          return;
        }
      }

      // 2. Admit Scholar
      const res = await studentService.admit({
        admissionNo: admissionNo.trim(),
        rollNo: Number(rollNo),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob,
        gender,
        bloodGroup,
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
        classId,
        sectionId,
        parentId: finalParentId,
      });

      const creds = res?.loginCredentials || res?.generatedAccount;
      if (creds) {
        setCreatedStudentAccount({
          username: creds.username || creds.admissionNo || admissionNo.trim(),
          temporaryPassword: creds.temporaryPassword || res?.loginCredentials?.temporaryPassword,
        });
      }
      setSuccess(`Scholar ${firstName} ${lastName} has been admitted and successfully mapped to the parent profile!`);
    } catch (err: any) {
      setError(err.message || 'Student admission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedParentObj = parents.find((p) => p.id === parentId);

  return (
    <DashboardLayout currentRole={currentRole}>
      <PageHeader
        title="Student Admission Form"
        subtitle="Admit a new scholar with institutional registration, parent guardian linking, and automated portal logins"
        badge="Official Admission Portal"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`${basePath}/parents`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-2xs transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Parents Registry</span>
            </Link>
            <Link
              href={`${basePath}/students`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Roster</span>
            </Link>
          </div>
        }
      />

      <div className="max-w-3xl">
        <GlassCard padding="lg" className="border-white/80 shadow-md">
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Login Credentials Provisioned Card */}
          {(createdStudentAccount || createdParentCreds) && (
            <div className="mb-5 p-4 rounded-2xl bg-indigo-500/10 border-2 border-indigo-500/30 text-slate-900 space-y-3">
              <div className="font-bold text-sm text-indigo-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span>Portal Login Accounts Successfully Provisioned</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {createdStudentAccount && (
                  <div className="p-3 bg-white/90 rounded-xl border border-indigo-100 space-y-1 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 block">🎓 Student Login Account:</span>
                    <div className="text-xs">
                      <span className="text-slate-500 text-[11px]">ID / Username: </span>
                      <strong className="font-mono text-indigo-900">{createdStudentAccount.username}</strong>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500 text-[11px]">Password: </span>
                      <strong className="font-mono text-emerald-800">{createdStudentAccount.temporaryPassword}</strong>
                    </div>
                  </div>
                )}

                {createdParentCreds && (
                  <div className="p-3 bg-white/90 rounded-xl border border-indigo-100 space-y-1 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">👨‍👧 Parent Login Account:</span>
                    <div className="text-xs">
                      <span className="text-slate-500 text-[11px]">Username / Email: </span>
                      <strong className="font-mono text-indigo-900">{createdParentCreds.username}</strong>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500 text-[11px]">Password: </span>
                      <strong className="font-mono text-emerald-800">{createdParentCreds.temporaryPassword}</strong>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-600">
                Both the scholar and parent can now log in to their respective portals at <code>/login</code>.
              </p>

              <div className="pt-1 flex items-center gap-3">
                <Link
                  href={`${basePath}/students`}
                  className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1"
                >
                  <span>View Student in Roster</span> &rarr;
                </Link>
                <Link
                  href={`${basePath}/parents`}
                  className="text-xs font-bold text-slate-700 hover:underline flex items-center gap-1"
                >
                  <span>View Parent in Registry</span> &rarr;
                </Link>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 flex justify-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Scholar Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diya"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/70 border border-white/90 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Verma"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/70 border border-white/90 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Admission Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={admissionNo}
                    onChange={(e) => setAdmissionNo(e.target.value)}
                    className="w-full px-3 py-2 bg-white/70 border border-white/90 rounded-xl text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Roll Number *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={rollNo}
                    onChange={(e) => setRollNo(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white/70 border border-white/90 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 bg-white/70 border border-white/90 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 bg-white/80 border border-white/90 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-white/80 border border-white/90 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              {/* Class & Section (Live Foreign Keys) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                    Enrolled Class *
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.stream ? `(${cls.stream})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                    Section *
                  </label>
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    required
                    disabled={activeSections.length === 0}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  >
                    {activeSections.length === 0 ? (
                      <option value="">No sections available</option>
                    ) : (
                      activeSections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          Section {sec.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* PARENT / GUARDIAN LINKING SECTION (Existing Select or Add New Inline)     */}
              {/* ========================================================================= */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-indigo-100 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-indigo-100/70 pb-2.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-800 text-xs">Parent / Guardian Registration & Linking *</span>
                  </div>

                  <div className="flex items-center p-0.5 bg-slate-200/70 rounded-xl text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setParentMode('existing')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        parentMode === 'existing'
                          ? 'bg-white text-indigo-700 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Select Registered Parent
                    </button>
                    <button
                      type="button"
                      onClick={() => setParentMode('new')}
                      className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                        parentMode === 'new'
                          ? 'bg-indigo-600 text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Register New Parent</span>
                    </button>
                  </div>
                </div>

                {/* MODE 1: Select Existing Parent */}
                {parentMode === 'existing' && (
                  <div className="space-y-2">
                    {parents.length === 0 ? (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                        <span>No parents found in database. Click &ldquo;+ Register New Parent&rdquo; to add one.</span>
                        <button
                          type="button"
                          onClick={() => setParentMode('new')}
                          className="px-2.5 py-1 bg-amber-700 text-white font-bold rounded-lg text-[10px]"
                        >
                          Add New Parent
                        </button>
                      </div>
                    ) : (
                      <>
                        <label className="block text-[11px] font-bold text-slate-700">
                          Choose From Registered Parents List:
                        </label>
                        <select
                          value={parentId}
                          onChange={(e) => setParentId(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                        >
                          {parents.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.fatherName} • Mobile: {p.primaryPhone} • ({p.email})
                            </option>
                          ))}
                        </select>

                        {selectedParentObj && (
                          <div className="p-2.5 rounded-xl bg-white/80 border border-indigo-100 text-[11px] text-slate-600 flex items-center justify-between">
                            <div>
                              <span>Mapped Guardian: </span>
                              <strong className="text-slate-800">{selectedParentObj.fatherName}</strong>
                              <span className="mx-2">•</span>
                              <span>Phone: <strong className="font-mono text-indigo-900">{selectedParentObj.primaryPhone}</strong></span>
                            </div>
                            <span className="text-[10px] text-slate-400">{selectedParentObj.address}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* MODE 2: Register New Parent Inline */}
                {parentMode === 'new' && (
                  <div className="space-y-3 pt-1">
                    {/* Duplicate Detection Alert */}
                    {duplicateParentMatch && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            ⚠️ <strong>Parent Already Exists:</strong> &ldquo;{duplicateParentMatch.fatherName}&rdquo; is already registered with this mobile ({duplicateParentMatch.primaryPhone}) or email ({duplicateParentMatch.email}).
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleSelectMatchedParent}
                          className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] rounded-lg transition-colors shrink-0"
                        >
                          Select this Parent
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-900">Guardian Details & Contact Information</span>
                      <button
                        type="button"
                        onClick={handleCopyStudentAddress}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Copy Scholar Address & Contact
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Father&apos;s Full Name *
                        </label>
                        <input
                          type="text"
                          required={parentMode === 'new'}
                          placeholder="e.g. Ramesh Kumar"
                          value={newParentFatherName}
                          onChange={(e) => setNewParentFatherName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Mother&apos;s Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Anita Kumar"
                          value={newParentMotherName}
                          onChange={(e) => setNewParentMotherName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Primary Mobile Phone (Username) *
                        </label>
                        <input
                          type="text"
                          required={parentMode === 'new'}
                          placeholder="e.g. +91 98765 12345"
                          value={newParentPhone}
                          onChange={(e) => setNewParentPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Alternate Phone
                        </label>
                        <input
                          type="text"
                          placeholder="Optional"
                          value={newParentAlternatePhone}
                          onChange={(e) => setNewParentAlternatePhone(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Email Address (Parent Portal Login) *
                        </label>
                        <input
                          type="email"
                          required={parentMode === 'new'}
                          placeholder="e.g. ramesh.kumar@example.com"
                          value={newParentEmail}
                          onChange={(e) => setNewParentEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Occupation / Profession
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Chartered Accountant"
                          value={newParentOccupation}
                          onChange={(e) => setNewParentOccupation(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Parent Residential Address *
                        </label>
                        <input
                          type="text"
                          required={parentMode === 'new'}
                          placeholder="e.g. 14 Park View Enclave, New Delhi"
                          value={newParentAddress}
                          onChange={(e) => setNewParentAddress(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                          <span>Initial Portal Password</span>
                          <span className="text-[10px] text-indigo-600 font-semibold">(Default: Scholar DOB)</span>
                        </label>
                        <input
                          type="text"
                          value={newParentPassword}
                          onChange={(e) => setNewParentPassword(e.target.value)}
                          placeholder="e.g. 15-04-2012"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      ✨ Parent can log in with their 10-digit mobile phone and child&apos;s DOB (DD-MM-YYYY) or this password. When updated, the new password is automatically shown in the Admin &amp; Accountant directory.
                    </p>
                  </div>
                )}
              </div>

              {/* Scholar Address & Emergency Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Scholar Emergency Phone Contact *
                  </label>
                  <input
                    type="text"
                    required
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full px-3 py-2 bg-white/70 border border-white/90 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Scholar Residential Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white/70 border border-white/90 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  />
                </div>
              </div>

              {/* Submit Actions */}
              <div className="pt-3 border-t border-white/60 flex items-center justify-end gap-3">
                <Link
                  href="/admin/students"
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>
                    {parentMode === 'new'
                      ? 'Register Parent & Admit Scholar'
                      : 'Admit & Link Scholar'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
