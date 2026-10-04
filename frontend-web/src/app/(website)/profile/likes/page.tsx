'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getMyLikes } from '@/services/post.service';
// 🚨 PostCard'ı şutladık, babayı mekana aldık
import LocalInfinitePostList from '@/components/ui/Local_InfinitePostList';
import { Heart, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LikesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Kullanıcı yoksa login'e postala
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchLikes = async () => {
      try {
        const data = await getMyLikes();
        setPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Beğenilenler çekilemedi:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikes();
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Başlık Bölümü */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <Heart className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Beğendiklerim</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          İlham veren ve takdir ettiğin tüm yazılar.
        </p>
      </div>

      {/* Liste */}
      {posts.length > 0 ? (
        /* 🚨 Ameleliği bitirdik, tek satırda işi çözdük */
        <LocalInfinitePostList posts={posts} itemsPerPage={9} />
      ) : (
        <div className="text-center py-16 bg-muted/20 border border-dashed rounded-xl">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Henüz yazı beğenmedin</h3>
          <p className="text-muted-foreground max-w-md mx-auto text-sm mb-6">
            Yazarları desteklemek ve kendi koleksiyonunu oluşturmak için yazılara kalp bırakmayı unutma.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Yazıları Keşfet
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </main>
  );
}