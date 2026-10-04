'use client';

import { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/category.service';
import { Edit, Trash2, Save, X, Loader2, AlertCircle, CheckCircle2, Tags, FolderTree } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state - 🚨 DÜZELTME: Artık ID değil SLUG tutuyoruz çünkü servisimiz SLUG bekliyor!
 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      
      // Kusursuz Veri Kalkanı
      const fetchedCategories = Array.isArray(data) ? data : (data as any)?.categories || (data as any)?.data || [];
      setCategories(fetchedCategories);
      setError('');
    } catch (err: any) {
      setError('Kategoriler yüklenirken bir hata oluştu.');
      console.error(err);
      setCategories([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Düzenlemeye basınca formu üste kaydır
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setError('');
    setSuccess('');
  };

  const showSuccessMessage = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000); // 4 saniye sonra yeşil mesajı gizle
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formData.name.trim();
    if (!cleanName) {
      setError('Kategori adı boş bırakılamaz.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (editingId) {
        // Güncelleme işlemi
        await updateCategory(editingId, { name: cleanName, description: formData.description.trim() });
        showSuccessMessage('Kategori başarıyla güncellendi!');
      } else {
        // Yeni oluşturma işlemi
        await createCategory({ name: cleanName, description: formData.description.trim() });
        showSuccessMessage('Yeni kategori başarıyla oluşturuldu!');
      }
      
      setEditingId(null);
      setFormData({ name: '', description: '' });
      fetchCategories(); // Listeyi yenile
    } catch (err: any) {
      setError(err.response?.data?.message || 'İşlem başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setConfirmDelete(null);
      showSuccessMessage('Kategori kalıcı olarak silindi.');
    } catch (err: any) {
      setError('Kategori silinemedi. Bu kategoriye ait yazılar olabilir.');
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
        <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
          <FolderTree className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kategori Yönetimi</h1>
          <p className="text-slate-500 text-sm">Blog yazılarınızı gruplandıracağınız kategorileri oluşturun ve düzenleyin.</p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-4 rounded-xl flex items-start space-x-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-4 rounded-xl flex items-start space-x-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SOL: Create/Edit Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
              <Tags className="h-5 w-5 mr-2 text-indigo-500" />
              {editingId ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                  Kategori Adı <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Örn: Teknoloji"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                  Açıklama (SEO için önerilir)
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                  placeholder="Bu kategori ne hakkında..."
                />
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex justify-center items-center space-x-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-70 transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>{editingId ? 'Güncelle' : 'Kaydet'}</span>
                    </>
                  )}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    title="İptal Et"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* SAĞ: Categories List/Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
                <p className="text-slate-600">Kategoriler yükleniyor...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center">
                <div className="bg-slate-100 p-4 rounded-full mb-4">
                  <FolderTree className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Henüz kategori eklenmemiş</h3>
                <p className="text-slate-500 mt-1">Sol taraftaki formu kullanarak ilk kategorinizi oluşturun.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Slug (URL)
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Oluşturulma
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{category.name}</p>
                          {category.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1" title={category.description}>
                              {category.description}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md font-mono">
                            /{category.slug}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                          {formatDate(category.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(category.id)}
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">
                Kategoriyi Sil
              </h3>
              <p className="text-slate-600 mb-6 text-center text-sm">
                Bu kategoriyi kalıcı olarak silmek istediğinize emin misiniz? <br/>
                <span className="font-semibold text-red-500">Not:</span> Bu işlem geri alınamaz.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-sm"
                >
                  Evet, Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}