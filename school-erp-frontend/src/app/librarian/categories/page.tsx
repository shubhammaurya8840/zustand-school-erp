'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { GlassCard } from '@/components/common/GlassCard';
import { libraryService, BookCategory } from '@/services/library.service';
import {
  Layers,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  Archive,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  BookMarked,
  X,
  Save,
  ArchiveRestore,
} from 'lucide-react';

export default function LibrarianCategoriesPage() {
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [includeInactive, setIncludeInactive] = useState<boolean>(true);

  // Notifications
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<BookCategory | null>(null);

  // Add form fields
  const [addName, setAddName] = useState<string>('');
  const [addDescription, setAddDescription] = useState<string>('');
  const [savingAdd, setSavingAdd] = useState<boolean>(false);
  const [addModalError, setAddModalError] = useState<string | null>(null);

  // Edit form fields
  const [editName, setEditName] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [editModalError, setEditModalError] = useState<string | null>(null);

  // Action loading states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await libraryService.getCategories({
        search: search.trim() || undefined,
        includeInactive: true,
      });
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load book categories from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCategories();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      setAddModalError('Category name is required.');
      return;
    }

    try {
      setSavingAdd(true);
      setAddModalError(null);
      const created = await libraryService.createCategory({
        name: addName.trim(),
        description: addDescription.trim() || undefined,
      });

      setMessage(`Category "${created.name}" created successfully.`);
      setShowAddModal(false);
      setAddName('');
      setAddDescription('');
      await loadCategories();
    } catch (err: any) {
      setAddModalError(err.message || 'Failed to create category.');
    } finally {
      setSavingAdd(false);
    }
  };

  const openEditModal = (cat: BookCategory) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditDescription(cat.description || '');
    setEditIsActive(cat.isActive);
    setEditModalError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editName.trim()) {
      setEditModalError('Category name is required.');
      return;
    }

    try {
      setSavingEdit(true);
      setEditModalError(null);
      const updated = await libraryService.updateCategory(editingCategory.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        isActive: editIsActive,
      });

      setMessage(`Category "${updated.name}" updated successfully.`);
      setEditingCategory(null);
      await loadCategories();
    } catch (err: any) {
      setEditModalError(err.message || 'Failed to update category.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleArchive = async (cat: BookCategory) => {
    const actionLabel = cat.isActive ? 'archive' : 'restore';
    if (!confirm(`Are you sure you want to ${actionLabel} "${cat.name}"?`)) return;

    try {
      setActionLoadingId(cat.id);
      setError(null);
      const updated = await libraryService.archiveCategory(cat.id);
      setMessage(
        `Category "${cat.name}" has been ${updated.isActive ? 'restored to active' : 'archived'}.`,
      );
      await loadCategories();
    } catch (err: any) {
      setError(err.message || `Failed to ${actionLabel} category.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (cat: BookCategory) => {
    if (cat._count && cat._count.books > 0) {
      setError(
        `Cannot delete "${cat.name}" because it is currently linked to ${cat._count.books} book(s) in the catalogue. Please archive the category instead to preserve library records.`,
      );
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete category "${cat.name}"?`)) return;

    try {
      setActionLoadingId(cat.id);
      setError(null);
      await libraryService.deleteCategory(cat.id);
      setMessage(`Category "${cat.name}" permanently deleted.`);
      await loadCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to delete category.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (!includeInactive && !c.isActive) return false;
    return true;
  });

  return (
    <DashboardLayout currentRole="librarian">
      <PageHeader
        title="Book Categories"
        subtitle="Manage library classifications, Dewey subject divisions, and shelf collections"
        badge="Taxonomy Master"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/librarian/books"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-700 text-xs font-semibold border border-white/80 shadow-2xs transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Catalogue</span>
            </Link>
            <button
              onClick={() => {
                setAddModalError(null);
                setAddName('');
                setAddDescription('');
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Add New Category</span>
            </button>
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
              placeholder="Search category by name or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/70 border border-white/90 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-white/60 px-3 py-2 rounded-xl border border-white/80 select-none">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Show Archived</span>
            </label>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              Filter
            </button>

            <button
              type="button"
              onClick={() => {
                setSearch('');
                setIncludeInactive(true);
                loadCategories();
              }}
              className="p-2 bg-white/70 hover:bg-white text-slate-600 rounded-xl border border-white/80 shadow-2xs"
              title="Reset search"
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
          <button onClick={() => setMessage(null)} className="text-xs text-emerald-700 hover:underline">
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
          <button onClick={() => setError(null)} className="text-xs text-rose-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Categories Table */}
      <GlassCard padding="none" className="border-white/80 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-white/60 bg-white/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800">Dynamic Book Categories</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Total categories configured: <span className="font-bold text-slate-800">{filteredCategories.length}</span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Loading book categories from database...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 text-center">
            <Layers className="w-12 h-12 text-slate-400 mx-auto mb-2 opacity-60" />
            <h4 className="text-sm font-bold text-slate-800">No categories found</h4>
            <p className="text-xs text-slate-500 mt-1">Add your first category using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/60 bg-white/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Catalogue Books</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 text-xs">
                {filteredCategories.map((c) => {
                  const bookCount = c._count?.books || 0;
                  return (
                    <tr key={c.id} className="hover:bg-white/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {c.description || <span className="text-slate-400 italic">No description provided</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <BookMarked className="w-3 h-3 text-slate-500" />
                          <span>{bookCount} book{bookCount === 1 ? '' : 's'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            c.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {c.isActive ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            disabled={actionLoadingId === c.id}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                            title="Edit category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Archive / Restore */}
                          <button
                            type="button"
                            onClick={() => handleToggleArchive(c)}
                            disabled={actionLoadingId === c.id}
                            className={`p-1.5 rounded-lg transition-colors ${
                              c.isActive
                                ? 'hover:bg-amber-50 text-amber-600'
                                : 'hover:bg-emerald-50 text-emerald-600'
                            }`}
                            title={c.isActive ? 'Archive category' : 'Restore category'}
                          >
                            {c.isActive ? (
                              <Archive className="w-3.5 h-3.5" />
                            ) : (
                              <ArchiveRestore className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            disabled={actionLoadingId === c.id}
                            className={`p-1.5 rounded-lg transition-colors ${
                              bookCount > 0
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'hover:bg-rose-50 text-rose-600'
                            }`}
                            title={
                              bookCount > 0
                                ? 'Cannot delete: Category is linked to books. Archive instead.'
                                : 'Delete category permanently'
                            }
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

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white/95 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800">Add Book Category</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addModalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{addModalError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robotics & Artificial Intelligence"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief note about the subject domain or shelf collection..."
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdd}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingAdd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-amber-400" />}
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white/95 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800">Edit Category: {editingCategory.name}</h3>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Category is Active (Visible in Add Book dropdown)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
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

