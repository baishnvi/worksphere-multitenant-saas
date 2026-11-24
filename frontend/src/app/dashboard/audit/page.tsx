'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { ShieldCheck, User } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/activities/audit-logs')
      .then((res) => {
        setLogs(res.data?.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <ShieldCheck className="w-6 h-6 mr-2 text-blue-600" />
          Enterprise Compliance Audit Trail
        </h1>
        <p className="text-sm text-slate-500">
          Read-only forensic audit logs for regulatory compliance and auditor review
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">Timestamp</th>
              <th className="py-3.5 px-6">Actor</th>
              <th className="py-3.5 px-6">Action</th>
              <th className="py-3.5 px-6">Target</th>
              <th className="py-3.5 px-6">Details / State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="py-4 px-6 font-semibold text-slate-800">
                  {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System'}
                </td>
                <td className="py-4 px-6">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {log.action}
                  </span>
                </td>
                <td className="py-4 px-6 text-xs font-mono text-slate-600">
                  {log.targetType}:{log.targetId?.slice(0, 8)}
                </td>
                <td className="py-4 px-6 text-xs text-slate-500 font-mono max-w-xs truncate">
                  {JSON.stringify(log.newState || log.oldState || {})}
                </td>
              </tr>
            ))}

            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                  No audit logs recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
