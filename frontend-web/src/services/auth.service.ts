import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

// 🚨 GÜNCELLENDİ: username eklendi
export interface RegisterData {
  name: string;
  username: string; 
  email: string;
  password: string;
}

// 🚨 GÜNCELLENDİ: username, bio ve avatar eklendi
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'USER';
    username?: string;
    bio?: string;
    avatar?: string | null;
  };
  accessToken: string;
}

// Login API call
export const login = async (data: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
};

// Register API call
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
};