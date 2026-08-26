import { getPostBySlug } from '@/services/post.service';
import PostCard from '@/components/ui/PostCard';
import { Calendar, Clock, User, Tag, Folder } from 'lucide-react';
import { notFound } from 'next/navigation'; // GÜVENLİK KALKANI: 404 Yönlendirmesi

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function PostPage(props: PageProps) {
  const params = await props.params;
  
  let post = null;

  // 1. ZIRH: Backend çökerse veya makale gelmezse sistemi ayakta tut
  try {
    post = await getPostBySlug(params.slug);
  } catch (error) {
    console.error("Yazı çekilirken hata oluştu:", error);
  }

  // 2. ZIRH: Eğer post gerçekten yoksa, Next.js'in standart 404 (Not Found) sayfasına yönlendir
  if (!post) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {post.category && (
                <a
                  href={`/categories/${post.category.slug}`}
                  className="flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium"
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
                <span>{post.estimatedReadingTime} min read</span>
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center space-x-4 border-t border-slate-200 pt-6">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{post.author.name}</p>
                  <p className="text-xs text-slate-500">Author</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Post Content */}
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

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: any) => (
                    <a
                      key={tag.slug}
                      href={`/tags/${tag.slug}`}
                      className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      <Tag className="h-4 w-4" />
                      <span>{tag.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-8 space-y-6">
              {/* Author Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">About Author</h3>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{post.author.name}</p>
                    <p className="text-sm text-slate-500">Full Stack Developer</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  Passionate about building modern web applications and sharing knowledge
                  with the community.
                </p>
              </div>

              {/* Recent Posts Placeholder (TypeScript hataları giderildi) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Posts</h3>
                <div className="space-y-4">
                  <PostCard
                    id="1"
                    title="Getting Started with Next.js 14"
                    excerpt="Learn the basics of Next.js and how to build your first application."
                    category={{ name: 'Development', slug: 'development' }}
                    estimatedReadingTime={5}
                    slug="/posts/getting-started-with-nextjs"
                    createdAt={new Date().toISOString()}
                    coverImage={null}
                  />
                  <PostCard
                    id="2"
                    title="Understanding React Server Components"
                    excerpt="A deep dive into React Server Components and how they change the way we build apps."
                    category={{ name: 'Development', slug: 'development' }}
                    estimatedReadingTime={8}
                    slug="/posts/react-server-components"
                    createdAt={new Date().toISOString()}
                    coverImage={null}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostPage;