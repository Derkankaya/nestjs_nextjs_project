import Link from 'next/link';
import { Calendar, Clock, Tag, Folder, Eye } from 'lucide-react';

interface PostCardProps {
  id: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  category?: {
    name: string;
    slug: string;
  } | null;
  // 🚨 YENİ EKLENDİ: Kart artık etiket dizisini kabul ediyor
  tags?: {
    id: string;
    name: string;
    slug?: string;
  }[];
  estimatedReadingTime?: number;
  slug: string;
  createdAt?: string;
  viewCount?: number;
}

export default function PostCard({
  id,
  title,
  excerpt,
  coverImage = null,
  category = null,
  tags = [], // 🚨 YENİ EKLENDİ: Varsayılan olarak boş dizi
  estimatedReadingTime = 0,
  slug,
  createdAt,
  viewCount = 0,
}: PostCardProps) {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200">
      {/* Cover Image */}
      {coverImage && (
        <Link href={`/posts/${slug}`} className="relative aspect-video overflow-hidden border-b border-slate-100">
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
          {category && (
            <Link
              href={`/categories/${category.slug}`}
              className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-bold"
            >
              <Folder className="h-3.5 w-3.5" />
              <span>{category.name}</span>
            </Link>
          )}
          {createdAt && (
            <span className="flex items-center space-x-1 font-medium">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(createdAt)}</span>
            </span>
          )}
          <span className="flex items-center space-x-1 font-medium">
            <Eye className="h-3.5 w-3.5" />
            <span>{viewCount}</span>
          </span>
          
          {estimatedReadingTime > 0 && (
            <span className="flex items-center space-x-1 font-medium">
              <Clock className="h-3.5 w-3.5" />
              <span>{estimatedReadingTime} dk</span>
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={`/posts/${slug}`} className="mb-2">
          <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="text-slate-600 text-sm line-clamp-2 mb-5 flex-1">
          {excerpt}
        </p>

        {/* 🚨 SİHİRLİ DOKUNUŞ: DİNAMİK ETİKETLER BURADA */}
        <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-slate-100">
          {tags && tags.length > 0 ? (
            <>
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100/80 text-[11px] font-bold text-slate-600 border border-slate-200/60"
                >
                  <Tag className="h-3 w-3 mr-1 text-slate-400" />
                  {tag.name}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 text-[11px] font-bold text-slate-400 border border-slate-100">
                  +{tags.length - 3}
                </span>
              )}
            </>
          ) : (
            <div className="flex items-center text-slate-400">
              <Tag className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs italic font-medium">Etiket yok</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}