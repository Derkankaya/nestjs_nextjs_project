import api from './api';

// Tekil (Manuel) Mesaj Atma (Bunu az önce yazmıştık)
export const sendSingleNotification = async (userId: string, title: string, message: string) => {
  const response = await api.post('/notifications/single', {
    userId,
    title,
    message,
  });
  return response.data;
};

// YENİ: Toplu (Bulk) Duyuru Atma
export const sendBulkNotification = async (title: string, message: string, targetRole?: 'ADMIN' | 'AUTHOR' | 'MEMBER' | 'ALL') => {
  // Eğer 'ALL' seçildiyse targetRole göndermiyoruz (Backend herkese atıyor)
  const payload = targetRole === 'ALL' ? { title, message } : { title, message, targetRole };
  
  const response = await api.post('/notifications/bulk', payload);
  return response.data;
};
export const getUserNotifications = async (userId: string) => {
  const response = await api.get(`/notifications/user/${userId}`);
  return response.data;
};
// Bildirimi "Okundu" olarak işaretle
export const markNotificationAsRead = async (id: string) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

// Bildirimi sistemden tamamen sil
export const deleteNotification = async (id: string) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};