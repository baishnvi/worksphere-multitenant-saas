'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isPlatformAdmin: boolean;
  organizations?: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  activeOrgId: string | null;
  activeRole: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchOrganization: (orgId: string) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  activeOrgId: null,
  activeRole: null,
  login: async () => {},
  logout: () => {},
  switchOrganization: () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ws_access_token');
    const savedOrgId = localStorage.getItem('ws_active_org_id');

    if (token) {
      api.get('/auth/me')
        .then((res) => {
          if (res.data?.success) {
            const userData = res.data.data;
            setUser(userData);
            const orgs = userData.memberships?.map((m: any) => ({
              id: m.organization.id,
              name: m.organization.name,
              slug: m.organization.slug,
              role: m.role,
            })) || [];
            userData.organizations = orgs;

            // Select active organization
            const targetOrg = orgs.find((o: any) => o.id === savedOrgId) || orgs[0];
            if (targetOrg) {
              setActiveOrgId(targetOrg.id);
              setActiveRole(targetOrg.role);
              localStorage.setItem('ws_active_org_id', targetOrg.id);
            }
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success) {
      const { user: userData, tokens } = res.data.data;
      localStorage.setItem('ws_access_token', tokens.accessToken);
      localStorage.setItem('ws_refresh_token', tokens.refreshToken);
      setUser(userData);

      const firstOrg = userData.organizations?.[0];
      if (firstOrg) {
        setActiveOrgId(firstOrg.id);
        setActiveRole(firstOrg.role);
        localStorage.setItem('ws_active_org_id', firstOrg.id);
      }
      window.location.href = '/dashboard';
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('ws_refresh_token');
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    localStorage.removeItem('ws_access_token');
    localStorage.removeItem('ws_refresh_token');
    localStorage.removeItem('ws_active_org_id');
    setUser(null);
    setActiveOrgId(null);
    setActiveRole(null);
    window.location.href = '/';
  };

  const switchOrganization = (orgId: string) => {
    const target = user?.organizations?.find((o) => o.id === orgId);
    if (target) {
      setActiveOrgId(target.id);
      setActiveRole(target.role);
      localStorage.setItem('ws_active_org_id', target.id);
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{ user, activeOrgId, activeRole, login, logout, switchOrganization, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
