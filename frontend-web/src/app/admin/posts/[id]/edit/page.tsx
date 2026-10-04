'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPostById, updatePost, deletePost, updatePostStatus } from '@/services/post.service';
import { Loader2, AlertCircle, Save, X } from 'lucide-react';
import { getCategories } from '@/services/category.service';


interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  status: 'PUBLISHED' | 'DRAFT';
  createdAt: string;
}

export default function AdminPostEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    categoryId: '',
    coverImage: '',
    status: 'DRAFT',
  });

  // Fetch categories and post data on mount using ID
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesData, postData] = await Promise.all([
          getCategories(),
          getPostById(id), // 👈 Artık ID ile çekiyoruz (Slug çakışması bitti!)
        ]);
        setCategories(categoriesData.categories || categoriesData);
        setPost(postData as any);

        // Pre-fill form with post data
        setFormData({
          title: postData.title,
          slug: postData.slug,
          excerpt: postData.excerpt,
          content: postData.content,
          categoryId: (postData.category as any)?.id,
          coverImage: postData.coverImage || '',
          status: postData.status,
        });
        setError('');
      } catch (err: any) {
        setError('Failed to load post data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // 👈 Güncelleme artık SLUG yerine doğrudan post.id üzerinden atılıyor!
      await updatePost(id, {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        categoryId: formData.categoryId,
        coverImage: formData.coverImage || undefined,
        status: formData.status as 'PUBLISHED' | 'DRAFT',
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/posts');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-slate-600">Loading post...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-slate-300" />
        <span className="ml-3 text-slate-600">Post not found</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Post</h1>
          <p className="text-slate-600 mt-1">Update your blog post</p>
        </div>
        <button
          onClick={() => router.push('/admin/posts')}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center space-x-2 mb-6">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center space-x-2 mb-6">
          <span className="font-medium">Post updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter post title"
          />
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            value={formData.slug}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="enter-post-slug"
          />
          <p className="text-xs text-slate-500 mt-1">URL-friendly version of the title</p>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            value={formData.categoryId}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Excerpt */}
        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-slate-700 mb-1">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={2}
            value={formData.excerpt}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Short summary of the post..."
          />
        </div>

        {/* Cover Image */}
        <div>
          <label htmlFor="coverImage" className="block text-sm font-medium text-slate-700 mb-1">
            Cover Image URL
          </label>
          <input
            id="coverImage"
            name="coverImage"
            type="text"
            value={formData.coverImage}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={10}
            value={formData.content}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
            placeholder="Write your post content here..."
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="status"
                value="DRAFT"
                checked={formData.status === 'DRAFT'}
                onChange={handleChange}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">Draft</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="status"
                value="PUBLISHED"
                checked={formData.status === 'PUBLISHED'}
                onChange={handleChange}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">Published</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center space-x-3 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Update Post</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/posts')}
            className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}