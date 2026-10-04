'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { User, Send, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api'; // API çağrıları için

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
}

export default function CommentSection({ postId, initialComments = [] }: CommentSectionProps) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      // Backend'e yorum gönderme isteği (Endpoint'in ayarlarına göre burası değişebilir)
      const response = await api.post('/comments', {
        postId,
        content: newComment,
      });

      // Yorum başarıyla eklendiyse (Backend anında onaylıyorsa) listeye ekle
      // Eğer backend onaya (PENDING) düşürüyorsa burada kullanıcıya "Yorumunuz onaya gönderildi" diyebiliriz.
      if (response.data) {
        setComments((prev) => [...prev, response.data]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Yorum gönderilirken hata oluştu:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mt-16 pt-10 border-t border-slate-200">
      <div className="flex items-center space-x-2 mb-8">
        <MessageSquare className="h-6 w-6 text-indigo-600" />
        <h3 className="text-2xl font-bold text-slate-900">Yorumlar ({comments.length})</h3>
      </div>

      {/* Yorum Yapma Alanı */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-10">
        {user ? (
          <form onSubmit={handleSubmit}>
            <div className="flex items-start space-x-4">
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Bu yazı hakkında ne düşünüyorsunuz?"
                  className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all shadow-sm"
                  rows={3}
                  required
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <span>{isSubmitting ? 'Gönderiliyor...' : 'Yorum Yap'}</span>
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            <h4 className="text-slate-800 font-bold mb-2">Yorum yapmak için giriş yapmalısınız</h4>
            <p className="text-sm text-slate-500 mb-4">Fikirlerinizi paylaşmak ve tartışmaya katılmak için hemen giriş yapın.</p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
            >
              Giriş Yap
            </Link>
          </div>
        )}
      </div>

      {/* Yorumları Listeleme */}
      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-hover hover:shadow-md">
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="h-5 w-5 text-slate-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="font-bold text-slate-900">{comment.user?.name || 'Anonim Kullanıcı'}</h5>
                  <span className="text-xs text-slate-400 font-medium">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mt-2 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-white border border-slate-100 rounded-2xl border-dashed">
            <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">İlk yorumu siz yapın!</p>
          </div>
        )}
      </div>
    </div>
  );
}