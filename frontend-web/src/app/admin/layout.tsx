'use client';

import '../styles/globals.css';
import { useAuthStore } from '@/store/useAuthStore';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, FileText, Tag, MessageSquare, LogOut, Menu, 
  Loader2, Users, ChevronDown, User as UserIcon, Globe 
} from 'lucide-react';
import Link from 'next/link';


// 1. EKSİK OLAN USERS MENÜSÜ EKLENDİ
const adminLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Posts', href: '/admin/posts', icon: FileText },
  { name: 'Categories', href: '/admin/categories', icon: Tag },
  { name: 'Comments', href: '/admin/comments', icon: MessageSquare },
  { name: 'Users', href: '/admin/users', icon: Users }, 
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // 2. SAĞ ÜST PROFİL MENÜSÜ İÇİN STATE EKLENDİ
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (!user) {
      router.push('/login');
    } else if (user.role !== 'ADMIN' && user.role !== 'USER') {
      router.push('/');
    }
  }, [user, isMounted, router]);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
    router.refresh();
  };

  if (!isMounted || !user || (user.role !== 'ADMIN' && user.role !== 'USER')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <span className="text-xl font-bold">AdminPanel</span>
          </div>

<nav className="flex-1 px-4 py-6 space-y-2">
            {/* 🚨 YENİ EKLENEN: SİTEYE GİT (VİTRİN) BUTONU */}
            <Link
              href="/"
              className="flex items-center space-x-3 px-4 py-3 mb-6 rounded-lg text-emerald-400 border border-emerald-900/50 hover:text-white hover:bg-emerald-600 transition-all bg-emerald-950/30"
              onClick={() => setIsSidebarOpen(false)}
            >
              <Globe className="h-5 w-5" />
              <span className="font-medium">Siteye Git</span>
            </Link>

            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="px-4 pb-6 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="ml-3 text-lg font-semibold text-slate-900 hidden lg:block">
              {adminLinks.find((link) => link.href === pathname)?.name || 'Dashboard'}
            </h1>
          </div>

          {/* User Info & Tıklanabilir Profil Menüsü */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-4 focus:outline-none hover:bg-slate-50 p-2 rounded-lg transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profil Dropdown Modal */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                <Link 
                  href="/admin/profile" 
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Profilimi Düzenle
                </Link>
                <div className="h-px bg-slate-100 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}