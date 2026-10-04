'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Search, Menu, X, User } from 'lucide-react';
import { useState } from 'react';

// 🚨 SİHİRLİ DOKUNUŞ: Göreceli yol (./) yerine Kesin Yol (@/) kullanıyoruz
import UserMenu from '@/components/Menu/UserMenu';
import MobileMenu from '@/components/Menu/MobileMenu';

export default function Header() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/?search=${encodeURIComponent(searchQuery)}`);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/';
  };

  return (
    <header className="bg-white border-b border-slate-100 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-2xl font-extrabold text-indigo-600 tracking-tight">Blog<span className="text-slate-900">App</span></span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex relative flex-1 max-w-2xl mx-8">
            <input
              type="text"
              placeholder="Yazılarda, kategorilerde veya etiketlerde ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-full focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm"
            />
            <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
              <Search className="h-5 w-5" />
            </button>
          </form>

          <div className="hidden md:flex items-center">
            {user ? (
              <UserMenu user={user} handleLogout={handleLogout} />
            ) : (
              <Link href="/login" className="flex items-center space-x-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-full shadow-sm transition-all">
                <User className="h-4 w-4" /> <span>Giriş Yap</span>
              </Link>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 hover:text-slate-900 p-2 bg-slate-50 rounded-lg">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <MobileMenu 
        isOpen={isMenuOpen} 
        setIsOpen={setIsMenuOpen} 
        user={user} 
        handleLogout={handleLogout} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        handleSearch={handleSearch} 
      />
    </header>
  );
}