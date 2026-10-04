import Link from 'next/link';
import { Folder, ArrowRight, LayoutGrid } from 'lucide-react';
// BURASI ÖNEMLİ: Kendi servis dosyanın yolunu buraya ekle (eğer farklıysa yolu düzelt)
import { getCategories } from '@/services/category.service'; 

export default async function CategoriesPage() {
  let categories: any[] = [];

  try {
  const res = await getCategories();
  // Eğer res bir objeyse içindeki diziyi alıyoruz:
  categories = res.categories || res; 
} catch (error) {
  console.error("Kategoriler çekilirken API hatası:", error);
}
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Sayfa Başlığı */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Explore Categories</h1>
          <p className="text-lg text-slate-600">
            Browse our wide range of topics and find exactly what you're looking for.
          </p>
        </div>

        {/* 2. ADIM: Veritabanı boşsa (Henüz kategori eklenmediyse) gösterilecek ekran */}
        {categories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <LayoutGrid className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No categories found</h3>
            <p className="mt-2 text-slate-500">Categories will appear here once they are added to the database.</p>
          </div>
        ) : (
          /* 3. ADIM: Veritabanından gelen kategorileri dinamik olarak listele */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link 
                key={category.id} 
                href={`/categories/${category.slug}`}
                className="group block bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-200">
                    <Folder className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors duration-200" />
                  </div>
                  {/* Post sayısı backend'den geliyorsa göster, yoksa gizle */}
                  {category._count?.posts !== undefined && (
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                      {category._count.posts} Posts
                    </span>
                  )}
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors duration-200">
                  {category.name}
                </h2>
                <p className="text-slate-500 mb-4 line-clamp-2">
                  {category.description || 'No description available.'}
                </p>
                
                <div className="flex items-center text-sm font-medium text-indigo-600">
                  <span>View Articles</span>
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}