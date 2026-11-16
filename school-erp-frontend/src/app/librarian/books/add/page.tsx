'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { libraryService, BookCategory } from '@/services/library.service';
import {
  BookPlus,
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';

export default function AddBookPage() {
  const router = useRouter();

  // Simplified Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [totalCopies, setTotalCopies] = useState<number>(3);
  const [rackLocation, setRackLocation] = useState('');

  // Dynamic Categories State
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  // Form Submission State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        // Only load active categories for book creation
        const list = await libraryService.getCategories({ includeInactive: false });
        setCategories(list || []);
        if (list && list.length > 0) {
          setCategoryId(list[0].id);
        }
      } catch (err: any) {
        setError('Failed to load book categories from database. Please configure categories first.');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Book title is required.');
      return;
    }
    if (!categoryId) {
      setError('Please select a valid book category.');
      return;
    }
    if (!totalCopies || totalCopies < 1) {
      setError('Total copies must be a positive number (at least 1).');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const newBook = await libraryService.addBook({
        title: title.trim(),
        categoryId,
        totalCopies: Number(totalCopies),
        rackLocation: rackLocation.trim() || undefined,
      });

      setSuccess(`Book "${newBook.title}" successfully registered with barcode ${newBook.barcode}.`);
      setTimeout(() => {
        router.push('/librarian/books');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to add book title to library repository.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout currentRole="librarian">
      <PageHeader
        title="Add New Book Title"
        subtitle="Catalogue a new title into Zustand Public School Library repository"
        badge="Catalogue Registry"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/librarian/categories"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Manage Categories</span>
            </Link>
            <Link
              href="/librarian/books"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Catalogue</span>
            </Link>
          </div>
        }
      />

      <div className="max-w-2xl">
        <GlassCard padding="lg" className="border-white/80 shadow-md">
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Empty State when no categories exist */}
          {!loadingCategories && categories.length === 0 && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>No active categories found in database</span>
              </div>
              <p className="text-slate-600 mb-3">
                You must configure at least one active category before adding new book titles.
              </p>
              <Link
                href="/librarian/categories"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs hover:bg-slate-800 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Create Book Category</span>
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* 1. Book Title (Required) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Book Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Higher Engineering Mathematics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white/70 border border-white/90 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
              />
            </div>

            {/* 2. Category Dropdown (Dynamically Loaded from PostgreSQL) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Category * (Dynamic from Database)
                </label>
                <Link
                  href="/librarian/categories"
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Layers className="w-3 h-3" />
                  <span>Manage Categories</span>
                </Link>
              </div>

              {loadingCategories ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/60 border border-white/90 rounded-xl text-slate-500 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Loading categories from PostgreSQL...</span>
                </div>
              ) : (
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 border border-white/90 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3. Total Copies (Required Positive Integer) & 4. Shelf / Rack Location (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Total Copies * (Positive Integer)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={totalCopies}
                  onChange={(e) => setTotalCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-white/70 border border-white/90 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Shelf / Rack Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shelf CS-04, Rack B"
                  value={rackLocation}
                  onChange={(e) => setRackLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-white/70 border border-white/90 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 border border-white/80 text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Automatic Inventory Details:</p>
              <p>• Accession barcode is generated automatically upon registration.</p>
              <p>• Initial available copies will equal total copies until issued to students or staff.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/60">
              <Link
                href="/librarian/books"
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || categories.length === 0}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-amber-400" />}
                <span>Save to Library Catalogue</span>
              </button>
            </div>
          </form>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
