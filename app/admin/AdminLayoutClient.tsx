'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { Menu, X, FileText, BarChart3, Users, MessageSquare, TestTube, ScrollText, LogOut, Activity, CheckCircle, Beaker } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: User | null;
}

export default function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createSupabaseBrowserClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  // Phase 1 Pivot: Removed Conversion Metrics (payment-focused)
  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/test-pdf', label: 'Test PDFs', icon: TestTube },
    { href: '/admin/assessments', label: 'Assessments', icon: FileText },
    { href: '/admin/communications', label: 'Communications', icon: MessageSquare },
    { href: '/admin/checkins', label: 'Check-Ins', icon: CheckCircle },
    { href: '/admin/logs', label: 'Logs & Monitoring', icon: ScrollText },
    { href: '/admin/analytics', label: 'Analytics', icon: Activity },
  ];

  // Login page - no navigation
  if (pathname === '/admin/login') {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // Authenticated pages - show navigation
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center gap-3">
                <Image
                  src="/branding/painoptix_logo_bg_removed.png"
                  alt="PainOptix"
                  width={32}
                  height={32}
                  className="hidden sm:block"
                />
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900">
                    PainOptix <span className="text-gray-400 font-normal">Admin</span>
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                    <Beaker className="h-3 w-3" />
                    Clinical Pilot
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="hidden sm:block text-sm text-gray-600">{user?.email}</span>
              <span className="sr-only" data-build={process.env.NEXT_PUBLIC_BUILD_STAMP} />
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <nav className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-gray-200">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Image
                src="/branding/painoptix_logo_bg_removed.png"
                alt="PainOptix"
                width={28}
                height={28}
              />
              <span className="text-sm font-medium text-gray-700">Admin Portal</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 transition-colors ${
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="text-xs text-gray-400">
              PainOptix V1.2 • Phase 1 Pilot
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
              {/* Mobile Menu Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image
                    src="/branding/painoptix_logo_bg_removed.png"
                    alt="PainOptix"
                    width={28}
                    height={28}
                  />
                  <span className="text-sm font-medium text-gray-700">Admin Portal</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 h-0 pt-2 pb-4 overflow-y-auto">
                <nav className="px-3 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex items-center px-3 py-3 text-base font-medium rounded-lg ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon
                          className={`mr-4 h-6 w-6 ${
                            isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'
                          }`}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Menu Footer */}
              <div className="p-4 border-t border-gray-100">
                <div className="text-xs text-gray-400">
                  PainOptix V1.2 • Phase 1 Pilot
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}