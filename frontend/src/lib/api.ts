import axios from 'axios';

// Create a configured axios instance
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enables sending/receiving cookies (refresh token)
});

// In-memory token storage (XSS security best practice)
let accessTokenMemory: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessTokenMemory = token;
};

export const getAccessToken = () => {
  return accessTokenMemory;
};

// Request Interceptor: Attach JWT to outgoing requests
api.interceptors.request.use(
  (config) => {
    if (accessTokenMemory && config.headers) {
      config.headers.Authorization = `Bearer ${accessTokenMemory}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle token expiry (401) and refresh automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loop if refresh request itself returns 401, or if login/register requests fail
    const bypassAuthRoutes = ['/auth/login', '/auth/register', '/auth/refresh'];
    const shouldBypass = bypassAuthRoutes.some(route => originalRequest.url?.endsWith(route) || originalRequest.url === route);
    
    if (error.response?.status === 401 && !originalRequest._retry && !shouldBypass) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        logDebug('Access token expired. Requesting silent token refresh...');
        axios.post('/api/auth/refresh', {}, { withCredentials: true })
          .then((response) => {
            const newAccessToken = response.data.accessToken;
            setAccessToken(newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            resolve(api(originalRequest));
          })
          .catch((refreshError) => {
            logDebug('Silent token refresh failed. User session expired.');
            setAccessToken(null);
            processQueue(refreshError, null);
            if (typeof window !== 'undefined') {
              document.cookie = 'eduflow_token=; Max-Age=0; path=/';
              window.location.href = `/login?redirect=${window.location.pathname}`;
            }
            reject(refreshError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }
    return Promise.reject(error);
  }
);

function logDebug(msg: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API Client] ${msg}`);
  }
}

if (typeof window !== 'undefined') {
  (window as any).__api = api;
  (window as any).__getAccessToken = getAccessToken;
}
