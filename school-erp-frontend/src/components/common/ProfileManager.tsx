'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { authService, UserSession } from '@/services/auth.service';
import { UserRole } from '@/types';
import {
  User,
  Shield,
  Key,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ProfileManagerProps {
  currentRole: UserRole;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({ currentRole }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await authService.getProfile();
        setProfile(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load profile data.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    try {
      setPwLoading(true);
      const res = await authService.changePassword(currentPassword, newPassword);
      setPwSuccess(res.message || 'Password successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.message || 'Failed to update password.');
    } finally {
      setPwLoading(false);
    }
  };

  const storedUser: UserSession | null = authService.getStoredUser();

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold">Loading profile information...</p>
      </div>
    );
  }

  const staff = profile?.staff;
  const parent = profile?.parent;
  const student = profile?.student;

  const displayName =
    staff ? `${staff.firstName} ${staff.lastName}`
    : student ? `${student.firstName} ${student.lastName}`
    : parent ? `${parent.fatherName}`
    : storedUser?.name || profile?.username || 'User Profile';

  const roleTitle = profile?.role || currentRole.toUpperCase();
  const email = profile?.email || storedUser?.email || 'N/A';
  const designation = staff?.designation || (student ? `Student • Roll #${student.rollNo}` : parent ? 'Parent / Guardian' : 'Institutional Staff');
  const department = staff?.department || (student ? student.class?.name : 'Administration');
  const phone = staff?.phone || student?.emergencyContact || parent?.primaryPhone || '+91 Institutional Hotline';

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <GlassCard padding="lg" className="border-white/80 shadow-md">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
            {displayName[0]}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-xl font-black text-slate-800">{displayName}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {roleTitle}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-semibold mb-4">
              {designation} • {department}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 border border-white/80">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-700 font-medium truncate">{email}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 border border-white/80">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-700 font-medium truncate">{phone}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 border border-white/80">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-700 font-medium">Single-School Authenticated</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Change Password Card */}
      <GlassCard padding="lg" className="border-white/80 shadow-md max-w-xl">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/60">
          <Key className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-black text-slate-800">Change Password</h3>
            <p className="text-[11px] text-slate-500">Update your institutional account credentials</p>
          </div>
        </div>

        {pwSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{pwSuccess}</span>
          </div>
        )}

        {pwError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{pwError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter existing password"
                className="w-full px-3 py-2 bg-white/70 border border-white/90 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 bg-white/70 border border-white/90 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3 py-2 bg-white/70 border border-white/90 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono shadow-2xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
            </button>

            <button
              type="submit"
              disabled={pwLoading}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {pwLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

