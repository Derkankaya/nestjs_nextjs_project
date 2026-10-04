'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Megaphone, Clock, Check, Trash2, CheckCircle2 } from 'lucide-react';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  deleteNotification 
} from '@/services/notification.service'; 

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // 🚨 YENİ: Sekme (Tab) state'ini ekledik
  const [activeTab, setActiveTab] = useState<'NEW' | 'PAST'>('NEW');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Bildirimleri Çek
  useEffect(() => {
    if (!userId) return;
    fetchNotifs();
  }, [userId]);

  const fetchNotifs = async () => {
    try {
      const response = await getUserNotifications(userId);
      // Gelen verinin objede olup olmadığını kontrol ediyoruz
      const data = Array.isArray(response) ? response : response?.notifications || [];
      
      // En yeniler en üstte olsun diye tarihe göre sıralıyoruz
      const sortedData = data.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNotifications(sortedData);
    } catch (error) {
      console.error('Bildirimler alınamadı:', error);
    }
  };

  // Menü dışına tıklayınca kapatma mantığı
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  // Tekil Bildirimi Okundu İşaretle
  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Dropdown'un kapanmasını engelle
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Okundu işaretlenirken hata:', error);
    }
  };

  // Tekil Bildirimi Sil
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Bildirim silinirken hata:', error);
    }
  };

  // Tümünü Okundu İşaretle
  const handleMarkAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.isRead);
    if (unreadNotifs.length === 0) return;

    try {
      // Bekleyen tüm bildirimler için API'ye okundu isteği at
      await Promise.all(unreadNotifs.map(n => markNotificationAsRead(n.id)));
      
      // Ekranda hepsini okundu olarak güncelle
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Tümünü okundu işaretlerken hata:', error);
    }
  };

  // 🚨 YENİ: Bildirimleri durumlarına göre iki diziye ayırıyoruz
  const unreadNotifs = notifications.filter(n => !n.isRead);
  const pastNotifs = notifications.filter(n => n.isRead);
  
  // Hangi sekmedeysek o verileri göstereceğiz
  const displayNotifs = activeTab === 'NEW' ? unreadNotifs : pastNotifs;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ZİL BUTONU */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
      >
        <Bell className="h-6 w-6" />
        {/* SADECE Okunmamış (isRead: false) Bildirim Varsa Kırmızı Nokta Çıkar */}
        {unreadNotifs.length > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
          </span>
        )}
      </button>

      {/* AÇILIR MENÜ (DROPDOWN) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 transform transition-all origin-top-right">
          
          {/* Dropdown Header */}
          <div className="bg-slate-50 px-4 py-3 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">Bildirimler</h3>
            {unreadNotifs.length > 0 && (
              <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                {unreadNotifs.length} Yeni
              </span>
            )}
          </div>

          {/* 🚨 YENİ: SEKMELER (TABS) */}
          <div className="flex border-b border-slate-100 bg-white">
            <button 
              onClick={(e) => { e.stopPropagation(); setActiveTab('NEW'); }}
              className={`flex-1 py-2.5 text-xs font-bold text-center transition-colors ${
                activeTab === 'NEW' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Yeni ({unreadNotifs.length})
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setActiveTab('PAST'); }}
              className={`flex-1 py-2.5 text-xs font-bold text-center transition-colors ${
                activeTab === 'PAST' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Geçmiş ({pastNotifs.length})
            </button>
          </div>

          {/* Bildirim Listesi */}
          <div className="max-h-[350px] overflow-y-auto">
            {displayNotifs.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="bg-slate-100 p-3 rounded-full mb-3">
                  <CheckCircle2 className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  {activeTab === 'NEW' ? 'Yeni bildiriminiz yok.' : 'Geçmiş bildiriminiz bulunmuyor.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {displayNotifs.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`relative p-4 transition-all group ${
                      notif.isRead ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/80'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      
                      <div className="flex-shrink-0 mt-1 relative">
                        <Megaphone className={`h-5 w-5 ${notif.isRead ? 'text-slate-400' : 'text-indigo-500'}`} />
                        {/* Okunmamışsa küçük mavi nokta */}
                        {!notif.isRead && (
                          <span className="absolute -top-1 -right-1 h-2 w-2 bg-indigo-500 rounded-full border border-white"></span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-8">
                        <p className={`text-sm truncate ${notif.isRead ? 'font-medium text-slate-600' : 'font-bold text-indigo-950'}`}>
                          {notif.title}
                        </p>
                        <p className={`text-sm mt-0.5 line-clamp-2 ${notif.isRead ? 'text-slate-500' : 'text-slate-700'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-2 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(notif.createdAt)}
                        </p>
                      </div>

                    </div>

                    {/* Hızlı Aksiyon Butonları */}
                    <div className="absolute top-4 right-4 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(e, notif.id)}
                          className="p-1.5 bg-white text-indigo-600 hover:bg-indigo-100 rounded-md shadow-sm transition-colors border border-slate-100"
                          title="Okundu İşaretle"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, notif.id)}
                        className="p-1.5 bg-white text-red-500 hover:bg-red-50 hover:text-red-700 rounded-md shadow-sm transition-colors border border-slate-100"
                        title="Bildirimi Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Tümünü Okundu İşaretle Butonu (Footer) - Sadece Yeni Sekmesindeyse Çıksın */}
          {unreadNotifs.length > 0 && activeTab === 'NEW' && (
            <div className="border-t border-slate-100 p-2 bg-slate-50">
              <button 
                onClick={handleMarkAllAsRead}
                className="w-full text-center flex items-center justify-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Tümünü Okundu İşaretle</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}