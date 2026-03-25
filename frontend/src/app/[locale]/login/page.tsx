'use client';

import React, { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Eye, EyeOff, Bot } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { locales } from '@/i18n/navigation';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isLoading } = useAuthStore();
  const router = useRouter();
  const locale = useLocale();

  // Helper to strip locale prefix from path
  const stripLocalePrefix = (path: string): string => {
    for (const loc of locales) {
      if (path.startsWith(`/${loc}/`)) {
        return path.slice(loc.length + 1);
      }
      if (path === `/${loc}`) {
        return '/';
      }
    }
    return path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await login(identifier, password);
    
    if (result.success) {
      // Get the intended destination from URL params or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      let redirectTo = urlParams.get('redirect') || localStorage.getItem('redirect_after_login') || '/dashboard';
      
      // Strip locale prefix if present (since router.push will add it)
      redirectTo = stripLocalePrefix(redirectTo);
      
      // Clear the stored redirect path
      localStorage.removeItem('redirect_after_login');
      
      // Navigate to the intended page
      router.push(redirectTo);
    } else {
      setError(result.error || 'Login failed');
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Bot className="h-12 w-12 text-primary-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Welcome to My Agents - Your AI Assistant Platform
        </p>      
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-neutral-900 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email or Username
              </label>
              <div className="mt-1">
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter your email or username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-neutral-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-neutral-900 text-gray-500 dark:text-gray-400">
                  Don&apos;t have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`/${locale}/signup`}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 