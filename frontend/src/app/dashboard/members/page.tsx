'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { Users, Mail, Shield, UserPlus } from 'lucide-react';

export default function MembersPage() {
  const { activeRole } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const fetchMembers = () => {
    api.get('/organizations/members')
      .then((res) => setMembers(res.data?.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/organizations/invite', { email, role });
      setInviteSuccess(`Invitation token generated for ${email}!`);
      setEmail('');
      fetchMembers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error inviting member');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <Users className="w-6 h-6 mr-2 text-blue-600" />
          Team Members & Tenant Roles
        </h1>
        <p className="text-sm text-slate-500">
          Manage organization user directory, role permissions, and user invites
        </p>
      </div>

      {['OWNER', 'ADMIN'].includes(activeRole || '') && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center">
            <UserPlus className="w-4 h-4 mr-2 text-blue-600" />
            Invite Colleague
          </h2>
          {inviteSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200">
              {inviteSuccess}
            </div>
          )}
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              aria-label="Assign Role"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            >
              <option value="MEMBER">Team Member</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="ADMIN">Administrator</option>
              <option value="AUDITOR">Auditor</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-sm"
            >
              Send Invite
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">Member</th>
              <th className="py-3.5 px-6">Email</th>
              <th className="py-3.5 px-6">Role</th>
              <th className="py-3.5 px-6">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-900">
                  {m.user?.firstName} {m.user?.lastName}
                </td>
                <td className="py-4 px-6 text-slate-600 text-xs">{m.user?.email}</td>
                <td className="py-4 px-6">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {m.role}
                  </span>
                </td>
                <td className="py-4 px-6 text-xs text-slate-500">
                  {new Date(m.joinedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
