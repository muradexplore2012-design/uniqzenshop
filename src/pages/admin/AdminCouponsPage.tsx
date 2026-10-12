import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Ticket, Check, X, Loader2 } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { EmptyState } from '../../components/common/EmptyState';
import { getAllCouponsAdmin, saveCoupon, deleteCoupon } from '../../services/couponService';
import { Coupon } from '../../types/coupon';
import { formatCurrency, formatDate } from '../../lib/utils';
import { logAdminAction } from '../../services/auditService';
import { useAuth } from '../../lib/authContext';

export const AdminCouponsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountAmount, setDiscountAmount] = useState<number | ''>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number | ''>(1000);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | ''>(500);
  const [usageLimit, setUsageLimit] = useState<number | ''>(100);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    const data = await getAllCouponsAdmin();
    setCoupons(data);
    setLoading(false);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountAmount(10);
    setMinOrderAmount(1000);
    setMaxDiscountAmount(500);
    setUsageLimit(100);
    setActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingId(c.id);
    setCode(c.code);
    setDescription(c.description || '');
    setDiscountType(c.discountType);
    setDiscountAmount(c.discountAmount);
    setMinOrderAmount(c.minOrderAmount || '');
    setMaxDiscountAmount(c.maxDiscountAmount || '');
    setUsageLimit(c.usageLimit || '');
    setActive(c.active);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setSaving(true);
    try {
      const payload: Partial<Coupon> = {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        discountType,
        discountAmount: Number(discountAmount) || 0,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        active,
      };

      const savedId = await saveCoupon(payload, editingId || undefined);

      if (currentUser) {
        logAdminAction(
          currentUser.uid,
          editingId ? 'coupon.edit' : 'coupon.create',
          'coupon',
          savedId,
          { code },
          currentUser.email || ''
        );
      }

      setShowModal(false);
      await loadCoupons();
    } catch (e) {
      alert('Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, cCode: string) => {
    if (!window.confirm(`Delete coupon "${cCode}"?`)) return;
    try {
      await deleteCoupon(id);
      if (currentUser) {
        logAdminAction(currentUser.uid, 'coupon.delete', 'coupon', id, { code: cCode }, currentUser.email || '');
      }
      await loadCoupons();
    } catch (e) {
      alert('Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Coupons Management — Admin Portal | Uniqzen Shop" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Discount Coupons</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Create percentage discounts, fixed vouchers, and threshold limits.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading coupons...</div>
      ) : coupons.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-left">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Min. Spend</th>
                <th className="py-3 px-4">Max. Discount</th>
                <th className="py-3 px-4">Used / Limit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md text-xs">
                      {c.code}
                    </span>
                    {c.description && (
                      <p className="text-[11px] text-slate-400 mt-1">{c.description}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {c.discountType === 'percentage'
                      ? `${c.discountAmount}% OFF`
                      : formatCurrency(c.discountAmount)}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {c.minOrderAmount ? formatCurrency(c.minOrderAmount) : 'None'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {c.maxDiscountAmount ? formatCurrency(c.maxDiscountAmount) : 'No Cap'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {c.usedCount || 0} / {c.usageLimit ? c.usageLimit : '∞'}
                  </td>
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
                        title="Edit Coupon"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.code)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Coupon"
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
          icon={Ticket}
          title="No coupons configured yet"
          description="Create discount promo codes for campaigns and promotions."
          actionLabel="Create Coupon"
          onActionClick={handleOpenNew}
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-5 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Coupon' : 'Create Coupon'}
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
                  Coupon Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UNIQZEN10"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 uppercase font-mono font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white cursor-pointer outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed BDT (৳)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount ({discountType === 'percentage' ? '%' : '৳'})
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountAmount}
                    onChange={(e) =>
                      setDiscountAmount(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Order Spend (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="1000"
                    value={minOrderAmount}
                    onChange={(e) =>
                      setMinOrderAmount(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Discount Cap (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="500"
                    value={maxDiscountAmount}
                    onChange={(e) =>
                      setMaxDiscountAmount(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Usage Limit (Total times can be used)
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="100"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 text-brand-primary rounded"
                  />
                  <span>Coupon is Active & Usable at Checkout</span>
                </label>
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
                  {saving ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
