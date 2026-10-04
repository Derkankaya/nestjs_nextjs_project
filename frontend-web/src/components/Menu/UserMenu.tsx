'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, Mail, FileText, BarChart2, Shield, LogOut } from 'lucide-react';
import NotificationBell from '@/components/ui/NotificationBell';

export default function UserMenu({ user, handleLogout }: { user: any, handleLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="flex items-center space-x-4 border-l pl-6 border-slate-200">
      <NotificationBell userId={user.id} />
      <div className="relative" ref={dropdownRef}>
        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full transition-colors">
          <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
            {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
          </div>
          <span className="text-sm font-medium text-slate-700">{user.name.split(' ')[0]}</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
            <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 rounded-t-xl mb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hesabım</p>
              <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <div className="py-1">
              <Link href={`/author/${user.username}`} onClick={() => setIsOpen(false)} className="flex items-center px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700">
                <User className="h-4 w-4 mr-3 text-slate-400" /> Vitrinim
              </Link>
              
              <Link href="/profile/edit" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700">
                <Settings className="h-4 w-4 mr-3 text-slate-400" /> Ayarlar
              </Link>
              <Link href="/profile/messages" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700">
                <Mail className="h-4 w-4 mr-3 text-slate-400" /> Mesajlar
              </Link>
            </div>
            {isAdmin && (
              <div className="border-t border-slate-100 py-1">
                <Link href="/admin" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-2.5 text-sm text-indigo-700 hover:bg-indigo-50 font-semibold bg-indigo-50/50"><Shield className="h-4 w-4 mr-3 text-indigo-600" /> Admin Panel</Link>
              </div>
            )}
            <div className="border-t border-slate-100 mt-1 pt-1">
              <button onClick={handleLogout} className="flex items-center space-x-2 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 text-left"><LogOut className="h-4 w-4" /> <span>Çıkış Yap</span></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}