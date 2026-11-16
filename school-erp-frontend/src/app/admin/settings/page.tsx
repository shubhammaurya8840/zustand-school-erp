'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  School,
  Save,
  CheckCircle2,
  X,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileCheck,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { reportService } from '@/services/report.service';

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    schoolName: 'Zustand Public School',
    tagline: 'Knowledge | Character | Bright Future',
    affiliationNo: 'CBSE/AFF/2026/8912',
    phone: '+91 98765 43210',
    email: 'info@zustandpublicschool.edu',
    website: 'https://zustandpublicschool.edu',
    address: 'Plot 42, Knowledge Boulevard, Sector 12',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    pincode: '221005',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    reportService
      .getSchoolSettings()
      .then((data) => {
        if (data) {
          setForm({
            schoolName: data.schoolName || 'Zustand Public School',
            tagline: data.tagline || 'Knowledge | Character | Bright Future',
            affiliationNo: data.affiliationNo || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            pincode: data.pincode || '',
          });
        }
      })
      .catch((err) => console.error('Failed to load school settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      await reportService.updateSchoolSettings(form);
      setMessage({ type: 'success', text: 'Institutional parameters updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update institutional settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2">
              <Settings className="w-7 h-7 text-navy/70" />
              Institutional Profile & School Settings
            </h1>
            <p className="text-sm text-navy/60">
              Configure institution brand identity, legal affiliation number, and official contacts
            </p>
          </div>
        </div>

        {/* Message */}
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

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-navy/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy/60" />
            <p className="text-sm">Loading configuration...</p>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <GlassCard className="p-6 space-y-6">
              {/* Brand Identity */}
              <div>
                <h3 className="font-bold text-base text-navy pb-3 border-b border-white/60 mb-4 flex items-center gap-2">
                  <School className="w-4 h-4 text-navy/70" />
                  Institutional Identity
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Institution Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={form.schoolName}
                      onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy font-semibold focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Motto / Tagline *</label>
                    <input
                      type="text"
                      required
                      value={form.tagline}
                      onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Board Affiliation Number</label>
                    <input
                      type="text"
                      value={form.affiliationNo}
                      onChange={(e) => setForm({ ...form, affiliationNo: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy font-mono focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Official Website</label>
                    <input
                      type="url"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="font-bold text-base text-navy pb-3 border-b border-white/60 mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-navy/70" />
                  Official Contact Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Primary Email Address *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">Primary Reception Telephone *</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-navy/70 font-medium mb-1">Campus Physical Address *</label>
                    <input
                      type="text"
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div>
                    <label className="block text-navy/70 font-medium mb-1">City</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-navy/70 font-medium mb-1">State</label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>
                    <div>
                      <label className="block text-navy/70 font-medium mb-1">Pincode</label>
                      <input
                        type="text"
                        value={form.pincode}
                        onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-navy/10 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/60 flex justify-end">
                <GlassButton
                  type="submit"
                  disabled={saving}
                  className="bg-navy text-white text-xs px-6 py-2.5 shadow-md hover:bg-navy/90 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Parameters...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Institutional Settings</span>
                    </>
                  )}
                </GlassButton>
              </div>
            </GlassCard>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

