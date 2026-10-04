'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import { FileText, Plus, Trash2, Edit, Loader2, CheckCircle2, AlertCircle, ExternalLink, Eye, FileEdit, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  status: 'PUBLISHED' | 'DRAFT';
  createdAt: string;
  category?: { name: string };
  // İstersen buralara views, likes, commentsCount gibi alanlar da ekleyip kartta gösterebilirsin
}

export default function ProfilePostsPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State'ler
  const [activeTab, setActiveTab] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  
  // 👈 YENİ: Sıralama durumu (Varsayılan: En Yeni)
  const [sortBy, setSortBy] = useState('createdAt'); 

  // Sekme veya sıralama değiştiğinde veriyi baştan çek
  useEffect(() => {
    if (user?.id) {
      fetchMyPosts();
    }
  }, [user?.id, activeTab, sortBy]); // 👈 sortBy eklendi

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      // 👈 Axios'a sortBy parametresi de gidiyor
      const response = await api.get('/posts/my-posts', {
        params: { 
          status: activeTab,
          sortBy: sortBy 
        } 
      });
      const data = Array.isArray(response.data) ? response.data : response.data?.posts || [];
      setPosts(data);
    } catch (err) {
      console.error('Yazılar yüklenirken hata:', err);
      setError('Yazılarınız yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Bu yazıyı kalıcı olarak silmek istediğinize emin misiniz?')) return;

    try {
      await api.delete(`/posts/${slug}`);
      setPosts(prev => prev.filter(p => p.slug !== slug));
      setSuccess('Yazı başarıyla silindi.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Yazı silinirken hata:', err);
      setError('Yazı silinemedi, lütfen tekrar deneyin.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8 px-4">
      {/* Başlık ve Yeni Yazı Ekle Butonu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kendi Yazılarım</h1>
            <p className="text-slate-500 text-sm">Kaleme aldığınız tüm blog yazılarını buradan yönetin.</p>
          </div>
        </div>
        
        <Link 
          href="/profile/posts/create" 
          className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm text-sm"
        >
          <Plus className="h-5 w-5" />
          <span>Yeni Yazı Yaz</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center border border-red-200">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" /> <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center border border-green-200">
          <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" /> <span>{success}</span>
        </div>
      )}

      {/* 👈 YENİ: Sekmeler (Tabs) VE Sıralama (Sort) Alanı Yanyana */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 gap-4">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('PUBLISHED')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'PUBLISHED' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>Yayındakiler</span>
          </button>
          <button
            onClick={() => setActiveTab('DRAFT')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'DRAFT' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileEdit className="h-4 w-4" />
            <span>Taslaklarım</span>
          </button>
        </div>

        {/* Sıralama Dropdown Menüsü */}
        <div className="pb-3 flex items-center space-x-2">
          <ArrowUpDown className="h-4 w-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm bg-transparent border-none text-slate-600 font-medium focus:ring-0 cursor-pointer p-0 pr-4"
          >{}
           <option value="createdAt">En Yeni</option>
           <option value="viewCount">En Çok Okunan</option>
           <option value="comments">En Çok Yorum Alan</option>
          </select>
        </div>
      </div>

      {/* Yazı Listesi */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Yazılarınız yükleniyor...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="bg-slate-50 p-6 rounded-full mb-4">
              <FileText className="h-12 w-12 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">
              {activeTab === 'DRAFT' ? 'Henüz hiç taslağınız yok' : 'Henüz bir yazı yayınlamamışsınız'}
            </h3>
            <p className="text-slate-500 mt-1 text-sm">İlk blog yazınızı oluşturarak toplulukla paylaşmaya başlayın.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {posts.map((post) => (
              <div key={post.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                      activeTab === 'DRAFT' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {post.category?.name || 'Genel'}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-400">{formatDate(post.createdAt)}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {post.title}
                  </h3>
                  <p className="text-slate-600 text-sm line-clamp-1">
                    {post.excerpt || 'Açıklama bulunmuyor...'}
                  </p>
                </div>
                
                {/* Aksiyon Butonları */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {activeTab === 'PUBLISHED' && (
                    <Link 
                      href={`/posts/${post.slug}`} 
                      target="_blank"
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-100"
                      title="Yazıyı Görüntüle"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                  
                  <Link 
                    href={`/profile/posts/edit/${post.id}`} 
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-100"
                    title="Yazıyı Düzenle"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>

                  <button
                    onClick={() => handleDelete(post.slug)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-100"
                    title="Yazıyı Sil"
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