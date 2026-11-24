'use client';

import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { Shield, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setLoading(true);
    setError('');
    try {
      await login(demoEmail, 'Password@123');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white flex flex-col justify-between p-6">
      <header className="flex justify-between items-center max-w-6xl w-full mx-auto py-4">
        <div className="flex items-center space-x-2">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl shadow-lg">
            W
          </div>
          <span className="font-extrabold text-2xl tracking-tight">WorkSphere</span>
        </div>
        <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full font-medium">
          Tayana Solutions Technical Assessment
        </span>
      </header>

      <main className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 rounded-full text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Tenant Enterprise SaaS Architecture</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Next-Gen Project Management & <span className="text-blue-400">Workflow Automation</span>
          </h1>

          <p className="text-slate-300 text-base leading-relaxed">
            Engineered with strict tenant data isolation, optimistic concurrency control (OCC),
            role-based access control (RBAC), and high-throughput Python analytics.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              'Multi-Tenant Tenant Boundaries',
              'Optimistic Concurrency Control',
              'Python FastAPI Analytics Engine',
              'Role-Specific Layouts & Audit Logs',
            ].map((feat, i) => (
              <div key={i} className="flex items-center space-x-2 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          {/* Quick Demo Access Bar */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 space-y-3 shadow-xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1-Click Assessor Demo Roles (Password: Password@123)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('owner@tayana.com')}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white transition-all text-center"
              >
                Org Owner
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('pm@tayana.com')}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white transition-all text-center"
              >
                Project Manager
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('dev@tayana.com')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white transition-all text-center"
              >
                Team Member
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('auditor@tayana.com')}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-bold text-white transition-all text-center"
              >
                Auditor
              </button>
            </div>
          </div>
        </div>

        {/* Login Form Box */}
        <div className="lg:col-span-5 bg-white text-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Sign in to WorkSphere</h2>
            <p className="text-sm text-slate-500">Access your organization workspace</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              <span>{loading ? 'Authenticating...' : 'Enter Platform'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-xs text-center text-slate-500 mt-6">
            Default test password: <span className="font-mono font-semibold">Password@123</span>
          </p>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 max-w-6xl mx-auto w-full py-4 border-t border-slate-800">
        WorkSphere Multi-Tenant SaaS • Tayana Solutions Technical Assessment Portfolio
      </footer>
    </div>
  );
}
