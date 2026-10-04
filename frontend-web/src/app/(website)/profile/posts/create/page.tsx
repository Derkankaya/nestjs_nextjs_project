'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { createPost } from '@/services/post.service';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import { FileText, Save, Loader2, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}
interface Tag {
  id: string;
  name: string;
}

export default function CreateProfilePostPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [loadingAction, setLoadingAction] = useState<'DRAFT' | 'PUBLISHED' | null>(null);
  const [error, setError] = useState('');

  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        const tagsResponse = await api.get('/tags');
        const data = Array.isArray(response.data) ? response.data : response.data?.categories || [];
        setCategories(data);
        setTags(tagsResponse.data || []);
        if (data.length > 0) setCategoryId(data[0].id);
      } catch (err) {
        console.error('Kategoriler yüklenirken hata:', err);
      }
    };
    fetchCategories();
  }, []);

  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    );
  };
  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId) // Varsa çıkar
        : [...prev, tagId] // Yoksa ekle
    );
  };


  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!user) return;
    
    // HTML5 form validasyonunu manuel tetiklemek için basit kontrol
    if (!title || !slug || !content) {
      setError('Lütfen zorunlu alanları (Başlık, Slug ve İçerik) doldurun.');
      return;
    }

    setLoadingAction(status);
    setError('');

    try {
      await createPost({
        title,
        slug,
        excerpt,
        content,
        categoryId,
        tagIds: selectedTagIds,
        status: status, // 
        authorId: user.id, 
      });

      router.push('/profile/posts');
    } catch (err: any) {
      console.error('Yazı oluşturulurken hata:', err);
      setError(err?.response?.data?.message || 'Yazı oluşturulamadı. Lütfen alanları kontrol edin.');
    } finally {
      setLoadingAction(null);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8 px-4">
      {/* Geri Dön ve Başlık */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <Link href="/profile/posts" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Yeni Yazı Oluştur</h1>
            <p className="text-slate-500 text-sm">Düşüncelerinizi toplulukla paylaşın.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        {/* Form etiketi onSubmit yerine butonların onClick eventlerini kullanacağız */}
        <div className="space-y-6">
          
          {/* Başlık */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Yazı Başlığı <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={title}
              onChange={handleTitleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 text-sm"
              placeholder="Harika bir başlık yazın..."
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL (Slug) <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-600 text-sm outline-none"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
              {tags.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Etiketler (Çoklu Seçim)
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                        isSelected 
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm scale-[1.02]' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      # {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {/* Özet (Excerpt) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kısa Özet</label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 text-sm"
              placeholder="Yazının ana fikrini kısaca özetleyin..."
            />
          </div>

          {/* İçerik */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">İçerik (HTML veya Düz Metin) <span className="text-red-500">*</span></label>
            <textarea
              rows={8}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 text-sm font-mono"
              placeholder="Yazınızın içeriğini buraya girin..."
            />
          </div>

          {/* 👈 YENİ: İkili Buton Yapısı (Taslak & Yayınla) */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 pt-4 border-t border-slate-100">
            {/* Taslak Olarak Kaydet Butonu */}
            <button
              type="button"
              onClick={() => handleSave('DRAFT')}
              disabled={loadingAction !== null}
              className="flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-70 text-sm"
            >
              {loadingAction === 'DRAFT' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              <span>Taslak Olarak Kaydet</span>
            </button>

            {/* Yayınla Butonu */}
            <button
              type="button"
              onClick={() => handleSave('PUBLISHED')}
              disabled={loadingAction !== null}
              className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-sm disabled:opacity-70 text-sm"
            >
              {loadingAction === 'PUBLISHED' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              <span>Yazıyı Yayınla</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}