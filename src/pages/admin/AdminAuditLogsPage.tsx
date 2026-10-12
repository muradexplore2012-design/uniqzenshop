import React, { useEffect, useState } from 'react';
import { ClipboardList, Shield, Clock } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { EmptyState } from '../../components/common/EmptyState';
import { getRecentAuditLogs } from '../../services/auditService';
import { AuditLog } from '../../types/audit';
import { formatDate } from '../../lib/utils';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentAuditLogs(50).then((res) => {
      setLogs(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <SEO title="Audit Logs — Admin Portal | Uniqzen Shop" />

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Administrator Activity Audit Trail</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Recorded security logs for product creations, status updates, and setting changes.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading audit trail...</div>
      ) : logs.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-left">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Type</th>
                <th className="py-3 px-4">Admin Email</th>
                <th className="py-3 px-4">Admin UID</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 capitalize font-sans">
                    {log.targetType}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-sans">
                    {log.adminEmail || 'Admin'}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[10px]">
                    {log.adminUid?.slice(0, 14)}...
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-sans">
                    {formatDate(log.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No audit entries logged yet"
          description="Administrative operations will be recorded here automatically."
        />
      )}
    </div>
  );
};
