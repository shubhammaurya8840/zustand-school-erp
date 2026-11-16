'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  Phone,
  Briefcase,
  Shield,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  GraduationCap,
  RefreshCw,
  Edit3,
  Save,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { staffService, StaffListItem } from '@/services/staff.service';

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<StaffListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New staff form state
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    role: 'TEACHER',
    designation: 'Senior Faculty',
    qualification: 'M.Sc, B.Ed',
    phone: '',
    email: '',
    joiningDate: new Date().toISOString().split('T')[0],
    department: 'Academics',
    temporaryPassword: 'TempPassword123!',
  });

  const [generatingId, setGeneratingId] = useState(false);

  const generateAndSetEmployeeId = async (targetRole: string) => {
    try {
      setGeneratingId(true);
      const res = await staffService.getNextEmployeeId(targetRole);
      if (res?.nextEmployeeId) {
        setFormData((prev) => ({ ...prev, employeeId: res.nextEmployeeId, role: targetRole }));
      }
    } catch (err) {
      const prefix = targetRole === 'TEACHER' ? 'ZPS-TCH' : targetRole === 'ACCOUNTANT' ? 'ZPS-ACC' : targetRole === 'LIBRARIAN' ? 'ZPS-LIB' : 'ZPS-STF';
      const count = (staffList?.length || 0) + 1;
      setFormData((prev) => ({ ...prev, employeeId: `${prefix}-${String(count).padStart(3, '0')}`, role: targetRole }));
    } finally {
      setGeneratingId(false);
    }
  };

  // Edit staff modal state
  const [editingStaff, setEditingStaff] = useState<StaffListItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'TEACHER',
    designation: '',
    qualification: '',
    phone: '',
    email: '',
    department: '',
  });

  const handleOpenEdit = (st: StaffListItem) => {
    setEditingStaff(st);
    setEditFormData({
      firstName: st.firstName || '',
      lastName: st.lastName || '',
      role: st.role || 'TEACHER',
      designation: st.designation || '',
      qualification: st.qualification || '',
      phone: st.phone || '',
      email: st.email || '',
      department: st.department || '',
    });
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      setSubmitting(true);
      setMessage(null);
      await staffService.update(editingStaff.id, {
        firstName: editFormData.firstName.trim(),
        lastName: editFormData.lastName.trim(),
        role: editFormData.role,
        designation: editFormData.designation.trim(),
        qualification: editFormData.qualification.trim(),
        phone: editFormData.phone.trim(),
        email: editFormData.email.trim(),
        department: editFormData.department.trim(),
      });
      setMessage({ type: 'success', text: `Staff member ${editFormData.firstName} ${editFormData.lastName} updated successfully!` });
      setEditingStaff(null);
      loadStaff();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update staff member' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
    generateAndSetEmployeeId(formData.role || 'TEACHER');
  };

  const handleRoleChange = (newRole: string) => {
    setFormData((prev) => ({ ...prev, role: newRole }));
    generateAndSetEmployeeId(newRole);
  };

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await staffService.getAll({
        role: selectedRole !== 'ALL' ? selectedRole : undefined,
        search: search.trim() ? search.trim() : undefined,
      });
      setStaffList(res.staff || []);
    } catch (err: any) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [selectedRole]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStaff();
  };

  const handleToggleStatus = async (id: string, name: string) => {
    try {
      await staffService.toggleStatus(id);
      setMessage({ type: 'success', text: `Status updated for ${name}` });
      loadStaff();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update status' });
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMessage(null);
      await staffService.create(formData);
      setMessage({ type: 'success', text: `Staff member ${formData.firstName} ${formData.lastName} created successfully with ID ${formData.employeeId}!` });
      setIsAddModalOpen(false);
      setFormData({
        employeeId: '',
        firstName: '',
        lastName: '',
        role: 'TEACHER',
        designation: 'Senior Faculty',
        qualification: 'M.Sc, B.Ed',
        phone: '',
        email: '',
        joiningDate: new Date().toISOString().split('T')[0],
        department: 'Academics',
        temporaryPassword: 'TempPassword123!',
      });
      loadStaff();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to register staff member' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-navy/70" />
              Staff & Faculty Directory
            </h1>
            <p className="text-sm text-navy/60">
              Manage school teachers, administrators, accountants, and library staff
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Add Staff Member</span>
          </button>
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

        {/* Filter & Search Bar */}
        <GlassCard className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/40" />
                <input
                  type="text"
                  placeholder="Search by name, employee ID, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-white/60 border border-white/60 text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-navy/50" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl bg-white/60 border border-white/60 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                <option value="ALL">All Roles</option>
                <option value="TEACHER">Teachers</option>
                <option value="ACCOUNTANT">Accountants</option>
                <option value="LIBRARIAN">Librarians</option>
                <option value="SCHOOL_ADMIN">School Admins</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Staff Table / Cards */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Loading staff members...</p>
          </div>
        ) : staffList.length === 0 ? (
          <GlassCard className="p-12 text-center text-navy/50">
            <Users className="w-12 h-12 mx-auto text-navy/20 mb-3" />
            <p className="text-base font-semibold text-navy">No staff members found</p>
            <p className="text-xs text-navy/40 mt-1">Try adjusting your search or filters</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {staffList.map((st) => (
              <GlassCard key={st.id} className="p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center font-bold text-navy text-sm border border-white/60">
                        {st.firstName[0]}
                        {st.lastName[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy text-sm">
                          {st.firstName} {st.lastName}
                        </h3>
                        <p className="text-xs text-navy/50 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> {st.designation}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        st.role === 'TEACHER'
                          ? 'bg-blue-500/10 text-blue-800 border-blue-500/20'
                          : st.role === 'ACCOUNTANT'
                          ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20'
                          : st.role === 'LIBRARIAN'
                          ? 'bg-amber-500/10 text-amber-800 border-amber-500/20'
                          : 'bg-purple-500/10 text-purple-800 border-purple-500/20'
                      }`}
                    >
                      {st.role}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-navy/70 border-t border-white/50 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-navy/40">Employee ID:</span>
                      <span className="font-mono font-medium">{st.employeeId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-navy/40">Department:</span>
                      <span className="font-medium">{st.department}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-navy/40">Qualification:</span>
                      <span className="font-medium">{st.qualification}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-navy/40">Email:</span>
                      <span className="font-medium truncate max-w-[160px]">{st.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-navy/40">Phone:</span>
                      <span className="font-medium">{st.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/50 pt-3 mt-4">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                      st.status === 'ACTIVE' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {st.status === 'ACTIVE' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    {st.status}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(st)}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all shadow-xs cursor-pointer"
                      title="Edit Staff Member Details"
                    >
                      <Edit3 className="w-3 h-3 text-amber-400" />
                      <span>Edit</span>
                    </button>
                    <GlassButton
                      onClick={() => handleToggleStatus(st.id, `${st.firstName} ${st.lastName}`)}
                      className="text-[11px] px-2.5 py-1"
                    >
                      {st.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Add Staff Modal */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60 space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-navy/10 pb-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-navy" />
                    <h2 className="text-lg font-bold text-navy">Add New Staff Member</h2>
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-1 rounded-full hover:bg-navy/5 text-navy/60"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateStaff} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-800 font-bold">
                          Employee ID * <span className="text-[10px] text-indigo-600 font-semibold">(Auto-Generated)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => generateAndSetEmployeeId(formData.role)}
                          disabled={generatingId}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Regenerate next sequential ID"
                        >
                          <RefreshCw className={`w-3 h-3 ${generatingId ? 'animate-spin' : ''}`} />
                          <span>Regenerate</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ZPS-TCH-005"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Sequential staff sequence (e.g. <code>ZPS-TCH-005</code>), distinct from student admission numbers.
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Institutional Role *</label>
                      <select
                        value={formData.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      >
                        <option value="TEACHER">Teacher</option>
                        <option value="ACCOUNTANT">Accountant</option>
                        <option value="LIBRARIAN">Librarian</option>
                        <option value="SCHOOL_ADMIN">School Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-navy/70 font-medium mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vikram"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>

                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Verma"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>

                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Official Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="v.verma@zustand.edu"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>

                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>

                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Designation *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Senior Faculty / Head of Dept"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>

                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Department *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Science / Mathematics / Accounts"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>

                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Qualification</label>
                      <input
                        type="text"
                        placeholder="e.g. M.Sc, B.Ed, PhD"
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>

                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Joining Date</label>
                      <input
                        type="date"
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-navy/70 font-medium mb-1">Temporary Initial Password</label>
                      <input
                        type="text"
                        value={formData.temporaryPassword}
                        onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy font-mono focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                      <p className="text-[10px] text-navy/40 mt-1">Staff member can reset this upon their initial login.</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-navy/10">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Creating...</span>
                        </div>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 text-amber-400" />
                          <span>Save & Create Staff Account</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Staff Modal */}
        <AnimatePresence>
          {editingStaff && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60 space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-navy/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h2 className="text-lg font-bold text-navy">Edit Staff Member</h2>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {editingStaff.employeeId} • {editingStaff.firstName} {editingStaff.lastName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingStaff(null)}
                    className="p-1 rounded-full hover:bg-navy/5 text-navy/60"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateStaff} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.firstName}
                        onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.lastName}
                        onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Institutional Role *</label>
                      <select
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      >
                        <option value="TEACHER">Teacher</option>
                        <option value="ACCOUNTANT">Accountant</option>
                        <option value="LIBRARIAN">Librarian</option>
                        <option value="SCHOOL_ADMIN">School Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Department *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.department}
                        onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Official Email *</label>
                      <input
                        type="email"
                        required
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Designation *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.designation}
                        onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Qualification *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.qualification}
                        onChange={(e) => setEditFormData({ ...editFormData, qualification: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-navy/10">
                    <button
                      type="button"
                      onClick={() => setEditingStaff(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <>
                          <Save className="w-4 h-4 text-amber-400" />
                          <span>Update Staff Member</span>
                        </>
                      )}
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

