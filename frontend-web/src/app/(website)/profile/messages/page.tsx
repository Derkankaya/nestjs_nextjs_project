'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getUserNotifications, markNotificationAsRead, deleteNotification } from '@/services/notification.service';
import { Mail, Check, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function ProfileMessagesPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchMessages();
    }
  }, [user?.id]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await getUserNotifications(user!.id);
      const data = Array.isArray(response) ? response : response?.notifications || [];
      // En yeniler en üstte
      setMessages(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      setError('Mesajlar yüklenirken bir hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    } catch (err) {
      console.error('Okundu işaretlenirken hata:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Mesaj silinirken hata:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8 px-4">
      {/* Başlık */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
        <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <Mail className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mesajlarım ve Duyurular</h1>
          <p className="text-slate-500 text-sm">Sistem yöneticilerinden gelen bildirimler ve özel mesajlar.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center border border-red-200">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" /> <span>{error}</span>
        </div>
      )}

      {/* Mesaj Listesi */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Mesajlarınız yükleniyor...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="bg-slate-50 p-6 rounded-full mb-4">
              <CheckCircle2 className="h-12 w-12 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Gelen kutunuz boş</h3>
            <p className="text-slate-500 mt-1 text-sm">Şu an için size iletilen yeni bir mesaj bulunmuyor.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors ${
                  msg.isRead ? 'bg-white' : 'bg-indigo-50/40'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${msg.isRead ? 'bg-slate-300' : 'bg-indigo-600'}`}></div>
                  <div className="space-y-1">
                    <h4 className={`text-base ${msg.isRead ? 'font-semibold text-slate-700' : 'font-bold text-indigo-950'}`}>
                      {msg.title}
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{msg.message}</p>
                    <span className="text-xs text-slate-400 pt-1 block">{formatDate(msg.createdAt)}</span>
                  </div>
                </div>
                
                {/* Aksiyon Butonları */}
                <div className="flex items-center space-x-2 self-end sm:self-start flex-shrink-0">
                  {!msg.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(msg.id)}
                      className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors text-xs font-semibold border border-indigo-100"
                    >
                      <Check className="h-4 w-4" />
                      <span className="hidden sm:inline">Okundu İşaretle</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="flex items-center space-x-1 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors border border-slate-100"
                    title="Mesajı Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}