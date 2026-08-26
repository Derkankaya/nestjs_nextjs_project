import Link from 'next/link';
import { Calendar, Clock, Tag, Folder } from 'lucide-react';

interface PostCardProps {
  id: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  category?: {
    name: string;
    slug: string;
  } | null;
  estimatedReadingTime?: number;
  slug: string;
  createdAt?: string;
}

export default function PostCard({
  title,
  excerpt,
  coverImage = null,
  category= null,
  estimatedReadingTime = 0,
  slug,
  createdAt,
}: PostCardProps) {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200">
      {/* Cover Image */}
      {coverImage && (
        <Link href={`/posts/${slug}`} className="relative aspect-video overflow-hidden">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </Link>
      )}

      <div className="p-5 flex-1 flex flex-col">
        {/* Meta Info */}
        <div className="flex items-center space-x-4 text-xs text-slate-500 mb-3">
          {Folder && (
            <Link
              href={`/categories/${category?.slug}`}
              className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <Folder className="h-3.5 w-3.5" />
              <span>{Folder.name}</span>
            </Link>
          )}
          {createdAt && (
            <span className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(createdAt)}</span>
            </span>
          )}
          {estimatedReadingTime > 0 && (
            <span className="flex items-center space-x-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{estimatedReadingTime} min read</span>
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={`/posts/${slug}`} className="mb-3">
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1">
          {excerpt}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <Tag className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 italic">No tags yet</span>
        </div>
      </div>
    </div>
  );
}
