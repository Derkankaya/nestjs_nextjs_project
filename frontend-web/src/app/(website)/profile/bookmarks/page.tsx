'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getMyBookmarks } from '@/services/post.service';
// 🚨 Usta PostCard'ı sildik, bizim motoru getirdik
import LocalInfinitePostList from '@/components/ui/Local_InfinitePostList';
import { Bookmark, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BookmarksPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Giriş yapmamışsa anasayfaya postalıyoruz
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchBookmarks = async () => {
      try {
        const data = await getMyBookmarks();
        setPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Kaydedilenler çekilemedi:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
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
            <Bookmark className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Kaydettiklerim</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Daha sonra okumak için ayırdığın tüm yazılar burada.
        </p>
      </div>

      {/* Liste */}
      {posts.length > 0 ? (
        /* 🚨 Koca döngüyü çöpe attık, motoru ateşledik! */
        <LocalInfinitePostList posts={posts} itemsPerPage={9} />
      ) : (
        <div className="text-center py-16 bg-muted/20 border border-dashed rounded-xl">
          <Bookmark className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Henüz yazı kaydetmedin</h3>
          <p className="text-muted-foreground max-w-md mx-auto text-sm mb-6">
            Keşfetmeye başla ve ilgini çeken yazıları kaydet ikonuna tıklayarak buraya ekle.
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