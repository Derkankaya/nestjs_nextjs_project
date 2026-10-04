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
  slug?: string; // İsterse slug da güncellenebilsin diye ekledik
  description?: string;
}
export interface CategoryResponse {
  categories: Category[];
  total: number;
}
// -------------------------------------------------------------
// 🟢 PUBLIC İŞLEMLER (SEO ve Ziyaretçi için URL'de SLUG Kullanır)
// -------------------------------------------------------------

export const getCategories = async (): Promise<CategoryResponse> => {
  const response = await api.get<CategoryResponse>('/categories');
  return response.data;
};
// Ziyaretçi veya frontend okuması için slug üzerinden kategori bulma
export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  const response = await api.get<Category>(`/categories/slug/${slug}`); // Backend'deki @Get('slug/:slug') ile eşleşti
  return response.data;
};


// -------------------------------------------------------------
// 🔴 ADMİN İŞLEMLERİ (Veri Bütünlüğü İçin Tamamı ID Kullanır)
// -------------------------------------------------------------

export const createCategory = async (data: CreateCategoryInput): Promise<Category> => {
  const response = await api.post<Category>('/categories', data);
  return response.data;
};

// DEĞİŞTİ: Artık slug yerine id alıyor
export const updateCategory = async (
  id: string,
  data: UpdateCategoryInput
): Promise<Category> => {
  const response = await api.patch<Category>(`/categories/${id}`, data);
  return response.data;
};

// DEĞİŞTİ: Artık slug yerine id alıyor
export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`/categories/${id}`);
};