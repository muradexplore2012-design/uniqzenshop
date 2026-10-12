import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, Users, UserCheck, UserX, ShoppingBag } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { EmptyState } from '../../components/common/EmptyState';
import { UserProfile } from '../../types/user';
import { formatCurrency, formatDate } from '../../lib/utils';
import { logAdminAction } from '../../services/auditService';
import { useAuth } from '../../lib/authContext';

export const AdminCustomersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    if (!db) return setLoading(false);
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
      setCustomers(list);
    } catch (e) {
      console.error('Error fetching customers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (customer: UserProfile) => {
    if (!db) return;
    const newStatus = !customer.disabled;
    const actionDesc = newStatus ? 'block' : 'unblock';
    if (!window.confirm(`Are you sure you want to ${actionDesc} customer "${customer.displayName || customer.email}"?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', customer.uid), { disabled: newStatus });
      setCustomers((prev) =>
        prev.map((c) => (c.uid === customer.uid ? { ...c, disabled: newStatus } : c))
      );
      if (currentUser) {
        logAdminAction(
          currentUser.uid,
          `customer.${actionDesc}`,
          'customer',
          customer.uid,
          { email: customer.email },
          currentUser.email || ''
        );
      }
    } catch (e) {
      alert('Failed to update customer status');
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.displayName && c.displayName.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      <SEO title="Customers — Admin Portal | Uniqzen Shop" />

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Customer Management</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          View customer profiles, verified orders, and total spending.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search customer name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading customers...</div>
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-left">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{c.displayName || 'Unnamed Customer'}</p>
                      <p className="text-slate-400 text-[11px]">{c.email}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.phone || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {c.role || 'customer'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {c.totalOrders || 0}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatCurrency(c.totalSpent || 0)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{formatDate(c.createdAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleBlock(c)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          c.disabled
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {c.disabled ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        <span>{c.disabled ? 'Disabled' : 'Active'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No customers registered yet"
          description="Customer accounts will automatically be listed here as shoppers register or complete checkouts."
        />
      )}
    </div>
  );
};
