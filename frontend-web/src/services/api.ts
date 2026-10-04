import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// 1. AŞAMA: Kodun nerede çalıştığını tespit ediyoruz
const isServer = typeof window === 'undefined';

// 2. AŞAMA: Akıllı URL seçimi
const api = axios.create({
  baseURL: isServer 
    ? 'http://backend:3001' // Docker içi iletişim için
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'), // Tarayıcı içi iletişim için
  withCredentials: true, // HttpOnly çerezlerin gidip gelmesi için zorunlu
});

// 3. AŞAMA: GİDEN İSTEKLER (Giden isteklere Bearer token ekle)
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

// 4. AŞAMA: GELEN CEVAPLAR (Hayalet Avcısı ve Hata Dedektörü)
api.interceptors.response.use(
  (response) => response, // İstek başarılıysa dokunma, aynen geçir
  (error) => {
    // İSTEK ATILDI AMA HİÇ CEVAP ALINAMADISA (Backend kapalı veya Network kopuk)
    if (!error.response) {
      console.error("KRİTİK AĞ HATASI: Backend'e ulaşılamıyor! Portu veya Docker ayarlarını kontrol et.", error.message);
      return Promise.reject(error);
    }

    // Eğer Backend bize "401 Unauthorized" derse:
    if (error.response.status === 401) {
      console.warn("Backend 401 verdi! Hayalet avlandı, yetkiler siliniyor...");
      
      // Zustand'ı sıfırla (Kullanıcı verilerini sil)
      useAuthStore.getState().clearAuth();
      
      // Sadece tarayıcıdaysak çerezleri sil ve yönlendir
      if (!isServer) {
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Acımadan Login sayfasına postala
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;