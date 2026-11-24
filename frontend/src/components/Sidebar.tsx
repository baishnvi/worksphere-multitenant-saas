'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import {
  LayoutDashboard,
  KanbanSquare,
  BarChart3,
  Users,
  ShieldCheck,
  Settings,
  FolderGit2
} from 'lucide-react';

export const Sidebar = () => {
  const pathname = usePathname();
  const { activeRole } = useAuth();

  const isAuditor = activeRole === 'AUDITOR';
  const isAdminOrOwner = ['OWNER', 'ADMIN', 'PLATFORM_ADMIN'].includes(activeRole || '');

  const navItems = [
    { label: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Kanban Tasks & OCC', href: '/dashboard/kanban', icon: KanbanSquare },
    { label: 'FastAPI Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { label: 'Team Members', href: '/dashboard/members', icon: Users },
  ];

  if (isAdminOrOwner || isAuditor) {
    navItems.push({ label: 'Audit Trail Logs', href: '/dashboard/audit', icon: ShieldCheck });
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
          Workspace Modules
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-3 bg-slate-800 rounded-lg text-xs space-y-1 text-slate-400">
        <div className="flex items-center text-slate-300 font-semibold mb-1">
          <FolderGit2 className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
          WorkSphere SaaS v1.0
        </div>
        <p>Tenant: Multi-Tenant Schema</p>
        <p>Concurrency: OCC Versioned</p>
      </div>
    </aside>
  );
};
