import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  avatar: string | null;
  createdAt: string;
}

export interface UserResponse {
  users: User[];
  total: number;
}

export interface GetUsersParams {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateAdminUserInput {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'USER';
}

// ==========================================
// 🛡️ ADMIN İŞLEMLERİ (Sadece Yönetim Paneli)
// ==========================================

// Tüm kullanıcıları getir (Admin listesi) - GÜNCELLENDİ
export const getUsers = async (params: GetUsersParams = {}): Promise<UserResponse> => {
  const response = await api.get<UserResponse>('/admin/users', {
    params: {
      limit: 10,
      offset: 0,
      ...params,
    },
  });
  return response.data;
};

// Admin: Yeni kullanıcı oluştur - ZATEN DOĞRUYDU
export const createAdminUser = async (userData: CreateAdminUserInput): Promise<User> => {
  const response = await api.post<User>('/admin/users', userData); 
  return response.data;
};

// Kullanıcı durumunu (Ban/Suspend/Active) güncelle - GÜNCELLENDİ
export const updateUserStatus = async (
  id: string, 
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED', 
  banDuration?: number, 
  banReason?: string
): Promise<User> => {
  const response = await api.patch<User>(`/admin/users/${id}/status`, {
    status,
    banDuration,
    banReason,
  });
  return response.data;
};

// Kullanıcı sil - GÜNCELLENDİ
export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/admin/users/${id}`);
};

// ==========================================
// 🌍 GENEL İŞLEMLER (Normal Site Arayüzü)
// ==========================================

// Tekil kullanıcı detayını getir (Profil sayfası vs. için) - ZATEN DOĞRUYDU
export const getUserDetails = async (id: string): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};
// Yazarın profilini ve yazılarını çeken fonksiyon
export const getAuthorProfile = async (authorId: string) => {
  // Eğer backend'de users controller'a koyduysan: '/users/author/...'
  // Eğer posts controller'a koyduysan: '/posts/author/...'
  const response = await api.get(`/users/author/${authorId}`); 
  return response.data;
};
// Kullanıcının kendi profilini güncellemesi
export const updateProfile = async (data: any, token?: string) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const response = await api.patch('/users/me', data, config);
  return response.data;
};