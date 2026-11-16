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

export default function AccountantStaffPage() {
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
    <DashboardLayout currentRole="accountant">
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
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, employee ID, email or designation..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/50 border border-navy/10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-navy/40 shadow-2xs"
              />
            </form>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <Filter className="w-4 h-4 text-navy/40 shrink-0" />
              {['ALL', 'TEACHER', 'ACCOUNTANT', 'LIBRARIAN', 'ADMIN'].map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedRole === r
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white/60 text-navy/70 hover:bg-white border border-white/80'
                  }`}
                >
                  {r === 'ALL' ? 'All Roles' : r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Staff Table */}
        <GlassCard className="overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-navy/40 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="text-xs font-medium">Loading institutional personnel directory...</span>
            </div>
          ) : staffList.length === 0 ? (
            <div className="p-12 text-center text-navy/40">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No staff members found matching criteria.</p>
              <p className="text-xs mt-1">Try refining search parameters or add a new faculty member.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-navy/10 bg-navy/5 text-navy/70 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Role & Dept</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {staffList.map((st) => {
                    const isActive = st.status === 'ACTIVE' || (st.user && st.user.isActive);
                    return (
                      <tr key={st.id} className="hover:bg-white/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                              {st.firstName[0]}
                              {st.lastName ? st.lastName[0] : ''}
                            </div>
                            <div>
                              <div className="font-bold text-navy">
                                {st.firstName} {st.lastName}
                              </div>
                              <div className="text-[10px] text-navy/50">{st.qualification || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                          {st.employeeId}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              st.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-700'
                                : st.role === 'TEACHER'
                                ? 'bg-blue-100 text-blue-700'
                                : st.role === 'ACCOUNTANT'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {st.role}
                          </span>
                          <div className="text-[10px] text-navy/50 mt-0.5">{st.department}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-navy/80">{st.designation}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5 text-[11px] text-navy/70">
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-navy/40" />
                              {st.email}
                            </span>
                            {st.phone && (
                              <span className="flex items-center gap-1.5 font-mono text-[10px]">
                                <Phone className="w-3 h-3 text-navy/40" />
                                {st.phone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                            }`}
                          >
                            {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(st)}
                              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/50 shadow-2xs transition-colors cursor-pointer"
                              title="Edit Staff Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(st.id, `${st.firstName} ${st.lastName}`)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200/60'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200/60'
                              }`}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
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

        {/* Add Staff Modal */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/95 rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-white/80 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-4 border-b border-navy/10">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-bold text-navy">Add New Staff Member</h2>
                  </div>
                  <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-navy/5 rounded-full">
                    <X className="w-5 h-5 text-navy/50" />
                  </button>
                </div>

                <form onSubmit={handleCreateStaff} className="space-y-4 pt-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-800 font-bold">Employee ID *</label>
                        {generatingId && <span className="text-[10px] text-indigo-600 animate-pulse font-semibold">Generating...</span>}
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        placeholder="e.g. EMP-2026-009"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
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
                        <option value="ADMIN">School Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vikram"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Verma"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Official Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="v.verma@zustand.edu"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Designation *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Senior Faculty"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Department *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Academics"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Qualification</label>
                      <input
                        type="text"
                        placeholder="e.g. M.Sc, B.Ed"
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Joining Date</label>
                      <input
                        type="date"
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1">Temporary Initial Password</label>
                    <input
                      type="text"
                      required
                      value={formData.temporaryPassword}
                      onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                    />
                    <p className="text-[10px] text-navy/50 mt-1">Staff member can reset this upon their initial login.</p>
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
                          <span>Registering...</span>
                        </div>
                      ) : (
                        <span>Register Staff Member</span>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/95 rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-white/80 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-4 border-b border-navy/10">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-bold text-navy">Edit Staff Member Details</h2>
                  </div>
                  <button onClick={() => setEditingStaff(null)} className="p-1 hover:bg-navy/5 rounded-full">
                    <X className="w-5 h-5 text-navy/50" />
                  </button>
                </div>

                <form onSubmit={handleUpdateStaff} className="space-y-4 pt-4 text-xs">
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-indigo-700 font-bold block uppercase tracking-wider">Employee ID</span>
                      <span className="font-mono font-bold text-sm text-slate-800">{editingStaff.employeeId}</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                      {editingStaff.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <label className="block text-slate-800 font-bold mb-1">Department *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.department}
                        onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Institutional Role</label>
                      <select
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                      >
                        <option value="TEACHER">Teacher</option>
                        <option value="ACCOUNTANT">Accountant</option>
                        <option value="LIBRARIAN">Librarian</option>
                        <option value="ADMIN">School Administrator</option>
                      </select>
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

