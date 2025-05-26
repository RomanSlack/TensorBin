import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const { access_token, refresh_token } = response.data;
          Cookies.set('access_token', access_token, { expires: 1 });
          Cookies.set('refresh_token', refresh_token, { expires: 7 });
          
          error.config.headers.Authorization = `Bearer ${access_token}`;
          return api.request(error.config);
        } catch (refreshError) {
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          window.location.href = '/auth/login';
        }
      } else {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;