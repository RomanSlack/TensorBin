import Cookies from 'js-cookie';
import api from './api';

export interface User {
  id: number;
  email: string;
  tier: number;
  storage_used: number;
  storage_limit: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    const authData = response.data;
    
    Cookies.set('access_token', authData.access_token, { expires: 1 });
    Cookies.set('refresh_token', authData.refresh_token, { expires: 7 });
    
    return authData;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    const authData = response.data;
    
    Cookies.set('access_token', authData.access_token, { expires: 1 });
    Cookies.set('refresh_token', authData.refresh_token, { expires: 7 });
    
    return authData;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
  },

  isAuthenticated(): boolean {
    return !!Cookies.get('access_token');
  }
};