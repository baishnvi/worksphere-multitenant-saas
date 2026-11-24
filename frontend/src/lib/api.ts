import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ws_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const orgId = localStorage.getItem('ws_active_org_id');
    if (orgId) {
      config.headers['x-organization-id'] = orgId;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If 401 and refresh token available, attempt renewal
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('ws_refresh_token');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh-token`, {
            refreshToken,
          });
          if (res.data?.success) {
            localStorage.setItem('ws_access_token', res.data.data.accessToken);
            localStorage.setItem('ws_refresh_token', res.data.data.refreshToken);
            error.config.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
            return api(error.config);
          }
        } catch (_refreshError) {
          localStorage.removeItem('ws_access_token');
          localStorage.removeItem('ws_refresh_token');
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
