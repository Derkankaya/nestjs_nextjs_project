'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Clock, Image as ImageIcon, Settings, Mail, FileText, BarChart2, Shield, LogOut } from 'lucide-react';
import NotificationBell from '@/components/ui/NotificationBell';
import api from '@/services/api';

export default function MobileMenu({ isOpen, setIsOpen, user, handleLogout, searchQuery, setSearchQuery, handleSearch }: any) {
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && recentPosts.length === 0) {
      const fetchRecentPosts = async () => {
        try {
          const response = await api.get('/posts', {
            params: { limit: 5, sortBy: 'createdAt', sortOrder: 'desc', status: 'PUBLISHED' }
          });
          const data = Array.isArray(response.data) ? response.data : response.data?.posts || [];
          setRecentPosts(data);
        } catch (err) {
          console.error('Son yazılar çekilemedi:', err);
        }
      };
      fetchRecentPosts();
    }
  }, [isOpen]);

  if (!isOpen) return null;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="md:hidden bg-white border-t border-slate-200 px-4 pt-4 pb-6 space-y-4 shadow-2xl absolute w-full max-h-[85vh] overflow-y-auto">
      <form onSubmit={handleSearch} className="relative flex items-center mb-2">
        <input type="text" placeholder="Yazılarda ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 text-sm bg-slate-100 border border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none" />
        <button type="submit" className="absolute left-3 text-slate-400"><Search className="h-5 w-5" /></button>
      </form>

      <Link href="/" onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600">Ana Sayfa</Link>
      <Link href="/categories" onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600">Kategoriler</Link>

      {recentPosts.length > 0 && (
        <div className="bg-slate-50 rounded-2xl pt-4 pb-2 border border-slate-100">
          <div className="flex items-center justify-between mb-3 px-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center"><Clock className="w-4 h-4 mr-1.5 text-indigo-500"/> Son Yazılar</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {recentPosts.map((post: any) => (
              <Link href={`/posts/${post.slug}`} key={post.id} onClick={() => setIsOpen(false)} className="flex-none w-[85vw] snap-center bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="h-40 bg-slate-200 relative flex items-center justify-center">
                  {post.coverImage ? <img src={post.coverImage} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-slate-400" />}
                </div>
                <div className="p-4">
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{post.title}</h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {user ? (
        <div className="border-t border-slate-200 pt-4 space-y-1">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl mb-3 border border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-base shadow-sm">{user.name.charAt(0).toUpperCase()}</div>
              <div><div className="text-sm font-bold text-slate-900">{user.name}</div><div className="text-xs text-slate-500">{user.email}</div></div>
            </div>
            <NotificationBell userId={user.id} />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Link href="/profile/edit" onClick={() => setIsOpen(false)} className="flex items-center justify-center p-3 rounded-xl text-sm font-medium text-slate-700 bg-slate-50 hover:bg-indigo-50 border border-slate-100"><Settings className="h-4 w-4 mr-2 text-slate-400" /> Ayarlar</Link>
            <Link href="/profile/posts" onClick={() => setIsOpen(false)} className="flex items-center justify-center p-3 rounded-xl text-sm font-medium text-slate-700 bg-slate-50 hover:bg-indigo-50 border border-slate-100"><FileText className="h-4 w-4 mr-2 text-slate-400" /> Yazılar</Link>
          </div>
          {isAdmin && <Link href="/admin" onClick={() => setIsOpen(false)} className="flex items-center justify-center p-3 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 mt-2"><Shield className="h-4 w-4 mr-2 text-indigo-600" /> Admin</Link>}
          <button onClick={handleLogout} className="flex items-center justify-center w-full p-3 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 mt-2"><LogOut className="h-4 w-4 mr-2" /> Çıkış Yap</button>
        </div>
      ) : (
        <Link href="/login" onClick={() => setIsOpen(false)} className="flex items-center justify-center w-full p-3 rounded-xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700">Hemen Giriş Yap</Link>
      )}
    </div>
  );
}