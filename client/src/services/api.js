import axios from 'axios';

/**
 * Tactical API Client Interface
 * Standardized REST client pointing to backend API server with credentials & token injection.
 * Dynamically resolves VITE_API_URL or VITE_API_BASE_URL, defaulting to live production Render backend.
 */
const rawUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://nsut-connect.onrender.com';
const cleanBaseUrl = rawUrl.replace(/\/+$/, '');
const API_BASE_URL = cleanBaseUrl.endsWith('/api') ? cleanBaseUrl : `${cleanBaseUrl}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Interface': 'CROSSNEXUS-TACTICAL-FUI',
  },
  timeout: 20000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nsut_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API_TX_ERROR] Outbound transmission dropped:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorPayload = error.response?.data || {
      status: 'LINK_UNAVAILABLE',
      message: error.message || 'Host connection severed or timed out.',
    };
    console.error(`[API_RX_ERROR ${error.response?.status || 'ERR_CONN'}]`, errorPayload);
    return Promise.reject(errorPayload);
  }
);

export { API_BASE_URL };
export default api;