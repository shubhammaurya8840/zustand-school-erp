'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { masterDataService, ParentModel } from '@/services/master-data.service';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ShieldCheck,
  UserCheck,
  Key,
} from 'lucide-react';

export default function AdminParentsPage() {
  const pathname = usePathname();
  const currentRole = pathname.startsWith('/accountant') ? 'accountant' : 'admin';

  const [parents, setParents] = useState<ParentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals state
  const [selectedParent, setSelectedParent] = useState<ParentModel | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit / Add Form State
  const [formData, setFormData] = useState({
    id: '',
    fatherName: '',
    motherName: '',
    guardianName: '',
    primaryPhone: '',
    alternatePhone: '',
    email: '',
    occupation: '',
    address: '',
    emergencyContact: '',
    temporaryPassword: 'ParentPass2026!@',
  });

  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; temporaryPassword?: string } | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleRevealPassword = (key: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyPassword = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchParents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await masterDataService.getParents(search || undefined);
      setParents(res.parents || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load parents directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchParents();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Open View Details
  const handleViewParent = async (parent: ParentModel) => {
    try {
      setSelectedParent(parent);
      setIsViewModalOpen(true);
      // Fetch full details with children
      const full = await masterDataService.getParentById(parent.id);
      setSelectedParent(full);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Open Edit Modal
  const handleEditParent = (parent: ParentModel) => {
    setFormData({
      id: parent.id,
      fatherName: parent.fatherName || '',
      motherName: parent.motherName || '',
      guardianName: parent.guardianName || '',
      primaryPhone: parent.primaryPhone || '',
      alternatePhone: parent.alternatePhone || '',
      email: parent.email || '',
      occupation: parent.occupation || '',
      address: parent.address || '',
      emergencyContact: parent.emergencyContact || '',
      temporaryPassword: '',
    });
    setError(null);
    setIsEditModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      id: '',
      fatherName: '',
      motherName: '',
      guardianName: '',
      primaryPhone: '',
      alternatePhone: '',
      email: '',
      occupation: '',
      address: '',
      emergencyContact: '',
      temporaryPassword: 'ParentPass2026!@',
    });
    setError(null);
    setCreatedCredentials(null);
    setIsAddModalOpen(true);
  };

  // Check duplicate phone/email live
  const duplicateMatch = parents.find(
    (p) =>
      p.id !== formData.id &&
      ((formData.email && p.email?.toLowerCase().trim() === formData.email.toLowerCase().trim()) ||
        (formData.primaryPhone && p.primaryPhone?.trim() === formData.primaryPhone.trim()))
  );

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateMatch) {
      setError(`Cannot save: A parent with this ${duplicateMatch.email.toLowerCase() === formData.email.toLowerCase() ? 'email' : 'phone'} already exists (${duplicateMatch.fatherName}).`);
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await masterDataService.updateParent(formData.id, {
        fatherName: formData.fatherName.trim(),
        motherName: formData.motherName?.trim() || undefined,
        guardianName: formData.guardianName?.trim() || undefined,
        primaryPhone: formData.primaryPhone.trim(),
        alternatePhone: formData.alternatePhone?.trim() || undefined,
        email: formData.email.toLowerCase().trim(),
        occupation: formData.occupation?.trim() || undefined,
        address: formData.address.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        temporaryPassword: formData.temporaryPassword.trim() || undefined,
      });
      setSuccess(`Parent profile for ${formData.fatherName} updated successfully.`);
      setIsEditModalOpen(false);
      await fetchParents();
    } catch (err: any) {
      setError(err.message || 'Failed to update parent profile.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Add
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateMatch) {
      setError(`Cannot create: A parent with this ${duplicateMatch.email.toLowerCase() === formData.email.toLowerCase() ? 'email' : 'phone'} already exists (${duplicateMatch.fatherName}).`);
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const res = await masterDataService.createParent({
        fatherName: formData.fatherName.trim(),
        motherName: formData.motherName?.trim() || undefined,
        guardianName: formData.guardianName?.trim() || undefined,
        primaryPhone: formData.primaryPhone.trim(),
        alternatePhone: formData.alternatePhone?.trim() || undefined,
        email: formData.email.toLowerCase().trim(),
        occupation: formData.occupation?.trim() || undefined,
        address: formData.address.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        temporaryPassword: formData.temporaryPassword || 'ParentPass2026!@',
      });

      if (res.credentials) {
        setCreatedCredentials(res.credentials);
      }
      setSuccess(`Parent account for ${formData.fatherName} registered successfully.`);
      await fetchParents();
    } catch (err: any) {
      setError(err.message || 'Failed to register parent.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Parent
  const handleDeleteParent = async (parent: ParentModel) => {
    if (parent.children && parent.children.length > 0) {
      alert(`Cannot delete parent: ${parent.children.length} scholar(s) are actively linked to this family. Please reassign the student(s) first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete parent "${parent.fatherName}" and their login account?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await masterDataService.deleteParent(parent.id);
      setSuccess(`Parent profile for ${parent.fatherName} deleted.`);
      await fetchParents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete parent.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout currentRole={currentRole}>
      <PageHeader
        title="Parents & Guardians Registry"
        subtitle="Manage registered families, linked children roster, contact credentials and parent portal logins"
        badge="Official Family Directory"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/students/admission"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all shadow-2xs"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Admit Scholar</span>
            </Link>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Register New Parent</span>
            </button>
          </div>
        }
      />

      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <GlassCard padding="md" className="mb-5 border-white/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Father, Mother, Mobile Phone, or Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/80 border border-white/90 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
            />
          </div>
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Total Registered Families: <strong className="text-slate-800">{parents.length}</strong></span>
          </div>
        </div>
      </GlassCard>

      {/* Parents Directory Table */}
      <GlassCard padding="none" className="border-white/80 shadow-md overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold">Loading verified parents directory...</span>
          </div>
        ) : parents.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No parent records found</p>
            <p className="text-xs text-slate-400">Click &ldquo;Register New Parent&rdquo; or admit a scholar to register a guardian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/60 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Guardian / Father Name</th>
                  <th className="py-3 px-4">Contact Phone & Email</th>
                  <th className="py-3 px-4">Occupation & Address</th>
                  <th className="py-3 px-4 text-center">Linked Scholars</th>
                  <th className="py-3 px-4 text-left">Portal Login & Live Password</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parents.map((p) => {
                  const childrenCount = p.children?.length || 0;
                  return (
                    <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.fatherName}</div>
                        {p.motherName && (
                          <div className="text-[11px] text-slate-500">Mother: {p.motherName}</div>
                        )}
                        {p.guardianName && p.guardianName !== p.fatherName && (
                          <div className="text-[10px] text-slate-400">Guardian: {p.guardianName}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 font-mono text-slate-800">
                          <Phone className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span>{p.primaryPhone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{p.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {p.occupation && (
                          <div className="flex items-center gap-1 text-slate-700 font-medium">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span>{p.occupation}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-xs" title={p.address}>
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{p.address}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {childrenCount > 0 ? (
                          <button
                            onClick={() => handleViewParent(p)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            <GraduationCap className="w-3 h-3 text-emerald-600" />
                            <span>{childrenCount} Scholar{childrenCount > 1 ? 's' : ''}</span>
                          </button>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                            0 Linked
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800">
                            <ShieldCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span className="font-semibold text-slate-900">{p.primaryPhone}</span>
                            <span className="text-[10px] text-slate-400 font-sans">({p.user?.username || p.email.split('@')[0]})</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <Key className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-bold text-[11px]">
                              {revealedPasswords[p.id] ? (p.visiblePassword || 'DOB: DD-MM-YYYY') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleRevealPassword(p.id)}
                              title={revealedPasswords[p.id] ? 'Hide Password' : 'Show Password'}
                              className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                            >
                              {revealedPasswords[p.id] ? <EyeOff className="w-3.5 h-3.5 text-indigo-600" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            {p.visiblePassword && (
                              <button
                                type="button"
                                onClick={() => handleCopyPassword(p.id, p.visiblePassword!)}
                                title="Copy Password"
                                className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-indigo-600 transition-colors"
                              >
                                {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewParent(p)}
                            title="View Family Details & Linked Children"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white transition-all shadow-2xs border border-transparent hover:border-slate-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEditParent(p)}
                            title="Edit Parent Profile"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-white transition-all shadow-2xs border border-transparent hover:border-slate-200"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteParent(p)}
                            title="Delete Parent (Unlinked only)"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
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

      {/* --- MODAL 1: VIEW FAMILY & LINKED CHILDREN --- */}
      {isViewModalOpen && selectedParent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-white/80 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedParent.fatherName}</h3>
                  <p className="text-[11px] text-slate-500">Official Family Profile & Linked Scholars Roster</p>
                </div>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Parent Details Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Father Name:</span>
                <span className="font-semibold text-slate-800">{selectedParent.fatherName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Mother Name:</span>
                <span className="font-semibold text-slate-800">{selectedParent.motherName || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Primary Phone:</span>
                <span className="font-mono font-semibold text-indigo-900">{selectedParent.primaryPhone}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Address:</span>
                <span className="text-slate-700">{selectedParent.email}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Occupation:</span>
                <span className="text-slate-700">{selectedParent.occupation || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Emergency Contact:</span>
                <span className="font-mono text-slate-700">{selectedParent.emergencyContact}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Residential Address:</span>
                <span className="text-slate-700">{selectedParent.address}</span>
              </div>
            </div>

            {/* Live Parent Portal Credentials */}
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-xs text-indigo-950">Parent Portal Login & Live Password</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Active Access
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100/80 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Login ID (Mobile Phone / User):</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-indigo-950">{selectedParent.primaryPhone}</span>
                    <span className="text-[11px] text-slate-500 font-sans">({selectedParent.user?.username || 'user'})</span>
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100/80 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Live Password:</span>
                    <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                      {revealedPasswords['modal_' + selectedParent.id]
                        ? (selectedParent.visiblePassword || 'Default: Scholar DOB (DD-MM-YYYY)')
                        : '••••••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleRevealPassword('modal_' + selectedParent.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                      title="Show / Hide Password"
                    >
                      {revealedPasswords['modal_' + selectedParent.id] ? (
                        <EyeOff className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    {selectedParent.visiblePassword && (
                      <button
                        type="button"
                        onClick={() => handleCopyPassword('modal_' + selectedParent.id, selectedParent.visiblePassword!)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                        title="Copy Password"
                      >
                        {copiedId === 'modal_' + selectedParent.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-indigo-700 font-medium">
                Parent can log in with their 10-digit mobile number and their initial password (Scholar&apos;s DOB) or any updated password. When changed in the parent portal, the new live password updates here automatically.
              </p>
            </div>

            {/* Linked Scholars Section */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>Enrolled Scholars Linked to this Parent</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px]">
                    {selectedParent.children?.length || 0}
                  </span>
                </h4>
                <Link
                  href="/admin/students/admission"
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  + Admit Sibling
                </Link>
              </div>

              {!selectedParent.children || selectedParent.children.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  No scholars currently linked to this guardian.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedParent.children.map((ch) => (
                    <div
                      key={ch.id}
                      className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {ch.firstName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {ch.firstName} {ch.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>Admission No: <strong className="font-mono text-slate-700">{ch.admissionNo}</strong></span>
                            <span>•</span>
                            <span>Roll: {ch.rollNo}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-800 font-bold text-[11px]">
                          {ch.class?.name || 'Class'} - {ch.section?.name || 'A'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditParent(selectedParent);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Parent Details</span>
              </button>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: EDIT PARENT DETAILS --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-white/80 max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                <span>Edit Parent Profile</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {duplicateMatch && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>⚠️ Note: Another parent already exists with this Phone/Email ({duplicateMatch.fatherName}).</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Father&apos;s Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mother&apos;s Name</label>
                  <input
                    type="text"
                    value={formData.motherName}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.primaryPhone}
                    onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Alternate Phone</label>
                  <input
                    type="text"
                    value={formData.alternatePhone}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address (Login ID) *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Residential Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Emergency Contact Number *</label>
                <input
                  type="text"
                  required
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <label className="block text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>Reset / Change Portal Password (Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to keep current password, or enter new password"
                  value={formData.temporaryPassword}
                  onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <span className="text-[10px] text-slate-400 block">
                  Entering a new password here will update the parent&apos;s login account and update the live password shown in Admin &amp; Accountant dashboards.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !!duplicateMatch}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: REGISTER NEW PARENT --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-white/80 max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Register New Parent & Generate Portal Login</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdCredentials ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
                <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Parent Portal Credentials Successfully Generated!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs bg-white/80 p-3 rounded-lg border border-emerald-100 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Username:</span>
                    <strong className="text-indigo-900">{createdCredentials.username}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Temporary Password:</span>
                    <strong className="text-emerald-800">{createdCredentials.temporaryPassword}</strong>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700">
                  The parent can now log in at <code>/login</code> or be selected during student admissions.
                </p>
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setCreatedCredentials(null);
                    }}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
                  >
                    Done & Return to Directory
                  </button>
                </div>
              </div>
            ) : (
              <>
                {duplicateMatch && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>⚠️ Warning: A parent with this {duplicateMatch.email.toLowerCase() === formData.email.toLowerCase() ? 'email' : 'phone'} already exists in the system ({duplicateMatch.fatherName}).</span>
                  </div>
                )}

                <form onSubmit={handleSaveAdd} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Father&apos;s Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={formData.fatherName}
                        onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Mother&apos;s Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Anita Kumar"
                        value={formData.motherName}
                        onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Mobile Phone *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. +91 98765 12345"
                        value={formData.primaryPhone}
                        onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Alternate Phone</label>
                      <input
                        type="text"
                        placeholder="Optional"
                        value={formData.alternatePhone}
                        onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address (Login Account) *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. ramesh.kumar@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Occupation</label>
                      <input
                        type="text"
                        placeholder="e.g. Business / Service"
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Residential Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. House 12, Sector 8, New Delhi"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Emergency Contact Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. +91 98765 99999"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Initial Password (or Child DOB)</label>
                      <input
                        type="text"
                        placeholder="e.g. 15-05-2011"
                        value={formData.temporaryPassword}
                        onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    Note: Parents can log in with their 10-digit mobile phone and child&apos;s DOB (DD-MM-YYYY) or this password. When updated, the new password is shown in the directory.
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading || !!duplicateMatch}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5 text-amber-400" />}
                      <span>Create Account & Save</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
