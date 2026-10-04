// components/InfinitePostList.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import PostCard from '@/components/ui/PostCard';
import { getPosts } from '@/services/post.service';
import { Loader2 } from 'lucide-react';

interface InfinitePostListProps {
  initialPosts: any[];
  total: number;
  searchQuery: string;
  limit: number;
}

export default function InfinitePostList({ initialPosts, total, searchQuery, limit }: InfinitePostListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length < total);

  const observer = useRef<IntersectionObserver | null>(null);
  
  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prevPage) => prevPage + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    if (page === 1) return;

    const fetchMorePosts = async () => {
      setLoading(true);
      try {
        const offset = (page - 1) * limit;
        const response = await getPosts({ limit, offset, search: searchQuery, status: 'PUBLISHED' });
        const newPosts = Array.isArray(response) ? response : response?.posts || [];

        setPosts((prev) => [...prev, ...newPosts]);

        if (posts.length + newPosts.length >= total || newPosts.length === 0) {
          setHasMore(false);
        }
      } catch (error) {
        console.error("Yenileri çekerken patladık ustam:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMorePosts();
  }, [page, searchQuery, limit, total]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post: any, index: number) => {
          if (posts.length === index + 1) {
            return (
              <div ref={lastPostElementRef} key={post.id || index}>
                <PostCard 
                  id={post.id}
                  title={post.title}
                  slug={post.slug}
                  excerpt={post.excerpt}
                  coverImage={post.coverImage}
                  createdAt={post.createdAt || post.publishedAt}
                  category={post.category}
                  tags={post.tags}
                  estimatedReadingTime={post.estimatedReadingTime}
                  viewCount={post.viewCount}
                />
              </div>
            );
          }
          return (
            <div key={post.id || index}>
              <PostCard 
                id={post.id}
                title={post.title}
                slug={post.slug}
                excerpt={post.excerpt}
                coverImage={post.coverImage}
                createdAt={post.createdAt || post.publishedAt}
                category={post.category}
                tags={post.tags}
                estimatedReadingTime={post.estimatedReadingTime}
                viewCount={post.viewCount}
              />
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="flex justify-center my-6">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-muted-foreground my-8">
          Daha fazla yazı kalmadı kral, hepsini sömürdün! ☕
        </p>
      )}
    </>
  );
}