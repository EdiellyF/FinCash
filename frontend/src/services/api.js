import axios from 'axios';

const ACCESS_TOKEN_KEY = 'finance_access_token';
const REFRESH_TOKEN_KEY = 'finance_refresh_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api'
});

const isPublicAuthRoute = (url = '') => /\/auth\/(login|register|refresh|reset-password-with-backup-code)($|\?)/i.test(url);

let refreshAccessTokenPromise = null;

const clearSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('finance_user');
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isUnauthorized = status === 401;
    const isAuthFreeRequest = isPublicAuthRoute(originalRequest?.url || '');

    if (isUnauthorized && !originalRequest?._retry && !isAuthFreeRequest) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        clearSession();
        window.dispatchEvent(new Event('finance:session-expired'));
        return Promise.reject(error);
      }

      try {
        if (!refreshAccessTokenPromise) {
          refreshAccessTokenPromise = api.post('/auth/refresh', { refreshToken }).then(({ data }) => {
            const accessToken = data?.data?.accessToken ?? data?.accessToken;
            const nextRefreshToken = data?.data?.refreshToken ?? data?.refreshToken;

            if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
            if (nextRefreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);

            return { accessToken, nextRefreshToken };
          }).finally(() => {
            refreshAccessTokenPromise = null;
          });
        }

        await refreshAccessTokenPromise;
        originalRequest._retry = true;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${localStorage.getItem(ACCESS_TOKEN_KEY)}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearSession();
        window.dispatchEvent(new Event('finance:session-expired'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
