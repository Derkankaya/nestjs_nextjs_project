import { getPostBySlug, getPosts } from '@/services/post.service'; 
import PostCard from '@/components/ui/PostCard';
import { Calendar, Clock, User, Tag, Folder, Eye } from 'lucide-react';
import { notFound } from 'next/navigation';
import LikeButton from '@/components/ui/LikeButton';
import CommentSection from '@/components/ui/CommentSection';
import BookmarkButton from '@/components/ui/BookmarkButton';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function PostPage(props: PageProps) {
  const params = await props.params;
  const slug = params.slug;

  let post: any = null;
  let recentPosts: any[] = [];

  try {
    // 1. Ana yazıyı çek
    post = await getPostBySlug(slug);
    
    // 2. Sidebar için son yazıları çek
    if (post) {
      const recentResponse = await getPosts({ limit: 3, status: 'PUBLISHED' });
      const allRecent = Array.isArray(recentResponse) ? recentResponse : recentResponse?.posts || [];
      // Şuan okuduğumuz yazıyı "Son Yazılar" arasından çıkarıp 2 tane alıyoruz
      recentPosts = allRecent.filter((p: any) => p.id !== post.id).slice(0, 2);
    }
  } catch (error) {
    console.error("Veriler çekilirken hata oluştu:", error);
  }

  if (!post) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalLikes = post.likes?.length || 0;
  const initialIsLiked = false; 

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl">
            
            {/* Meta Bilgileri */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {post.category && (
                <a
                  href={`/categories/${post.category.slug}`}
                  className="flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200 transition-colors"
                >
                  <Folder className="h-4 w-4" />
                  <span>{post.category.name}</span>
                </a>
              )}
              <span className="flex items-center space-x-2 text-slate-500 text-sm">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.createdAt)}</span>
              </span>
              <span className="flex items-center space-x-2 text-slate-500 text-sm">
                <Clock className="h-4 w-4" />
                <span>{post.estimatedReadingTime} dk okuma</span>
              </span>
              <span className="flex items-center space-x-2 text-slate-500 text-sm font-medium">
                <Eye className="h-4 w-4" />
                <span>{post.viewCount || 0} görüntülenme</span>
              </span>
            </div> 

            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Yazar ve Aksiyon Butonları (Like & Bookmark) */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-6">
              
              {/* Sol: Yazar Profil */}
              <Link href={`/author/${post.author.username}`} className="flex items-center space-x-3 group cursor-pointer">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border border-transparent group-hover:border-indigo-500 transition-colors">
                  {post.author?.avatar ? (
                    <img src={post.author.avatar} alt={post.author.name} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-indigo-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{post.author.name}</p>
                  <p className="text-xs text-slate-500">{post.author.role || 'Yazar'}</p>
                </div>
              </Link>
              {/* Sağ: Butonlar */}
              <div className="flex items-center space-x-2">
                <LikeButton 
                  postId={post.id} 
                  initialLikesCount={totalLikes} 
                  initialIsLiked={initialIsLiked} 
                />
                <BookmarkButton 
                  postId={post.id} 
                  initialIsBookmarked={false} 
                />
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Sol Kolon: Post İçeriği */}
          <div className="lg:col-span-8">
            {post.coverImage && (
              <div className="rounded-2xl overflow-hidden mb-8 shadow-lg">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-auto"
                />
              </div>
            )}

            <div
              className="prose prose-lg prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Temizlenmiş ve Tekilleştirilmiş Etiketler */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Etiketler</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: any) => (
                    <a
                      key={tag.id}
                      href={`/tags/${tag.id}`}
                      className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      <Tag className="h-4 w-4" />
                      <span>{tag.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Yorumlar Bölümü */}
            <CommentSection 
              postId={post.id} 
              initialComments={post.comments || []} 
            />
            
          </div>

          {/* Sağ Kolon: Dinamik Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              {/* Dinamik Yazar Hakkında */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Yazar Hakkında</h3>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                    {post.author?.avatar ? (
                      <img src={post.author.avatar} alt={post.author.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{post.author.name}</p>
                    <p className="text-sm text-slate-500">{post.author.role || 'Editör'}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  {post.author.bio || 'Modern web teknolojileri üzerine yazılar yazan ve deneyimlerini toplulukla paylaşan bir teknoloji tutkunu.'}
                </p>
              </div>

              {/* Dinamik Son Yazılar (Bulunduğumuz yazı hariç) */}
              {recentPosts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">İlgini Çekebilir</h3>
                  <div className="space-y-4">
                    {recentPosts.map((recent: any) => (
                      <PostCard
                        key={recent.id}
                        id={recent.id}
                        title={recent.title}
                        excerpt={recent.excerpt || 'Özet bulunmuyor.'}
                        category={recent.category}
                        estimatedReadingTime={recent.estimatedReadingTime}
                        slug={recent.slug}
                        createdAt={recent.createdAt}
                        coverImage={recent.coverImage}
                        viewCount={recent.viewCount}
                      />
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default PostPage;