'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import { BarChart2, FileText, MessageSquare, Eye, Loader2, AlertCircle } from 'lucide-react';

export default function ProfileStatsPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalComments: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchUserStats();
    }
  }, [user?.id]);

const fetchUserStats = async () => {
    try {
      setLoading(true);
      // Kullanıcının ID'sini ekleyerek doğru endpoint'e istek atıyoruz
      const response = await api.get(`/users/stats/${user?.id}`);
      setStats({
        totalPosts: response.data?.totalPosts || 0,
        totalComments: response.data?.totalComments || 0,
        totalViews: response.data?.totalViews || 0,
      });
    } catch (err) {
      console.error('İstatistikler yüklenirken hata:', err);
      setStats({ totalPosts: 0, totalComments: 0, totalViews: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8 px-4">
      {/* Başlık */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
        <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <BarChart2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">İstatistiklerim</h1>
          <p className="text-slate-500 text-sm">Hesabınızın performans ve aktivite özetini inceleyin.</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">İstatistikleriniz yükleniyor...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Toplam Yazı Kartı */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
            <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Toplam Yazı</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalPosts}</h3>
            </div>
          </div>

          {/* Toplam Yorum Kartı */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
            <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Alınan Yorumlar</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalComments}</h3>
            </div>
          </div>

          {/* Toplam Görüntülenme Kartı */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
            <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Eye className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Görüntülenme</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalViews}</h3>
            </div>
          </div>

        </div>
      )}

      {/* Bilgilendirme Kutusu */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-6 text-indigo-900">
        <h4 className="font-bold text-sm mb-1">İpucu 💡</h4>
        <p className="text-xs text-indigo-700 leading-relaxed">
          Daha fazla kitleye ulaşmak ve istatistiklerinizi artırmak için düzenli olarak özgün içerikler paylaşmaya devam edin!
        </p>
      </div>
    </div>
  );
}