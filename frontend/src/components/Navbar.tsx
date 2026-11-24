'use client';

import React from 'react';
import { useAuth } from '../lib/auth-context';
import { Building2, Shield, User as UserIcon, LogOut, Bell } from 'lucide-react';

export const Navbar = () => {
  const { user, activeOrgId, activeRole, switchOrganization, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            W
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">WorkSphere</span>
        </div>

        {/* Tenant Organization Switcher */}
        {user?.organizations && user.organizations.length > 0 && (
          <div className="relative flex items-center ml-4 pl-4 border-l border-slate-200">
            <Building2 className="w-4 h-4 text-slate-500 mr-2" />
            <select
              value={activeOrgId || ''}
              onChange={(e) => switchOrganization(e.target.value)}
              aria-label="Active Tenant Organization"
              className="bg-slate-100 text-slate-800 text-sm font-semibold rounded-md px-3 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {user.organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.role})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Role Badge */}
        {activeRole && (
          <div className="flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Shield className="w-3 h-3 mr-1" />
            {activeRole}
          </div>
        )}

        <button className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
