'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SchoolLogo } from '@/components/common/SchoolLogo';
import { GlassCard } from '@/components/common/GlassCard';
import { Eye, EyeOff, Lock, User, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services/auth.service';

const DEMO_ROLES = [
  { label: 'Admin', email: 'admin@zustand.edu', pass: 'AdminSecure2026!@' },
  { label: 'Accountant', email: 'accountant@zustand.edu', pass: 'AccountantSecure2026!@' },
  { label: 'Teacher', email: 'teacher@zustand.edu', pass: 'TeacherSecure2026!@' },
  { label: 'Librarian', email: 'librarian@zustand.edu', pass: 'LibrarianSecure2026!@' },
  { label: 'Parent', email: 'parent@zustand.edu', pass: 'ParentSecure2026!@' },
  { label: 'Student', email: 'student@zustand.edu', pass: 'StudentSecure2026!@' },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expiredNotice, setExpiredNotice] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('expired')) {
      setExpiredNotice(true);
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setExpiredNotice(false);
    setIsLoading(true);

    try {
      const response = await authService.login(identifier, password);
      // Redirect to actual role dashboard assigned by backend
      const target = response.user.targetDashboard || '/admin/dashboard';
      router.push(target);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authService.requestPasswordReset(forgotEmail);
      setForgotStatus(res.message || 'Password reset instructions generated.');
    } catch (err: any) {
      setForgotStatus(err.message || 'Unable to request password reset.');
    }
  };

  return (
    <div className="min-h-screen liquid-canvas flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative Pastel Ambient Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-pink-200/35 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-between">
        <SchoolLogo size="lg" showTagline={true} />
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-white/80 text-xs text-slate-600 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Official Institutional Portal</span>
        </div>
      </div>

      {/* Main Glass Card Form */}
      <div className="relative z-10 max-w-md w-full mx-auto my-8">
        <GlassCard padding="xl" className="shadow-2xl border border-white/90">
          <div className="text-center mb-6">
            <div className="inline-flex justify-center mb-3">
              <div className="p-3 bg-white/70 rounded-2xl border border-white/90 shadow-xs">
                <img
                  src="/school-logo.svg"
                  alt="Zustand Public School"
                  className="w-12 h-12 object-contain"
                />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Sign In to Portal
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Zustand Public School • Single-Campus ERP
            </p>
          </div>

          {/* Session Expiry or Error Alert */}
          {expiredNotice && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Your session has expired. Please sign in again.</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4" suppressHydrationWarning>
            {/* Email / Admission No / Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Admission No / Employee ID / Username
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. ADM-2026-1014, TCH-2026-042, or admin"
                  autoComplete="username"
                  suppressHydrationWarning
                  className="w-full pl-10 pr-4 py-2.5 bg-white/70 focus:bg-white/95 border border-white/90 focus:border-indigo-400 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 shadow-2xs transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  suppressHydrationWarning
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (Default: DOB DDMMYYYY)"
                  autoComplete="current-password"
                  suppressHydrationWarning
                  className="w-full pl-10 pr-10 py-2.5 bg-white/70 focus:bg-white/95 border border-white/90 focus:border-indigo-400 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 shadow-2xs transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  suppressHydrationWarning
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Student & Teacher DOB Password Help Banner */}
            <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
              <span className="font-bold">Initial Login:</span> Students and Teachers can sign in using their <strong>Admission No / Employee ID</strong> and Date of Birth as password in <strong>DDMMYYYY</strong> format (e.g. <code>28072002</code>).
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  suppressHydrationWarning
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                />
                <span className="text-xs text-slate-600 font-medium">Keep me signed in</span>
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              suppressHydrationWarning
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="mt-5 pt-4 border-t border-slate-200/60">
            <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider text-center">
              Quick Role Login (Click to Fill)
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {DEMO_ROLES.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => {
                    setIdentifier(r.email);
                    setPassword(r.pass);
                    setErrorMessage(null);
                  }}
                  className="px-2 py-1.5 text-[11px] font-semibold bg-white/70 hover:bg-white text-slate-700 border border-slate-200/80 rounded-lg shadow-2xs hover:border-indigo-400 hover:text-indigo-600 transition-all text-center"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/50 text-center">
            <p className="text-[11px] text-slate-500">
              Institutional security protocol active • All access attempts are audited
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <GlassCard className="max-w-md w-full p-6 shadow-2xl border-white/90 bg-white/95">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Reset Password</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your registered institutional email to receive a password reset token.
            </p>
            {forgotStatus ? (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs">
                {forgotStatus}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@zustand.edu"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotStatus(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
                  >
                    Send Token
                  </button>
                </div>
              </form>
            )}
            {forgotStatus && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotStatus(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 max-w-6xl w-full mx-auto text-center py-2">
        <p className="text-xs text-slate-500 font-medium" suppressHydrationWarning>
          © 2026 Zustand Public School • Knowledge | Character | Bright Future
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen liquid-canvas flex items-center justify-center text-sm font-semibold text-slate-600">Loading portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}
