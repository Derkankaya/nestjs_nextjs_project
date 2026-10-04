'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Clock, Image as ImageIcon, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import api from '@/services/api';

export default function MegaMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const response = await api.get('/posts', {
          params: { limit: 10, sortBy: 'createdAt', sortOrder: 'desc', status: 'PUBLISHED' }
        });
        const data = Array.isArray(response.data) ? response.data : response.data?.posts || [];
        setRecentPosts(data);
      } catch (err) {
        console.error('Son yazılar çekilemedi:', err);
      }
    };
    fetchRecentPosts();
  }, []);

  useEffect(() => {
    if (isOpen) setCurrentSlide(0);
  }, [isOpen]);

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    setCurrentSlide((prev) => (prev === recentPosts.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    setCurrentSlide((prev) => (prev === 0 ? recentPosts.length - 1 : prev - 1));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div 
      className="relative group h-12 flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="text-sm font-bold text-slate-600 hover:text-indigo-600 flex items-center space-x-1 transition-colors h-full">
        <span>Son Yazılar</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-12 left-0 w-[500px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 p-5 cursor-default">
          {recentPosts.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center"><Clock className="w-4 h-4 mr-2 text-indigo-500"/> En Taze {recentPosts.length} İçerik</h3>
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">
                  {currentSlide + 1} / {recentPosts.length}
                </span>
              </div>
              
              <div className="relative group/slider rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                <Link href={`/posts/${recentPosts[currentSlide].slug}`} onClick={() => setIsOpen(false)} className="block relative">
                  <div className="w-full h-64 bg-slate-200 flex items-center justify-center relative">
                    {recentPosts[currentSlide].coverImage ? (
                      <img src={recentPosts[currentSlide].coverImage} alt={recentPosts[currentSlide].title} className="w-full h-full object-cover transition-transform duration-500 group-hover/slider:scale-105" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-slate-400" />
                    )}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur shadow-sm px-2.5 py-1 rounded-md text-[11px] font-bold text-indigo-600 uppercase">
                      {recentPosts[currentSlide].category?.name || 'Genel'}
                    </div>
                  </div>
                  <div className="p-5 bg-white relative z-10">
                    <h4 className="text-lg font-bold text-slate-900 line-clamp-2">{recentPosts[currentSlide].title}</h4>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">{recentPosts[currentSlide].excerpt}</p>
                  </div>
                </Link>

                {recentPosts.length > 1 && (
                  <>
                    <button onClick={prevSlide} className="absolute left-2 top-32 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-white text-slate-800 rounded-full shadow-md opacity-0 group-hover/slider:opacity-100"><ChevronLeft className="w-5 h-5" /></button>
                    <button onClick={nextSlide} className="absolute right-2 top-32 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-white text-slate-800 rounded-full shadow-md opacity-0 group-hover/slider:opacity-100"><ChevronRight className="w-5 h-5" /></button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-slate-900 font-bold mb-1">Henüz Yazı Yok</h4>
              <p className="text-sm text-slate-500">Platforma henüz bir içerik eklenmemiş.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}