'use client';

import { useState } from 'react';
import { Send, Users, Shield, Megaphone, Loader2, CheckCircle2, User, AlertCircle } from 'lucide-react';
import { sendBulkNotification, sendSingleNotification } from '@/services/notification.service'; 

export default function NotificationCenterPage() {
  const [sendMode, setSendMode] = useState<'BULK' | 'SINGLE'>('BULK');

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  
  const [targetRole, setTargetRole] = useState<'ALL' | 'AUTHOR' | 'USER'>('ALL');
  const [targetUserId, setTargetUserId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Güvenlik: Sadece boşluk gönderilmesini engelle
    const cleanTitle = title.trim();
    const cleanMessage = message.trim();

    if (!cleanTitle || !cleanMessage) {
      setStatus({ type: 'error', text: 'Lütfen başlık ve mesaj alanlarını doldurun.' });
      return;
    }

    setLoading(true);
    setStatus({ type: null, text: '' });

    try {
      if (sendMode === 'BULK') {
        const response = await sendBulkNotification(cleanTitle, cleanMessage, targetRole as any);
        setStatus({ type: 'success', text: response?.message || 'Toplu duyuru başarıyla gönderildi!' });
      } else {
        if (!targetUserId.trim()) {
          setStatus({ type: 'error', text: 'Lütfen bir Kullanıcı ID girin.' });
          setLoading(false);
          return;
        }
        const response = await sendSingleNotification(targetUserId.trim(), cleanTitle, cleanMessage);
        setStatus({ type: 'success', text: response?.message || 'Kişiye özel mesaj başarıyla gönderildi!' });
      }
      
      // Formu temizle
      setTitle('');
      setMessage('');
      setTargetUserId('');

      // ZARİF DOKUNUŞ: Başarı mesajını 5 saniye sonra ekrandan sil
      setTimeout(() => {
        setStatus({ type: null, text: '' });
      }, 5000);

    } catch (error: any) {
      console.error('Bildirim gönderilirken hata oluştu:', error);
      setStatus({ 
        type: 'error', 
        text: error?.response?.data?.message || 'Mesaj gönderilemedi, lütfen tekrar deneyin.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Üst Kısım */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
        <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
          <Megaphone className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">İletişim Merkezi</h1>
          <p className="text-slate-500 text-sm">Sistemdeki kullanıcılara toplu duyuru veya kişiye özel mesaj gönderin.</p>
        </div>
      </div>

      {/* Durum Bildirimleri (Otomatik kapanır) */}
      {status.type === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl flex items-start space-x-3 animate-in fade-in slide-in-from-top-2 transition-all duration-300">
          <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-800">İşlem Başarılı!</h3>
            <p className="text-green-600 text-sm">{status.text}</p>
          </div>
        </div>
      )}
      
      {status.type === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl flex items-start space-x-3 animate-in fade-in slide-in-from-top-2 transition-all duration-300">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Hata!</h3>
            <p className="text-red-600 text-sm">{status.text}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Mod Seçici (Tabs) */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setSendMode('BULK')}
            className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center space-x-2 transition-colors ${
              sendMode === 'BULK'
                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Toplu Duyuru</span>
          </button>
          <button
            onClick={() => setSendMode('SINGLE')}
            className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center space-x-2 transition-colors ${
              sendMode === 'SINGLE'
                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <User className="h-5 w-5" />
            <span>Kişiye Özel Mesaj</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          
          {/* 1. Hedef Kitle Seçimi */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">
              1. Hedef {sendMode === 'BULK' ? 'Kitleyi Seçin' : 'Kullanıcıyı Belirleyin'}
            </h3>
            
            {sendMode === 'BULK' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className={`cursor-pointer relative flex flex-col p-4 border-2 rounded-xl transition-all ${targetRole === 'ALL' ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 hover:border-indigo-200'}`}>
                  <input type="radio" name="targetRole" value="ALL" checked={targetRole === 'ALL'} onChange={() => setTargetRole('ALL')} className="sr-only" />
                  <Users className={`h-6 w-6 mb-2 ${targetRole === 'ALL' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className={`font-semibold ${targetRole === 'ALL' ? 'text-indigo-900' : 'text-slate-700'}`}>Tüm Kullanıcılar</span>
                  <span className="text-xs text-slate-500 mt-1">Sistemdeki herkese gönderir</span>
                </label>

                <label className={`cursor-pointer relative flex flex-col p-4 border-2 rounded-xl transition-all ${targetRole === 'AUTHOR' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-blue-200'}`}>
                  <input type="radio" name="targetRole" value="AUTHOR" checked={targetRole === 'AUTHOR'} onChange={() => setTargetRole('AUTHOR')} className="sr-only" />
                  <Shield className={`h-6 w-6 mb-2 ${targetRole === 'AUTHOR' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className={`font-semibold ${targetRole === 'AUTHOR' ? 'text-blue-900' : 'text-slate-700'}`}>Sadece Yazarlar</span>
                  <span className="text-xs text-slate-500 mt-1">Sadece AUTHOR rolündekiler</span>
                </label>

                <label className={`cursor-pointer relative flex flex-col p-4 border-2 rounded-xl transition-all ${targetRole === 'USER' ? 'border-purple-500 bg-purple-50 shadow-sm' : 'border-slate-200 hover:border-purple-200'}`}>
                  <input type="radio" name="targetRole" value="USER" checked={targetRole === 'USER'} onChange={() => setTargetRole('USER')} className="sr-only" />
                  <User className={`h-6 w-6 mb-2 ${targetRole === 'USER' ? 'text-purple-600' : 'text-slate-400'}`} />
                  <span className={`font-semibold ${targetRole === 'USER' ? 'text-purple-900' : 'text-slate-700'}`}>Belirli Kullanıcılar</span>
                  <span className="text-xs text-slate-500 mt-1">Sadece belirtilen kullanıcılar</span>
                </label>
              </div>
            ) : (
              <div className="max-w-md">
                <label className="block text-sm font-medium text-slate-700 mb-1">Kullanıcı ID *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    required={sendMode === 'SINGLE'}
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    placeholder="Örn: clt5b8e9..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Mesajı alacak kullanıcının sistemdeki benzersiz ID'si.</p>
              </div>
            )}
          </div>

          {/* 2. Mesaj İçeriği */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wider">2. Mesaj Detayları</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Başlık *</label>
              <input 
                type="text" 
                required
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Yeni Özelliklerimiz Yayında!"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">İçerik *</label>
              <textarea 
                required
                maxLength={500}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Göndermek istediğiniz mesajı buraya yazın..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-y"
              />
              <div className="text-right mt-1">
                <span className="text-xs text-slate-400">{message.length}/500 karakter</span>
              </div>
            </div>
          </div>

          {/* Gönder Butonu */}
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all flex items-center shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" /> {sendMode === 'BULK' ? 'Duyuruyu Yayına Al' : 'Mesajı Gönder'}
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}