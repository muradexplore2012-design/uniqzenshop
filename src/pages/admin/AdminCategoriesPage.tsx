import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Layers, Check, X, Loader2 } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { EmptyState } from '../../components/common/EmptyState';
import { SingleImageUploader } from '../../components/admin/SingleImageUploader';
import { getAllCategoriesAdmin, saveCategory, deleteCategory } from '../../services/categoryService';
import { Category } from '../../types/category';
import { slugify } from '../../lib/utils';
import { logAdminAction } from '../../services/auditService';
import { useAuth } from '../../lib/authContext';

export const AdminCategoriesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [active, setActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [subcatInput, setSubcatInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const data = await getAllCategoriesAdmin();
    setCategories(data);
    setLoading(false);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setDescription('');
    setImage('');
    setActive(true);
    setSortOrder(categories.length);
    setSubcategories([]);
    setShowModal(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingId(c.id);
    setName(c.name);
    setSlug(c.slug);
    setDescription(c.description || '');
    setImage(c.image || '');
    setActive(c.active);
    setSortOrder(c.sortOrder || 0);
    setSubcategories(c.subcategories || []);
    setShowModal(true);
  };

  const handleAddSubcat = () => {
    if (subcatInput.trim()) {
      setSubcategories([...subcategories, subcatInput.trim()]);
      setSubcatInput('');
    }
  };

  const handleRemoveSubcat = (idx: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const payload: Partial<Category> = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        description: description.trim(),
        image: image || undefined,
        active,
        sortOrder: Number(sortOrder) || 0,
        subcategories,
      };

      const savedId = await saveCategory(payload, editingId || undefined);

      if (currentUser) {
        logAdminAction(
          currentUser.uid,
          editingId ? 'category.edit' : 'category.create',
          'category',
          savedId,
          { name },
          currentUser.email || ''
        );
      }

      setShowModal(false);
      await loadCategories();
    } catch (err: any) {
      alert('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!window.confirm(`Delete category "${catName}"?`)) return;
    try {
      await deleteCategory(id);
      if (currentUser) {
        logAdminAction(currentUser.uid, 'category.delete', 'category', id, { catName }, currentUser.email || '');
      }
      await loadCategories();
    } catch (e) {
      alert('Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Categories Management — Admin Portal | Uniqzen Shop" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Category Management</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Create gadget categories (Smartphones, Audio, Wearables, Chargers, etc.).
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Table / List */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading categories...</div>
      ) : categories.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-left">
              <tr>
                <th className="py-3 px-4">Icon/Image</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Subcategories</th>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border p-1 flex items-center justify-center">
                      {c.image ? (
                        <img
                          src={c.image}
                          alt={c.name}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      ) : (
                        <Layers className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{c.slug}</td>
                  <td className="py-3 px-4">
                    {c.subcategories && c.subcategories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {c.subcategories.map((sub, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{c.sortOrder || 0}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {c.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-brand-primary hover:bg-slate-100"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="No categories found"
          description="Create categories so gadgets can be grouped and discovered easily."
          actionLabel="Add First Category"
          onActionClick={handleOpenNew}
        />
      )}

      {/* Category Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-5 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Category' : 'New Category'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Headphones & Earbuds"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingId) setSlug(slugify(e.target.value));
                  }}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs outline-none"
                />
              </div>

              <div>
                <SingleImageUploader
                  value={image}
                  onChange={setImage}
                  folder="categories"
                  label="Category Icon / Picture (Upload from PC / Mobile)"
                  recommendedSize="400 x 400 px (Square)"
                  maxWidth={400}
                  maxHeight={400}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subcategories (e.g. Wireless, Gaming, ANC)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Subcategory name..."
                    value={subcatInput}
                    onChange={(e) => setSubcatInput(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcat}
                    className="px-3.5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {subcategories.map((sub, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs"
                    >
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubcat(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 outline-none"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 text-brand-primary rounded"
                    />
                    <span>Active in Store</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
