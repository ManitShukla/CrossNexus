import axios from 'axios';

/**
 * Tactical API Client Interface
 * Standardized REST client pointing to backend API server with credentials & token injection.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Interface': 'CROSSNEXUS-TACTICAL-FUI',
  },
  timeout: 15000,
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

export default api;