'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Shield, AlertTriangle, Ban, 
  CheckCircle, Loader2, Clock, Mail, Calendar, FileText, Send, Trash2 
} from 'lucide-react';
import { getUserDetails, updateUserStatus } from '@/services/user.service'; 
import { sendSingleNotification } from '@/services/notification.service';
import { updatePostStatus, deletePost } from '@/services/post.service'; // YENİ: Post servisleri eklendi

interface Post {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  bannedUntil?: string | null;
  banReason?: string | null;
  createdAt: string;
  posts: Post[];
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Moderasyon Modal State'leri
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'SUSPEND' | 'BAN' | 'ACTIVATE' | 'MESSAGE' | null>(null);
  const [banDuration, setBanDuration] = useState('7'); // Varsayılan 7 gün
  const [reasonOrMessage, setReasonOrMessage] = useState(''); // Hem ban sebebi hem de mesaj içeriği için
  const [messageTitle, setMessageTitle] = useState(''); // Sadece özel mesajda kullanılacak başlık
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  // Gerçek Backend Verisini Çekme
  const fetchUser = async () => {
    try {
      setLoading(true);
      const data = await getUserDetails(params.id as string) as any;
      setUser({ ...data, posts: data.posts || [] });
    } catch (error) {
      console.error("Kullanıcı detayları çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  // Gerçek API İsteklerini Atma (Ceza veya Mesaj)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    
    try {
      if (actionType === 'MESSAGE') {
        await sendSingleNotification(user.id, messageTitle, reasonOrMessage);
        alert('Mesaj başarıyla gönderildi!');
      } else {
        const statusMap = {
          'ACTIVATE': 'ACTIVE',
          'SUSPEND': 'SUSPENDED',
          'BAN': 'BANNED'
        } as const;
        
        await updateUserStatus(
          user.id, 
          statusMap[actionType as 'ACTIVATE' | 'SUSPEND' | 'BAN'], 
          actionType === 'SUSPEND' ? Number(banDuration) : undefined, 
          reasonOrMessage
        );
        
        setUser({ ...user, status: statusMap[actionType as 'ACTIVATE' | 'SUSPEND' | 'BAN'] });
      }
      setModalOpen(false);
    } catch (error) {
      console.error("İşlem başarısız:", error);
      alert('Bir hata oluştu!');
    } finally {
      setSubmitting(false);
    }
  };

  // YENİ: Post İşlemleri (Yayına Al/Kaldır ve Sil)
  const handlePostAction = async (postId: string, action: 'PUBLISH' | 'UNPUBLISH' | 'DELETE') => {
    if (!user) return;

    try {
      if (action === 'DELETE') {
        const confirmDelete = window.confirm('Bu yazıyı tamamen silmek istediğinize emin misiniz?');
        if (!confirmDelete) return;
        
        await deletePost(postId);
        // Silinen yazıyı state'ten çıkararak ekrandan anında kaybet
        setUser({ ...user, posts: user.posts.filter(p => p.id !== postId) });
      } 
      else {
        const newStatus = action === 'PUBLISH' ? 'PUBLISHED' : 'DRAFT';
        await updatePostStatus(postId, newStatus);
        
        // Yazının durumunu ekranda anında güncelle
        setUser({
          ...user,
          posts: user.posts.map(p => p.id === postId ? { ...p, status: newStatus } : p)
        });
      }
    } catch (error) {
      console.error('Yazı işlemi başarısız:', error);
      alert('İşlem sırasında bir hata oluştu.');
    }
  };

  const openModal = (type: 'SUSPEND' | 'BAN' | 'ACTIVATE' | 'MESSAGE') => {
    setActionType(type);
    setReasonOrMessage('');
    setMessageTitle('');
    setBanDuration('7');
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-600">Kullanıcı detayları yükleniyor...</p>
      </div>
    );
  }

  if (!user) return <div>Kullanıcı bulunamadı.</div>;

  return (
    <div className="space-y-6">
      {/* Üst Kısım / Geri Butonu */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => router.push('/admin/users')}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kullanıcı Detayları</h1>
          <p className="text-slate-500 text-sm">Profil, Moderasyon ve İletişim</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SOL SÜTUN: Profil ve Moderasyon Kartı */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col items-center text-center border-b border-slate-100 pb-6 mb-6">
              <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold mb-4">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
              <div className="flex items-center text-slate-500 mt-1">
                <Mail className="h-4 w-4 mr-2" />
                <span>{user.email}</span>
              </div>
              
              {/* Rol ve Durum Badgeleri */}
              <div className="flex gap-2 mt-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center">
                  <Shield className="h-3 w-3 mr-1" /> {user.role}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center ${
                  user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  user.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {user.status === 'ACTIVE' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Ban className="h-3 w-3 mr-1" />}
                  {user.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center"><Calendar className="h-4 w-4 mr-2"/> Kayıt Tarihi</span>
                <span className="font-medium text-slate-900">{new Date(user.createdAt).toLocaleDateString('tr-TR')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center"><FileText className="h-4 w-4 mr-2"/> Toplam Yazı</span>
                <span className="font-medium text-slate-900">{user.posts.length}</span>
              </div>
            </div>

            {/* Moderasyon Butonları */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">İşlemler</h3>
              
              <button onClick={() => openModal('MESSAGE')} className="w-full py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors flex items-center justify-center mb-4">
                <Send className="h-4 w-4 mr-2" /> Bildirim / Mesaj Gönder
              </button>

              {user.status !== 'ACTIVE' ? (
                <button onClick={() => openModal('ACTIVATE')} className="w-full py-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium transition-colors flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 mr-2" /> Hesabı Aktifleştir
                </button>
              ) : (
                <>
                  <button onClick={() => openModal('SUSPEND')} className="w-full py-2.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg font-medium transition-colors flex items-center justify-center">
                    <Clock className="h-4 w-4 mr-2" /> Süreli Askıya Al
                  </button>
                  <button onClick={() => openModal('BAN')} className="w-full py-2.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium transition-colors flex items-center justify-center">
                    <Ban className="h-4 w-4 mr-2" /> Kalıcı Olarak Banla
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* SAĞ SÜTUN: Kullanıcının Yazıları (GÜNCELLENDİ) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="font-semibold text-slate-900">Yazarın İçerikleri</h2>
              <span className="text-sm text-slate-500">{user.posts?.length || 0} Yazı</span>
            </div>
            
            {!user.posts || user.posts.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Bu kullanıcının henüz yazısı bulunmuyor.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {user.posts.map(post => (
                  <div key={post.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                    <div>
                      <h3 className="font-medium text-slate-900 mb-1">{post.title}</h3>
                      <div className="flex items-center text-xs text-slate-500 space-x-4">
                        <span>{new Date(post.createdAt).toLocaleDateString('tr-TR')}</span>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${post.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                          {post.status === 'PUBLISHED' ? 'Yayında' : 'Taslak'}
                        </span>
                      </div>
                    </div>
                    
                    {/* YENİ: Aksiyon Butonları */}
                    <div className="flex items-center space-x-2">
                      {post.status === 'PUBLISHED' ? (
                        <button 
                          onClick={() => handlePostAction(post.id, 'UNPUBLISH')}
                          className="px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                        >
                          Yayından Kaldır
                        </button>
                      ) : (
                        <button 
                          onClick={() => handlePostAction(post.id, 'PUBLISH')}
                          className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          Yayına Al
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handlePostAction(post.id, 'DELETE')}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      </div>

      {/* TEK VE BİRLEŞTİRİLMİŞ MODAL (Ban, Suspend, Activate, Message) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className={`p-4 border-b ${
              actionType === 'BAN' ? 'bg-red-50 border-red-100' : 
              actionType === 'SUSPEND' ? 'bg-orange-50 border-orange-100' :
              actionType === 'ACTIVATE' ? 'bg-green-50 border-green-100' :
              'bg-indigo-50 border-indigo-100'
            }`}>
              <div className="flex items-center text-lg font-bold">
                {actionType === 'MESSAGE' && <Send className="h-5 w-5 mr-2 text-indigo-600" />}
                {actionType === 'BAN' && <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />}
                {actionType === 'SUSPEND' && <Clock className="h-5 w-5 mr-2 text-orange-600" />}
                {actionType === 'ACTIVATE' && <CheckCircle className="h-5 w-5 mr-2 text-green-600" />}
                
                <span className="text-slate-900">
                  {actionType === 'BAN' ? 'Kullanıcıyı Banla' : 
                   actionType === 'SUSPEND' ? 'Hesabı Askıya Al' : 
                   actionType === 'ACTIVATE' ? 'Hesabı Aktifleştir' :
                   'Kullanıcıya Mesaj Gönder'}
                </span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {actionType === 'MESSAGE' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mesaj Başlığı</label>
                  <input 
                    required 
                    type="text" 
                    value={messageTitle} 
                    onChange={(e) => setMessageTitle(e.target.value)}
                    placeholder="Örn: Yazınız Hakkında İnceleme"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {actionType === 'SUSPEND' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ceza Süresi</label>
                  <select 
                    value={banDuration} 
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1">1 Gün</option>
                    <option value="3">3 Gün</option>
                    <option value="7">7 Gün</option>
                    <option value="14">14 Gün</option>
                    <option value="30">30 Gün</option>
                  </select>
                </div>
              )}

              {actionType !== 'ACTIVATE' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {actionType === 'MESSAGE' ? 'Mesaj İçeriği' : 'Sebep (Kullanıcıya Bildirim Gidecek)'}
                  </label>
                  <textarea 
                    required
                    rows={4}
                    value={reasonOrMessage}
                    onChange={(e) => setReasonOrMessage(e.target.value)}
                    placeholder={actionType === 'MESSAGE' ? 'Mesajınızı buraya yazın...' : 'Örn: Topluluk kurallarını ihlal eden içerik...'}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {actionType === 'ACTIVATE' && (
                <p className="text-slate-600 text-center">
                  Bu kullanıcının cezası kaldırılacak ve platformu tekrar tam yetkiyle kullanmaya başlayabilecek. Onaylıyor musunuz?
                </p>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={submitting} className={`px-4 py-2 text-white rounded-lg flex items-center transition-colors ${
                  actionType === 'BAN' ? 'bg-red-600 hover:bg-red-700' : 
                  actionType === 'SUSPEND' ? 'bg-orange-600 hover:bg-orange-700' :
                  actionType === 'ACTIVATE' ? 'bg-green-600 hover:bg-green-700' :
                  'bg-indigo-600 hover:bg-indigo-700'
                }`}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {actionType === 'BAN' ? 'Kalıcı Banla' : 
                   actionType === 'SUSPEND' ? 'Askıya Al' : 
                   actionType === 'ACTIVATE' ? 'Onayla ve Aç' : 
                   'Mesajı Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}