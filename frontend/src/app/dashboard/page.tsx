'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import {
  FolderKanban,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { activeRole } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/organizations/summary').catch(() => ({ data: { data: null } })),
      api.get('/projects').catch(() => ({ data: { data: [] } })),
    ]).then(([sumRes, projRes]) => {
      setSummary(sumRes.data?.data);
      setProjects(projRes.data?.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {summary?.organization?.name || 'Organization'} Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Tenant: <span className="font-semibold">{summary?.organization?.slug}</span> • Plan: {summary?.organization?.plan} • Your Role: <span className="font-bold text-blue-600">{activeRole}</span>
          </p>
        </div>

        {activeRole !== 'AUDITOR' && (
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard/kanban"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
            >
              <FolderKanban className="w-4 h-4 mr-2" />
              Open Task Board
            </Link>
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Projects</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{summary?.stats?.projects ?? 1}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tasks</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{summary?.stats?.tasks ?? 3}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Team Members</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{summary?.stats?.members ?? 4}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Concurrency</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">OCC Active</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-900">Projects in this Organization</h2>
        </div>

        <div className="divide-y divide-slate-100">
          {projects.map((proj) => (
            <div key={proj.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-300">
                    {proj.key}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">{proj.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    proj.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {proj.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{proj.description}</p>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Tasks</p>
                  <p className="text-sm font-bold text-slate-800">{proj._count?.tasks ?? 0}</p>
                </div>

                <Link
                  href="/dashboard/kanban"
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
