// src/components/ui/LikeButton.tsx
'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

interface LikeButtonProps {
  postId: string;
  initialLikesCount: number;
  initialIsLiked: boolean;
}

export default function LikeButton({ postId, initialLikesCount, initialIsLiked }: LikeButtonProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleLikeToggle = async () => {
    // 1. Kullanıcı giriş yapmamışsa login sayfasına at
    if (!user) {
      router.push('/login');
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    // 2. OPTIMISTIC UI: Beklemeden anında ekranı güncelle (Hızlı hissettirir)
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    // 3. Arka planda Backend'e isteği gönder
    try {
      await api.post(`/posts/${postId}/like`);
    } catch (error) {
      // Hata olursa UI'ı eski haline çevir
      console.error('Like işleminde hata:', error);
      setIsLiked(isLiked); 
      setLikesCount(initialLikesCount);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLikeToggle}
      disabled={isLoading}
      className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-all duration-300 ${
        isLiked 
          ? 'bg-red-50 border-red-200 text-red-500 shadow-sm scale-105' 
          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
      }`}
    >
      <Heart 
        className={`h-5 w-5 transition-colors duration-300 ${isLiked ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} 
      />
      <span className="font-semibold text-sm">{likesCount}</span>
    </button>
  );
}