'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { libraryService, BookItem, BookCategory } from '@/services/library.service';
import { studentService } from '@/services/student.service';
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
  Barcode,
  ArrowRightLeft,
} from 'lucide-react';

export default function AccountantLibraryPage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add Book Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newTotalCopies, setNewTotalCopies] = useState<number>(3);
  const [newRackLocation, setNewRackLocation] = useState('Shelf A-1');
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addModalError, setAddModalError] = useState<string | null>(null);

  // Edit Book Modal State
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editTotalCopies, setEditTotalCopies] = useState<number>(1);
  const [editRackLocation, setEditRackLocation] = useState('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [editModalError, setEditModalError] = useState<string | null>(null);

  // Quick Issue Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedBookForIssue, setSelectedBookForIssue] = useState<string>('');
  const [selectedStudentForIssue, setSelectedStudentForIssue] = useState<string>('');
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loanDays, setLoanDays] = useState<number>(14);
  const [issuingBook, setIssuingBook] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  // 1. Load Categories
  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await libraryService.getCategories({ includeInactive: false });
      setCategories(data || []);
      if (data && data.length > 0 && !newCategoryId) {
        setNewCategoryId(data[0].id);
      }
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

  // 3. Load Students for Issue Modal
  const loadStudentsForIssue = async () => {
    try {
      const res = await studentService.getAll({ limit: 100 });
      setStudentsList(res.students || []);
      if (res.students && res.students.length > 0) {
        setSelectedStudentForIssue(res.students[0].id);
      }
    } catch (err) {
      console.error('Failed to load students for book issue:', err);
    }
  };

  useEffect(() => {
    loadCategories();
    loadBooks();
    loadStudentsForIssue();
  }, []);

  useEffect(() => {
    loadBooks();
  }, [selectedCategoryId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadBooks();
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
    setNewTitle('');
    setNewAuthor('');
    setNewTotalCopies(3);
    setNewRackLocation('Shelf A-1');
    setAddModalError(null);
    if (categories.length > 0) {
      setNewCategoryId(categories[0].id);
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setAddModalError('Book title is required.');
      return;
    }
    if (!newCategoryId) {
      setAddModalError('Please select a book category.');
      return;
    }
    if (newTotalCopies < 1) {
      setAddModalError('Total copies must be at least 1.');
      return;
    }

    try {
      setSubmittingAdd(true);
      setAddModalError(null);
      const created = await libraryService.addBook({
        title: newTitle.trim(),
        categoryId: newCategoryId,
        author: newAuthor.trim() || undefined,
        totalCopies: Number(newTotalCopies),
        rackLocation: newRackLocation.trim() || undefined,
      });

      setMessage(`Book "${created.title}" successfully added with barcode ${created.barcode}.`);
      setIsAddModalOpen(false);
      loadBooks();
    } catch (err: any) {
      setAddModalError(err.message || 'Failed to register book.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleOpenEdit = (book: BookItem) => {
    setEditingBook(book);
    setEditTitle(book.title);
    setEditCategoryId(book.categoryId || book.bookCategory?.id || (categories[0]?.id || ''));
    setEditTotalCopies(book.totalCopies || 1);
    setEditRackLocation(book.rackLocation || book.rackNo || '');
    setEditModalError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    if (!editTitle.trim()) {
      setEditModalError('Book title cannot be blank.');
      return;
    }

    try {
      setSavingEdit(true);
      setEditModalError(null);
      await libraryService.updateBook(editingBook.id, {
        title: editTitle.trim(),
        categoryId: editCategoryId,
        totalCopies: Number(editTotalCopies),
        rackLocation: editRackLocation.trim(),
      });
      setMessage(`Book "${editTitle}" updated successfully.`);
      setEditingBook(null);
      loadBooks();
    } catch (err: any) {
      setEditModalError(err.message || 'Failed to update book.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteBook = async (book: BookItem) => {
    if (!confirm(`Are you sure you want to remove "${book.title}" from library inventory?`)) return;
    try {
      await libraryService.deleteBook(book.id);
      setMessage(`Book "${book.title}" removed successfully.`);
      loadBooks();
    } catch (err: any) {
      setError(err.message || 'Failed to delete book.');
    }
  };

  const handleOpenIssueModal = (bookId?: string) => {
    if (bookId) {
      setSelectedBookForIssue(bookId);
    } else if (books.length > 0) {
      const avail = books.find((b) => b.availableCopies > 0) || books[0];
      setSelectedBookForIssue(avail.id);
    }
    setIssueError(null);
    setIsIssueModalOpen(true);
  };

  const handleIssueBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForIssue || !selectedStudentForIssue) {
      setIssueError('Please select both a book title and a student.');
      return;
    }

    try {
      setIssuingBook(true);
      setIssueError(null);
      await libraryService.issueBook({
        bookId: selectedBookForIssue,
        studentId: selectedStudentForIssue,
        loanDays: Number(loanDays) || 14,
      });

      setMessage('Book successfully issued to scholar.');
      setIsIssueModalOpen(false);
      loadBooks();
    } catch (err: any) {
      setIssueError(err.message || 'Failed to issue book.');
    } finally {
      setIssuingBook(false);
    }
  };

  return (
    <DashboardLayout currentRole="accountant">
      <PageHeader
        title="Institutional Library & Book Repository"
        subtitle="Manage literary catalogue, register acquisitions, inspect copy availability and manage book circulation"
        badge="Catalogue Registry"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenIssueModal()}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
              <span>Issue Book</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Book Title</span>
            </button>
          </div>
        }
      />

      {message && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="p-0.5 hover:opacity-75">
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
          <button onClick={() => setError(null)} className="p-0.5 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <GlassCard padding="md" className="border-white/80 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by book title, author, barcode or ISBN..."
                className="w-full pl-9 pr-4 py-2 bg-white/70 border border-white/90 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-white/80 hover:bg-white text-slate-700 text-xs font-semibold rounded-xl border border-white/90 shadow-2xs transition-all"
            >
              Search
            </button>
          </form>

          {/* Category Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="px-3 py-1.5 bg-white/80 border border-white/90 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
            >
              <option value="">All Categories ({total})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {cat._count ? `(${cat._count.books})` : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategoryId('');
                loadBooks();
              }}
              className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-600 border border-white/80 shadow-2xs"
              title="Reset Filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Book Catalogue Table */}
      <GlassCard padding="none" className="border-white/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Loading book records from PostgreSQL...</span>
          </div>
        ) : books.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-400" />
            <p className="text-sm font-semibold text-slate-600">No books catalogued in this category.</p>
            <p className="text-xs text-slate-400 mt-1">Click "Add Book Title" to register a new volume.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/60 bg-white/40 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Title & Author</th>
                  <th className="py-3 px-4">Barcode</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Shelf Location</th>
                  <th className="py-3 px-4">Copies (Avail / Total)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/50">
                {books.map((b) => {
                  const catName = b.bookCategory?.name || b.category || 'General';
                  const isAvailable = (b.availableCopies || 0) > 0;
                  return (
                    <tr key={b.id} className="hover:bg-white/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 text-xs">{b.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {b.author ? `by ${b.author}` : 'Institutional Volume'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        <span className="flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-slate-400" />
                          {b.barcode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          {catName}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {b.rackLocation || b.rackNo || 'Shelf A-1'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {b.availableCopies} / {b.totalCopies} Available
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAvailable && (
                            <button
                              type="button"
                              onClick={() => handleOpenIssueModal(b.id)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200 shadow-2xs transition-all"
                            >
                              Issue
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(b)}
                            className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-700 border border-white/90 shadow-2xs transition-all"
                            title="Edit Book"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBook(b)}
                            className="p-1.5 rounded-lg bg-white/80 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-white/90 shadow-2xs transition-all"
                            title="Delete Book"
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

      {/* Add Book Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/95 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-white/80"
            >
              <div className="flex items-center justify-between pb-4 border-b border-navy/10">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-navy">Add New Book Title</h2>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-navy/5 rounded-full">
                  <X className="w-5 h-5 text-navy/50" />
                </button>
              </div>

              {addModalError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{addModalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateBook} className="space-y-4 pt-4 text-xs">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Book Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Higher Secondary Mathematics Vol. 2"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">Author / Editor</label>
                    <input
                      type="text"
                      placeholder="e.g. R.D. Sharma"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1">Category *</label>
                    <select
                      value={newCategoryId}
                      onChange={(e) => setNewCategoryId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">Total Copies *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newTotalCopies}
                      onChange={(e) => setNewTotalCopies(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1">Rack / Shelf Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Shelf A-3"
                      value={newRackLocation}
                      onChange={(e) => setNewRackLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                    />
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
                    disabled={submittingAdd}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submittingAdd ? (
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Registering...</span>
                      </div>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-amber-400" />
                        <span>Save Book Title</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Book Modal */}
      <AnimatePresence>
        {editingBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/95 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-white/80"
            >
              <div className="flex items-center justify-between pb-4 border-b border-navy/10">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-navy">Edit Book Details</h2>
                </div>
                <button onClick={() => setEditingBook(null)} className="p-1 hover:bg-navy/5 rounded-full">
                  <X className="w-5 h-5 text-navy/50" />
                </button>
              </div>

              {editModalError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editModalError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4 pt-4 text-xs">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Book Title *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Category</label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">Total Copies *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editTotalCopies}
                      onChange={(e) => setEditTotalCopies(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1">Rack / Shelf Location</label>
                    <input
                      type="text"
                      value={editRackLocation}
                      onChange={(e) => setEditRackLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-navy/10">
                  <button
                    type="button"
                    onClick={() => setEditingBook(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {savingEdit ? (
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </div>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-amber-400" />
                        <span>Update Book</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Issue Book Modal */}
      <AnimatePresence>
        {isIssueModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/95 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-white/80"
            >
              <div className="flex items-center justify-between pb-4 border-b border-navy/10">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-navy">Issue Library Book</h2>
                </div>
                <button onClick={() => setIsIssueModalOpen(false)} className="p-1 hover:bg-navy/5 rounded-full">
                  <X className="w-5 h-5 text-navy/50" />
                </button>
              </div>

              {issueError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{issueError}</span>
                </div>
              )}

              <form onSubmit={handleIssueBookSubmit} className="space-y-4 pt-4 text-xs">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Select Book Title *</label>
                  <select
                    value={selectedBookForIssue}
                    onChange={(e) => setSelectedBookForIssue(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  >
                    {books.map((b) => (
                      <option key={b.id} value={b.id} disabled={(b.availableCopies || 0) <= 0}>
                        {b.title} ({b.availableCopies} available) • Barcode: {b.barcode}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Select Scholar / Member *</label>
                  <select
                    value={selectedStudentForIssue}
                    onChange={(e) => setSelectedStudentForIssue(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  >
                    {studentsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} (Adm: {s.admissionNo}) • {s.class?.name || 'Class'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Loan Period (Days) *</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={loanDays}
                    onChange={(e) => setLoanDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-navy/10">
                  <button
                    type="button"
                    onClick={() => setIsIssueModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={issuingBook}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {issuingBook ? (
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Issuing...</span>
                      </div>
                    ) : (
                      <>
                        <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                        <span>Issue Book</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

