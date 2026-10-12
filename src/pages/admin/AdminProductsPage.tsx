import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  CheckCircle,
  Package,
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { EmptyState } from '../../components/common/EmptyState';
import { getAllProductsAdmin, deleteProduct, saveProduct } from '../../services/productService';
import { getAllCategoriesAdmin } from '../../services/categoryService';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import { formatCurrency } from '../../lib/utils';
import { logAdminAction } from '../../services/auditService';
import { useAuth } from '../../lib/authContext';

export const AdminProductsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [prods, cats] = await Promise.all([
      getAllProductsAdmin(),
      getAllCategoriesAdmin(),
    ]);
    setProducts(prods);
    setCategories(cats);
    setLoading(false);
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await saveProduct({ active: !product.active }, product.id);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p))
      );
      if (currentUser) {
        logAdminAction(
          currentUser.uid,
          'product.toggle_active',
          'product',
          product.id,
          { active: !product.active },
          currentUser.email || ''
        );
      }
    } catch (e) {
      alert('Failed to update product status');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate / archive "${name}"?`)) {
      return;
    }
    try {
      await deleteProduct(id, true);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active: false } : p)));
      if (currentUser) {
        logAdminAction(currentUser.uid, 'product.archive', 'product', id, { name }, currentUser.email || '');
      }
    } catch (e) {
      alert('Failed to archive product');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory =
      !selectedCategory || p.category === selectedCategory || p.categoryName === selectedCategory;

    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? p.active
        : !p.active;

    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="space-y-6">
      <SEO title="Products Management — Admin Portal | Uniqzen Shop" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Product Management</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Create, edit, manage stock, and customize technical specifications.
          </p>
        </div>

        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Gadget</span>
        </Link>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by name, SKU or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug || c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive / Draft</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading catalog...</div>
      ) : filteredProducts.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-left">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Badges</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Product Cover & Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.thumbnail || product.images[0] || '/logo.png'}
                          alt={product.name}
                          className="w-11 h-11 object-contain rounded-lg bg-slate-50 border p-1 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 line-clamp-1">{product.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span>SKU: {product.sku}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-600">{product.brand}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {product.categoryName || 'Unassigned'}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">
                        {formatCurrency(product.salePrice || product.price)}
                      </p>
                      {product.salePrice && product.salePrice < product.price && (
                        <p className="text-[10px] text-slate-400 line-through">
                          {formatCurrency(product.price)}
                        </p>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] inline-block ${
                          product.stock <= 0
                            ? 'bg-rose-100 text-rose-700'
                            : product.stock <= 5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </td>

                    {/* Badges (Featured, New, Best Seller) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {product.featured && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]">
                            Featured
                          </span>
                        )}
                        {product.newArrival && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold text-[10px]">
                            New
                          </span>
                        )}
                        {product.bestSeller && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold text-[10px]">
                            Best
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Active Status */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          product.active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {product.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{product.active ? 'Active' : 'Draft'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/admin/products/${product.id}`}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-brand-primary hover:bg-slate-100 transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Archive Product"
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
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Your gadget inventory is currently empty or no items match your search."
          actionLabel="Add Your First Gadget"
          actionLink="/admin/products/new"
        />
      )}
    </div>
  );
};
