'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import { User, Mail, Lock, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfileEditPage() {
  const { user, setAuth } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, text: '' });

    try {
      // Backend'deki güncelleme endpoint'ine istek atıyoruz
      const response = await api.patch('/users/profile', {
        name,
        email,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      setStatus({ type: 'success', text: 'Profil bilgileriniz başarıyla güncellendi!' });
      
    if (response.data && user) {
        // Parametre sıralamasını tam tersi veya state tanımına uygun yapıyoruz
        setAuth(
          { ...user, name, email },             // 1. Argüman (Muhtemelen User objesi)
          localStorage.getItem('token') || ''   // 2. Argüman (Muhtemelen Token)
        );
      }
      // Şifre alanlarını temizle
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      console.error('Profil güncellenirken hata:', error);
      setStatus({ 
        type: 'error', 
        text: error?.response?.data?.message || 'Güncelleme başarısız oldu. Lütfen bilgilerinizi kontrol edin.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
      {/* Başlık */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
        <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profilimi Düzenle</h1>
          <p className="text-slate-500 text-sm">Kişisel bilgilerinizi ve hesap ayarlarınızı güncelleyin.</p>
        </div>
      </div>

      {/* Durum Mesajları */}
      {status.type === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl flex items-center space-x-3">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p className="font-medium text-sm">{status.text}</p>
        </div>
      )}

      {status.type === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="font-medium text-sm">{status.text}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Ad Soyad */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 text-sm"
                placeholder="Adınız Soyadınız"
              />
            </div>
          </div>

          {/* E-posta */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-posta Adresi</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 text-sm"
                placeholder="ornek@mail.com"
              />
            </div>
          </div>

          <hr className="border-slate-100 my-6" />

          <h3 className="text-base font-bold text-slate-900">Şifre Değiştir (İsteğe Bağlı)</h3>
          <p className="text-xs text-slate-500 -mt-4">Şifrenizi değiştirmek istemiyorsanız bu alanları boş bırakabilirsiniz.</p>

          {/* Mevcut Şifre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mevcut Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Yeni Şifre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Yeni Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Kaydet Butonu */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-sm disabled:opacity-70 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Güncelleniyor...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Değişiklikleri Kaydet</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}