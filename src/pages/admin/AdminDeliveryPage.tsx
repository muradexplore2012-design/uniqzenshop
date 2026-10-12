import React, { useEffect, useState } from 'react';
import { Truck, Plus, Trash2, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { getStoreSettings, updateStoreSettings } from '../../services/settingsService';
import { DeliveryZone } from '../../types/settings';
import { formatCurrency } from '../../lib/utils';
import { logAdminAction } from '../../services/auditService';
import { useAuth } from '../../lib/authContext';

export const AdminDeliveryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    getStoreSettings().then((res) => {
      setZones(res.deliveryZones || []);
      setLoading(false);
    });
  }, []);

  const handleAddZone = () => {
    const newZone: DeliveryZone = {
      id: `zone_${Date.now()}`,
      name: 'New Delivery Zone',
      charge: 100,
      minOrderFreeShipping: 4000,
      estimatedDeliveryTime: '2–3 Working Days',
      active: true,
    };
    setZones([...zones, newZone]);
  };

  const handleRemoveZone = (idx: number) => {
    setZones(zones.filter((_, i) => i !== idx));
  };

  const handleZoneChange = (idx: number, field: keyof DeliveryZone, val: any) => {
    const updated = [...zones];
    (updated[idx] as any)[field] = val;
    setZones(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      await updateStoreSettings({ deliveryZones: zones });
      if (currentUser) {
        logAdminAction(
          currentUser.uid,
          'settings.delivery_update',
          'settings',
          'delivery',
          { zonesCount: zones.length },
          currentUser.email || ''
        );
      }
      setSuccessMsg('Delivery zones and rates saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      alert('Failed to save delivery settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <SEO title="Delivery Settings — Admin Portal | Uniqzen Shop" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Delivery & Shipping Rates</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure delivery fees for Inside Dhaka, Outside Dhaka, and regional areas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddZone}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4 text-brand-secondary" />
          <span>Add Custom Zone</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading delivery zones...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-4">
            {zones.map((zone, idx) => (
              <div
                key={zone.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-brand-secondary" />
                    <span className="font-bold text-slate-900 text-sm">Zone #{idx + 1}</span>
                  </div>
                  {zones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveZone(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Zone Name
                    </label>
                    <input
                      type="text"
                      required
                      value={zone.name}
                      onChange={(e) => handleZoneChange(idx, 'name', e.target.value)}
                      className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Delivery Charge (BDT ৳)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={zone.charge}
                      onChange={(e) => handleZoneChange(idx, 'charge', Number(e.target.value))}
                      className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Free Shipping Min. Order (Optional ৳)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 5000"
                      value={zone.minOrderFreeShipping || ''}
                      onChange={(e) =>
                        handleZoneChange(
                          idx,
                          'minOrderFreeShipping',
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Estimated Delivery Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 24–48 Hours"
                      value={zone.estimatedDeliveryTime || ''}
                      onChange={(e) => handleZoneChange(idx, 'estimatedDeliveryTime', e.target.value)}
                      className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={zone.active}
                      onChange={(e) => handleZoneChange(idx, 'active', e.target.checked)}
                      className="w-4 h-4 text-brand-primary rounded"
                    />
                    <span>Active Zone for Customer Checkout</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Delivery Settings</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
