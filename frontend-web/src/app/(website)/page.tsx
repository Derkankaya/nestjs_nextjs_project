import { getPosts } from '@/services/post.service';
import PostCard from '@/components/ui/PostCard';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface HomePageProps {
  searchParams?: Promise<{
    page?: string;
    limit?: string;
  }>;
}

async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  const page = parseInt(params?.page || '1', 10);
  const limit = parseInt(params?.limit || '10', 10);
  const offset = (page - 1) * limit;

  // GÜVENLİK KALKANI: API yanıt vermezse veya boş gelirse sayfanın çökmesini engeller
  let posts: any[] = [];
  let total = 0;

  try {
    const response = await getPosts(limit, offset);
    // Gelen verinin gerçekten bir dizi olup olmadığını kontrol edip yedeğe alıyoruz
    posts = Array.isArray(response?.posts) ? response.posts : [];
    total = response?.total || 0;
  } catch (error) {
    console.error("Yazılar çekilirken hata oluştu:", error);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to BlogTemplate
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
            A modern blog and CMS platform built with Next.js and NestJS. Explore our
            latest articles on technology, design, and development.
          </p>
          <Link
            href="/categories"
            className="inline-flex items-center space-x-2 bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            <span>Explore Categories</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Latest Posts</h2>
          <div className="text-sm text-slate-500">
            Showing {posts.length} of {total} posts
          </div>
        </div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post: any) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                excerpt={post.excerpt}
                coverImage={post.coverImage}
                category={post.category}
                estimatedReadingTime={post.estimatedReadingTime}
                slug={post.slug}
                createdAt={post.createdAt}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-block p-6 rounded-full bg-slate-100 mb-4">
              <ArrowRight className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-slate-900 mb-2">No posts found</h3>
            <p className="text-slate-500">Check back later for new content!</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center space-x-2">
            <Link
              href={`?page=${page - 1}&limit=${limit}`}
              legacyBehavior
              passHref
              scroll={false}
            >
              <a
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  page === 1
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
                aria-disabled={page === 1}
              >
                Previous
              </a>
            </Link>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`?page=${p}&limit=${limit}`}
                legacyBehavior
                passHref
                scroll={false}
              >
                <a
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    page === p
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {p}
                </a>
              </Link>
            ))}

            <Link
              href={`?page=${page + 1}&limit=${limit}`}
              legacyBehavior
              passHref
              scroll={false}
            >
              <a
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  page === totalPages
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
                aria-disabled={page === totalPages}
              >
                Next
              </a>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;