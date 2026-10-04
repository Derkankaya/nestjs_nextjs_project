import { getPosts } from '@/services/post.service';
import Link from 'next/link';
import { ArrowRight, SearchX } from 'lucide-react';
// 🚨 Motoru import ettik
import InfinitePostList from '@/components/ui/InfinitePostList';

interface HomePageProps {
  searchParams?: Promise<{
    limit?: string;
    search?: string; 
  }>;
}

async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const limit = parseInt(params?.limit || '9', 10);
  const searchQuery = params?.search || ''; 
  
  let posts: any[] = [];
  let total = 0;

  try {
    // 🚨 Sadece ilk partiyi çeker, offset her zaman 0
    const response = await getPosts({ limit, offset: 0, search: searchQuery, status: 'PUBLISHED' });
    posts = Array.isArray(response) ? response : response?.posts || [];
    total = Array.isArray(response) ? response.length : response?.total || 0;
  } catch (error) {
    console.error("Yazılar çekilirken hata oluştu:", error);
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Senin o orijinal renkli afiş kısmı */}
      {!searchQuery && (
        <div className="mb-12 text-center bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 rounded-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">BlogApp'e Hoş Geldiniz</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Next.js ve NestJS ile geliştirilmiş modern blog ve içerik yönetim platformu.
            Teknoloji, tasarım ve geliştirme üzerine en son yazılarımızı keşfedin.
          </p>
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Kategorileri Keşfet
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* İçerik Bölümü */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {searchQuery ? `"${searchQuery}" için sonuçlar` : "En Yeni Yazılar"}
        </h2>
        <span className="text-sm text-muted-foreground">Toplam {total} içerik bulundu</span>
      </div>

      {/* 🚨 SİHİR BURADA: Amelelik bitti, işi motora verdik */}
      {posts.length > 0 ? (
        <InfinitePostList 
          initialPosts={posts} 
          total={total} 
          searchQuery={searchQuery} 
          limit={limit} 
        />
      ) : (
        <div className="text-center py-16">
          <SearchX className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Sonuç bulunamadı</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {searchQuery
              ? `"${searchQuery}" kelimesi ile eşleşen bir içerik bulamadık. Lütfen farklı bir kelime deneyin.`
              : "Şu anda burada gösterilecek bir yazı bulunmuyor. Daha sonra tekrar kontrol edin!"}
          </p>
        </div>
      )}
    </main>
  );
}

export const dynamic = 'force-dynamic';
export default HomePage;