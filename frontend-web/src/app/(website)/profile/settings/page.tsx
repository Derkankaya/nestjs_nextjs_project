'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { updateProfile } from '@/services/user.service';
import { useRouter } from 'next/navigation';
import { Settings, User, Save, Loader2, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    avatar: ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    // Kullanıcının mevcut bilgilerini forma doldur
    setFormData({
      name: user.name || '',
      username: user.username || '',
      bio: user.bio || '',
      avatar: user.avatar || ''
    });
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Backend'e güncelleme isteği at
      const updatedUser = await updateProfile({
        name: formData.name,
        username: formData.username,
        bio: formData.bio,
        avatar: formData.avatar
      });

      // Global statemizi (Zustand) yeni bilgilerle güncelle
      setUser({ ...user, ...updatedUser });
      setSuccessMsg('Profilin başarıyla güncellendi!');
      
      // 3 saniye sonra başarı mesajını gizle
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Güncelleme sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Başlık */}
        <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-slate-200">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <Settings className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Hesap Ayarları</h1>
            <p className="text-slate-500 mt-1">Profil bilgilerini ve vitrinini buradan yönetebilirsin.</p>
          </div>
        </div>

        {/* Form Alanı */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Avatar URL (Şimdilik URL olarak alıyoruz) */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Profil Fotoğrafı (URL)</label>
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://ornek.com/avatar.jpg"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* İsim */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Görünen İsim</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Kullanıcı Adı */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Kullanıcı Adı (URL)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400">@</span>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Biyografi</label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Kendinden bahset... Yazar vitrininde görünecek."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            {/* Mesajlar */}
            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {successMsg}
              </div>
            )}

            {/* Kaydet Butonu */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {isLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}