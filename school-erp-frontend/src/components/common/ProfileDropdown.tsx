'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '@/types';
import { authService, UserSession } from '@/services/auth.service';
import { GlassCard } from './GlassCard';
import {
  ChevronDown,
  LogOut,
  KeyRound,
  Shield,
  User,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from './Modal';

interface ProfileDropdownProps {
  currentRole: UserRole;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ currentRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [storedUser, setStoredUser] = useState<UserSession | null>(null);

  useEffect(() => {
    setStoredUser(authService.getStoredUser());

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordStatus(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    try {
      const res = await authService.changePassword(currentPassword, newPassword);
      setPasswordStatus(res.message || 'Password changed successfully');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordStatus(null);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || 'Unable to change password');
    }
  };

  const displayName = storedUser?.name || storedUser?.username || 'Institutional User';
  const displayRole = (storedUser?.role || currentRole).toUpperCase();
  const displayEmail = storedUser?.email || `${displayRole.toLowerCase()}@zustand.edu`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-white/60 hover:bg-white/90 border border-white/80 shadow-2xs transition-all focus:outline-none"
        type="button"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs ring-2 ring-white/90 shadow-2xs">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-bold text-slate-800 leading-tight">
            {displayName}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {displayRole}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 z-50 animate-in fade-in zoom-in-95 duration-100">
          <GlassCard className="p-3 shadow-xl border border-white/90 bg-white/95">
            {/* User Header */}
            <div className="pb-3 mb-2 border-b border-slate-100">
              <div className="font-bold text-slate-800 text-xs sm:text-sm">{displayName}</div>
              <div className="text-[11px] text-slate-500 truncate">{displayEmail}</div>
              <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                <Shield className="w-3 h-3 text-amber-600" />
                <span>{displayRole}</span>
              </div>
            </div>

            {/* Menu Actions */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowPasswordModal(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <KeyRound className="w-4 h-4 text-slate-400" />
                <span>Change Password</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        subtitle="Update your institutional ERP account credentials"
      >
        {passwordStatus ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">{passwordStatus}</h4>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {passwordError}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                New Password (Min 8 chars) *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
              >
                Update Password
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
