import api from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
}

// Fetch all categories
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<Category[]>('/categories');
  return response.data;
};

// Fetch a single category by slug
export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  const response = await api.get<Category>(`/categories/${slug}`);
  return response.data;
};

// Create a new category
export const createCategory = async (data: CreateCategoryInput): Promise<Category> => {
  const response = await api.post<Category>('/categories', data);
  return response.data;
};

// Update an existing category
export const updateCategory = async (
  slug: string,
  data: UpdateCategoryInput
): Promise<Category> => {
  const response = await api.patch<Category>(`/categories/${slug}`, data);
  return response.data;
};

// Delete a category
export const deleteCategory = async (slug: string): Promise<void> => {
  await api.delete(`/categories/${slug}`);
};
