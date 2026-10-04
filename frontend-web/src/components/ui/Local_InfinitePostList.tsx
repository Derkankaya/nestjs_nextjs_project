// components/ui/LocalInfinitePostList.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import PostCard from '@/components/ui/PostCard';

interface LocalInfinitePostListProps {
  posts: any[];
  itemsPerPage?: number;
}

export default function LocalInfinitePostList({ posts, itemsPerPage = 9 }: LocalInfinitePostListProps) {
  // Ekranda kaç tane göstereceğimizi tutuyoruz
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const observer = useRef<IntersectionObserver | null>(null);

  // Gösterecek daha mal var mı?
  const hasMore = visibleCount < posts.length;

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver((entries) => {
      // Adam son karta geldiğinde ve hala post varsa, sayıyı artırıp ekrana salıyoruz
      if (entries[0].isIntersecting && hasMore) {
        setVisibleCount((prev) => prev + itemsPerPage);
      }
    });

    if (node) observer.current.observe(node);
  }, [hasMore, itemsPerPage]);

  // Sadece görünür olanları kesip alıyoruz
  const visiblePosts = posts.slice(0, visibleCount);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visiblePosts.map((post: any, index: number) => {
          if (visiblePosts.length === index + 1) {
            return (
              <div ref={lastElementRef} key={post.id || index}>
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

      {!hasMore && posts.length > itemsPerPage && (
        <p className="text-center text-muted-foreground my-8">
          Listenin sonuna geldin kral!
        </p>
      )}
    </>
  );
}