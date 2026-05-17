"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AUTH_USER_CHANGED_EVENT, getAuthUser } from '@/lib/authSession';
import type { AuthUser } from '@/lib/api';

export default function Navbar() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  

  useEffect(() => {
    const syncAuthUser = () => {
      setAuthUser(getAuthUser());
    };

    syncAuthUser();
    window.addEventListener('storage', syncAuthUser);
    window.addEventListener(AUTH_USER_CHANGED_EVENT, syncAuthUser);

    return () => {
      window.removeEventListener('storage', syncAuthUser);
      window.removeEventListener(AUTH_USER_CHANGED_EVENT, syncAuthUser);
    };
  }, []);

  const displayName = authUser?.fullName?.trim() || authUser?.email || 'profile';

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [authUser?.avatarUrl]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onEscape);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b-2 border-gray-900/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo with dev theme */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-9 h-9 bg-black group-hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 shadow-md group-hover:shadow-blue-500/50">
                <span className="text-white font-bold text-lg font-mono">S</span>
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold font-mono text-gray-900 group-hover:text-blue-600 transition-colors">Swiftly</span>
              {/* <span className="text-xl font-bold text-gray-900">ly</span> */}
              <span className="hidden sm:inline text-xs font-mono text-gray-400 ml-1">.nakshjoshi.in</span>
            </div>
          </Link>

          {/* Navigation links with code style */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/#how-it-works" className="px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-mono text-sm relative group">
              <span className="relative z-10">howItWorks()</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></div>
            </Link>
            <Link href="/#features" className="px-4 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors font-mono text-sm relative group">
              <span className="relative z-10">features()</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300"></div>
            </Link>
            <Link href="/#benefits" className="px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-mono text-sm relative group">
              <span className="relative z-10">benefits()</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300"></div>
            </Link>
            {authUser ? (
              <Link href="/dashboard" className="px-4 py-2 text-orange-700 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors font-mono text-sm relative group border border-orange-200">
                <span className="relative z-10">dashboard()</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300"></div>
              </Link>
            ) : null}
            {authUser ? (
              <Link href="/migrate-resume" className="px-4 py-2 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors font-mono text-sm relative group border border-indigo-200">
                <span className="relative z-10">migrateResume()</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-300"></div>
              </Link>
            ) : null}
          </div>

          {/* Action buttons with dev style */}
          <div className="hidden md:flex items-center gap-3">
            {authUser ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-700 transition-colors border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 max-w-55"
              >
                {authUser.avatarUrl && !avatarLoadFailed ? (
                  <img
                    src={authUser.avatarUrl}
                    alt={displayName}
                    className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarLoadFailed(true)}
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-gray-900 text-white font-mono text-xs inline-flex items-center justify-center">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="font-mono text-sm truncate">{displayName}</span>
              </Link>
            ) : (
              <>
                <Link 
                  href="/signin" 
                  className="hidden sm:inline-flex px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors font-mono text-sm border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50"
                >
                  <span className="mr-1 text-blue-600">{'<'}</span>
                  signIn
                  <span className="ml-1 text-blue-600">{'/>'}</span>
                </Link>
                <Link 
                  href="/signup" 
                  className="px-5 py-2 bg-black text-white rounded-lg hover:bg-blue-600 transition-all font-mono text-sm shadow-md hover:shadow-blue-500/50 border-2 border-black hover:border-blue-600 group"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-green-400">$</span>
                    <span>start</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </span>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-gray-900 hover:border-blue-500 hover:text-blue-600 transition-colors"
            aria-label={isMobileMenuOpen ? 'close menu' : 'open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <>
          <button
            type="button"
            className="md:hidden fixed inset-0 top-16 bg-gray-900/20 backdrop-blur-[1px]"
            onClick={closeMobileMenu}
            aria-label="close mobile menu backdrop"
          />
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-lg shadow-xl">
            <div className="max-w-7xl mx-auto px-6 py-4 space-y-3">
              <Link onClick={closeMobileMenu} href="/#how-it-works" className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-mono text-sm">
                howItWorks()
              </Link>
              <Link onClick={closeMobileMenu} href="/#features" className="block px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors font-mono text-sm">
                features()
              </Link>
              <Link onClick={closeMobileMenu} href="/#benefits" className="block px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-mono text-sm">
                benefits()
              </Link>

              {authUser ? (
                <>
                  <Link onClick={closeMobileMenu} href="/dashboard" className="block px-4 py-3 text-orange-700 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors font-mono text-sm border border-orange-200">
                    dashboard()
                  </Link>
                  <Link onClick={closeMobileMenu} href="/migrate-resume" className="block px-4 py-3 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors font-mono text-sm border border-indigo-200">
                    migrateResume()
                  </Link>
                  <Link
                    onClick={closeMobileMenu}
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:text-blue-700 transition-colors border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50"
                  >
                    {authUser.avatarUrl && !avatarLoadFailed ? (
                      <img
                        src={authUser.avatarUrl}
                        alt={displayName}
                        className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarLoadFailed(true)}
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-gray-900 text-white font-mono text-xs inline-flex items-center justify-center">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="font-mono text-sm truncate">{displayName}</span>
                  </Link>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Link
                    onClick={closeMobileMenu}
                    href="/signin"
                    className="px-4 py-3 text-center text-gray-700 hover:text-blue-600 transition-colors font-mono text-sm border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50"
                  >
                    signIn
                  </Link>
                  <Link
                    onClick={closeMobileMenu}
                    href="/signup"
                    className="px-4 py-3 text-center bg-black text-white rounded-lg hover:bg-blue-600 transition-all font-mono text-sm border-2 border-black hover:border-blue-600"
                  >
                    start
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
      
      {/* Code-like decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-500/20 to-transparent"></div>
    </nav>
  );
}
