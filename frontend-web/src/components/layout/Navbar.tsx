'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 🚨 SİHİRLİ DOKUNUŞ: Göreceli yol yerine Kesin Yol (@/) kullanıyoruz
import MegaMenu from '@/components/Menu/MegaMenu';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-md border-b border-slate-200 sticky top-0 z-40 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-8 h-12">
          
          <Link href="/" className={`text-sm font-bold transition-colors h-full flex items-center ${pathname === '/' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}>
            Ana Sayfa
          </Link>
          
          <Link href="/categories" className={`text-sm font-bold transition-colors h-full flex items-center ${pathname === '/categories' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}>
            Kategoriler
          </Link>

          <MegaMenu />
          
        </div>
      </div>
    </nav>
  );
}