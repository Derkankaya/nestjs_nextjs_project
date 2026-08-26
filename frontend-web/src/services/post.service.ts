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
}

export interface PostResponse {
  posts: Post[];
  total: number;
}

export interface CreatePostInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  coverImage?: string;
  status?: 'PUBLISHED' | 'DRAFT';
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

// Fetch all posts with optional pagination
export const getPosts = async (limit: number = 10, offset: number = 0): Promise<PostResponse> => {
  const response = await api.get<PostResponse>('/posts', {
    params: { limit, offset },
  });
  return response.data;
};

// Fetch a single post by slug
export const getPostBySlug = async (slug: string): Promise<Post> => {
  const response = await api.get<Post>(`/posts/${slug}`);
  return response.data;
};

// Fetch posts by category
export const getPostsByCategory = async (slug: string, limit: number = 10, offset: number = 0): Promise<PostResponse> => {
  const response = await api.get<PostResponse>('/posts/category', {
    params: { slug, limit, offset },
  });
  return response.data;
};

// Fetch posts by tag
export const getPostsByTag = async (slug: string, limit: number = 10, offset: number = 0): Promise<PostResponse> => {
  const response = await api.get<PostResponse>('/posts/tag', {
    params: { slug, limit, offset },
  });
  return response.data;
};

// Admin: Create a new post
export const createPost = async (data: CreatePostInput): Promise<Post> => {
  const response = await api.post<Post>('/posts', data);
  return response.data;
};

// Admin: Update an existing post
export const updatePost = async (
  slug: string,
  data: UpdatePostInput
): Promise<Post> => {
  const response = await api.patch<Post>(`/posts/${slug}`, data);
  return response.data;
};

// Admin: Delete a post
export const deletePost = async (slug: string): Promise<void> => {
  await api.delete(`/posts/${slug}`);
};
