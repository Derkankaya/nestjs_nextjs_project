import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// 1. AŞAMA: Kodun nerede çalıştığını tespit ediyoruz
// Eğer window objesi yoksa (undefined), demek ki Next.js sunucu tarafında (Docker içinde) çalışıyor.
const isServer = typeof window === 'undefined';

// 2. AŞAMA: Akıllı URL seçimi
const api = axios.create({
  baseURL: isServer 
    ? 'http://backend:3000' // Sunucu tarafı (SSR): Docker içi gizli ağdan doğrudan backend'e git.
    : process.env.NEXT_PUBLIC_API_URL, // İstemci tarafı (Tarayıcı): Localhost üzerinden git.
});

// Request interceptor to attach Bearer token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;