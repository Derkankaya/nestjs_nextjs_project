'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { toggleBookmark } from '@/services/post.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

interface BookmarkButtonProps {
  postId: string;
  initialIsBookmarked?: boolean;
}

export default function BookmarkButton({ postId, initialIsBookmarked = false }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  const handleToggle = async () => {
    // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
    if (!user) {
      router.push('/login');
      return;
    }

    if (isLoading) return;

    // UI'ı anında güncelleyelim (Optimistic Update - Kullanıcıyı bekletmemek için)
    setIsBookmarked(!isBookmarked);
    setIsLoading(true);

    try {
      const response = await toggleBookmark(postId);
      // Backend'den gelen kesin cevaba göre durumu eşitle
      setIsBookmarked(response.bookmarked);
    } catch (error) {
      console.error('Kaydetme işlemi başarısız:', error);
      // Hata olursa işlemi geri al
      setIsBookmarked(isBookmarked);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`group flex items-center justify-center p-2.5 rounded-full transition-all duration-300 ${
        isBookmarked 
          ? 'bg-indigo-50 text-indigo-600' 
          : 'bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
      }`}
      title={isBookmarked ? 'Kaydedilenlerden Çıkar' : 'Daha Sonra Oku'}
    >
      <Bookmark 
        className={`h-5 w-5 transition-transform duration-300 ${
          isBookmarked ? 'fill-current scale-110' : 'group-hover:scale-110'
        }`} 
      />
    </button>
  );
}