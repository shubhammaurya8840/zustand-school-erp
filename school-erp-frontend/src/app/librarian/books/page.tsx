'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { libraryService, BookItem, BookCategory } from '@/services/library.service';
import {
  BookMarked,
  Search,
  PlusCircle,
  BookOpen,
  Filter,
  RefreshCw,
  Loader2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Edit2,
  X,
  Save,
} from 'lucide-react';

export default function LibrarianBooksPage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit Book Modal State
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editTotalCopies, setEditTotalCopies] = useState<number>(1);
  const [editRackLocation, setEditRackLocation] = useState('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [editModalError, setEditModalError] = useState<string | null>(null);

  // 1. Load Categories
  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await libraryService.getCategories({ includeInactive: false });
      setCategories(data || []);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // 2. Load Books
  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await libraryService.getBooks({
        search: search.trim() || undefined,
        categoryId: selectedCategoryId || undefined,
        limit: 50,
      });
      setBooks(res.books || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load book catalogue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadBooks();
  }, [selectedCategoryId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadBooks();
  };

  const openEditModal = (book: BookItem) => {
    setEditingBook(book);
    setEditTitle(book.title);
    setEditCategoryId(book.categoryId || book.bookCategory?.id || (categories[0]?.id ?? ''));
    setEditTotalCopies(book.totalCopies);
    setEditRackLocation(book.rackLocation || book.rackNo || '');
    setEditModalError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    if (!editTitle.trim()) {
      setEditModalError('Book title is required.');
      return;
    }

    try {
      setSavingEdit(true);
      setEditModalError(null);
      await libraryService.updateBook(editingBook.id, {
        title: editTitle.trim(),
        categoryId: editCategoryId || undefined,
        totalCopies: Number(editTotalCopies),
        rackLocation: editRackLocation.trim() || undefined,
      });

      setMessage(`Book "${editTitle}" successfully updated.`);
      setEditingBook(null);
      await loadBooks();
    } catch (err: any) {
      setEditModalError(err.message || 'Failed to update book.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the catalog?`)) return;

    try {
      setDeletingId(id);
      setError(null);
      const res = await libraryService.deleteBook(id);
      setMessage(res.message || `Book "${title}" successfully removed.`);
      await loadBooks();
    } catch (err: any) {
      setError(err.message || 'Unable to delete book title.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout currentRole="librarian">
      <PageHeader
        title="Library Book Catalogue"
        subtitle="Search institutional inventory, monitor shelf rack locations and accession numbers"
        badge="Media & Archives"
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
              href="/librarian/books/add"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Add New Title</span>
            </Link>
            <Link
              href="/librarian/issue"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Issue Book</span>
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <GlassCard padding="md" className="border-white/80 shadow-sm mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Title, Barcode, Rack location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/70 border border-white/90 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Dynamic Category Filter */}
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="px-3 py-2 bg-white/80 border border-white/90 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategoryId('');
                loadBooks();
              }}
              className="p-2 bg-white/70 hover:bg-white text-slate-600 rounded-xl border border-white/80 shadow-2xs"
              title="Reset filters"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </form>
      </GlassCard>

      {/* Notifications */}
      {message && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs text-emerald-700">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs text-rose-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Books Table */}
      <GlassCard padding="none" className="border-white/80 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-white/60 bg-white/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800">Catalogue Inventory</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Total registered titles: <span className="font-bold text-slate-800">{total}</span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Loading book catalogue from database...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="py-16 text-center">
            <BookMarked className="w-12 h-12 text-slate-400 mx-auto mb-2 opacity-60" />
            <h4 className="text-sm font-bold text-slate-800">No books found matching criteria</h4>
            <p className="text-xs text-slate-500 mt-1">Try clearing filters or add a new title to the library.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/60 bg-white/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Title & Barcode</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Shelf / Rack</th>
                  <th className="py-3 px-4 text-center">Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 text-xs">
                {books.map((b) => {
                  const categoryName = b.bookCategory?.name || b.category || 'General';
                  return (
                    <tr key={b.id} className="hover:bg-white/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{b.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Barcode: {b.barcode}
                          {b.isbn && b.isbn !== 'N/A' && ` • ISBN: ${b.isbn}`}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Layers className="w-2.5 h-2.5" />
                          <span>{categoryName}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {b.rackLocation || b.rackNo || 'General Rack'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            b.availableCopies > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {b.availableCopies} / {b.totalCopies} Available
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(b)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Edit book details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/librarian/issue?barcode=${b.barcode}`}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-all border border-indigo-200"
                          >
                            Issue
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(b.id, b.title)}
                            disabled={deletingId === b.id}
                            className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors disabled:opacity-50"
                            title="Remove or archive book title"
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

      {/* Edit Book Modal */}
      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white/95 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800">Edit Book Title</h3>
              </div>
              <button
                onClick={() => setEditingBook(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editModalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editModalError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Total Copies *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={editTotalCopies}
                    onChange={(e) => setEditTotalCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Rack Location
                  </label>
                  <input
                    type="text"
                    placeholder="Shelf CS-04"
                    value={editRackLocation}
                    onChange={(e) => setEditRackLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-amber-400" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
