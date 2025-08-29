'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';
import { Sidebar } from '@/components/layout/sidebar/sidebar';
import { WorkspaceProvider } from '@/providers/workspace-provider';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user, initializeAuth } = useAuthStore();
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspaceStore();
  const router = useRouter();
  const locale = useLocale();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (!isAuthenticated) {
        await initializeAuth();
      }
      setIsInitializing(false);
    };

    initAuth();
  }, [isAuthenticated, initializeAuth]);

  useEffect(() => {
    // Redirect to login if not authenticated after initialization
    if (!isInitializing && !isAuthenticated) {
      // Store current path for redirect after login
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirect_after_login', window.location.pathname);
      }
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isInitializing, router, locale]);

  // Show loading while initializing or checking authentication
  if (isInitializing || !isAuthenticated || !user || workspaceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {isInitializing ? 'Initializing...' : 'Loading workspace...'}
          </p>
        </div>
      </div>
    );
  }

  // Show main application layout if authenticated
  return (
    <WorkspaceProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Page content */}
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
    </WorkspaceProvider>
  );
} 