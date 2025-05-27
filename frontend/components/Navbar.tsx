'use client';

import { useState, useEffect } from 'react';
import { authService, User } from '@/utils/auth';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        authService.logout();
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.push('/');
  };

  const formatStorageUsed = (bytes: number, limit: number) => {
    const formatBytes = (bytes: number) => {
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let size = bytes;
      let unitIndex = 0;

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }

      return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    return `${formatBytes(bytes)} / ${formatBytes(limit)}`;
  };

  if (isLoading) {
    return (
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between h-12">
            <div className="flex items-center">
              <span className="text-lg font-light text-gray-900">TensorBin</span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-12">
          <div className="flex items-center space-x-8">
            <a href="/" className="text-lg font-light text-gray-900 hover:text-gray-700">
              TensorBin
            </a>
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <a href="/browse" className="text-gray-600 hover:text-gray-900">Browse</a>
              <a href="/search" className="text-gray-600 hover:text-gray-900">Search</a>
            </div>
          </div>

          {user ? (
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center text-xs text-gray-500">
                <span>{formatStorageUsed(user.storage_used, user.storage_limit)}</span>
              </div>

              <a
                href="/dashboard"
                className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
              >
                Upload
              </a>

              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {user.email.split('@')[0]}
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-sm z-10">
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatStorageUsed(user.storage_used, user.storage_limit)}
                      </p>
                    </div>
                    <div className="p-2">
                      <a
                        href="/dashboard"
                        className="block px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
                      >
                        My uploads
                      </a>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4 text-sm">
              <a
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900"
              >
                Sign in
              </a>
              <a
                href="/auth/register"
                className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Upload
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}