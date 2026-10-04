import api from './api';

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: {
    name: string;
    slug: string;
  };
  tags: {
    name: string;
    slug: string;
  }[];
  author: {
    name: string;
    avatar: string | null;
  };
  createdAt: string;
  estimatedReadingTime: number;
  status: 'PUBLISHED' | 'DRAFT';
  likes?: { userId: string }[];
  viewCount?: number;
  comments?: any[];
}

export interface PostResponse {
  posts: Post[];
  total: number;
}

export interface CreatePostInput {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  categoryId: string;
  coverImage?: string;
  status?: 'PUBLISHED' | 'DRAFT';
  authorId?: string;
  tagIds?: string[];
}

export interface UpdatePostInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  categoryId?: string;
  coverImage?: string;
  status?: 'PUBLISHED' | 'DRAFT';
}

export interface GetPostsParams {
  limit?: number;
  offset?: number;
  search?: string;
  categoryId?: string;
  status?: 'PUBLISHED' | 'DRAFT';
  startDate?: string;
  endDate?: string;
}

// -------------------------------------------------------------
// 🟢 PUBLIC İŞLEMLER (SEO ve Ziyaretçi için URL'de SLUG Kullanır)
// -------------------------------------------------------------

export const getPosts = async (params: GetPostsParams = {}): Promise<PostResponse> => {
  const response = await api.get<PostResponse>('/posts', {
    params: { limit: 10, offset: 0, ...params },
  });
  return response.data;
};

export const getPostBySlug = async (slug: string): Promise<Post> => {
  const response = await api.get<Post>(`/posts/slug/${slug}`); // Not: Backend'deki @Get('slug/:slug') ile eşleşmesi için güncelledik
  return response.data;
};

export const getPostsByCategory = async (slug: string, limit: number = 10, offset: number = 0): Promise<PostResponse> => {
  const response = await api.get<PostResponse>('/posts/category', {
    params: { slug, limit, offset },
  });
  return response.data;
};

export const getPostsByTag = async (slug: string, limit: number = 10, offset: number = 0): Promise<PostResponse> => {
  const response = await api.get<PostResponse>('/posts/tag', {
    params: { slug, limit, offset },
  });
  return response.data;
};


// -------------------------------------------------------------
// 🔴 ADMİN İŞLEMLERİ (Veri Bütünlüğü İçin Tamamı ID Kullanır)
// -------------------------------------------------------------

// YENİ EKLENDİ: Admin edit sayfasına girerken yazıyı ID ile bulacak
export const getPostById = async (id: string): Promise<Post> => {
  const response = await api.get<Post>(`/posts/${id}`);
  return response.data;
};

export const createPost = async (data: CreatePostInput): Promise<Post> => {
  const response = await api.post<Post>('/posts', data);
  return response.data;
};

// DEĞİŞTİ: Artık id alıyor
export const updatePost = async (id: string, data: UpdatePostInput): Promise<Post> => {
  const response = await api.patch<Post>(`/posts/${id}`, data);
  return response.data;
};

// DEĞİŞTİ: Tek bir delete fonksiyonu, sadece id alıyor
export const deletePost = async (id: string): Promise<void> => {
  await api.delete(`/posts/${id}`);
};

// AYNI KALDI: Zaten ID alıyordu
export const updatePostStatus = async (id: string, status: 'PUBLISHED' | 'DRAFT') => {
  const response = await api.patch(`/posts/${id}/status`, { status });
  return response.data;
};
// Yazıyı kaydet / kayıtlardan çıkar
export const toggleBookmark = async (postId: string) => {
  const response = await api.post(`/posts/${postId}/bookmark`);
  return response.data; // { bookmarked: true/false } dönecek
};
export const getMyBookmarks = async (token?: string) => {
  // Eğer sunucu tarafında (SSR) token gönderilmezse, client tarafındaki axios interceptor'ı halleder.
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const response = await api.get('/posts/my-bookmarks', config);
  return response.data;
};
export const getMyLikes = async (token?: string) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const response = await api.get('/posts/my-likes', config);
  return response.data;
};
