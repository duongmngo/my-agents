'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';
import { Sidebar } from '@/components/layout/sidebar/sidebar';
import { WorkspaceProvider } from '@/providers/workspace-provider';
import { WebSocketProvider } from '@/providers/websocket-provider';
import { ToastProvider } from '@/components/common/toast';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user, initializeAuth } = useAuthStore();
  const { 
    currentWorkspace, 
    isLoading: workspaceLoading, 
    loadUserWorkspaces,
    userWorkspaces 
  } = useWorkspaceStore();
  const router = useRouter();
  const locale = useLocale();
  const [isInitializing, setIsInitializing] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasLoadedWorkspaces, setHasLoadedWorkspaces] = useState(false);

  // Step 1: Initialize authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
          if (!isAuthenticated) {
            await initializeAuth();
          }
      } catch (error) {
        console.error('Authentication initialization failed:', error);
        setAuthError('Authentication failed');
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [isAuthenticated, initializeAuth]);

  // Step 2: Load workspaces after authentication (only once)
  useEffect(() => {    
    const shouldLoadWorkspaces = !isInitializing && 
      isAuthenticated && 
      user && 
      !hasLoadedWorkspaces;

    console.log('debug:', {
      isInitializing,
      isAuthenticated,
      user: !!user,
      hasLoadedWorkspaces
    });

    if (shouldLoadWorkspaces) {      
      console.log('Loading workspaces');
      setHasLoadedWorkspaces(true);
      loadUserWorkspaces().catch(error => {        
        console.error('Failed to load workspaces:', error);
        setHasLoadedWorkspaces(false); // Reset on error so we can retry
      });
    }
  }, [isInitializing, isAuthenticated, user, hasLoadedWorkspaces]);

  // Step 3: Redirect to login if not authenticated
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      // Store current path for redirect after login
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirect_after_login', window.location.pathname);
      }
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isInitializing, router, locale]);

  // Show loading while initializing authentication
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Initializing authentication...
          </p>
        </div>
      </div>
    );
  }

  // Show error if authentication failed
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{authError}</p>
          <button 
            onClick={() => router.push(`/${locale}/login`)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show loading while loading workspaces or if no current workspace
  if (workspaceLoading || (isAuthenticated && user && userWorkspaces.length > 0 && !currentWorkspace)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {workspaceLoading ? 'Loading workspaces...' : 'Selecting workspace...'}
          </p>
        </div>
      </div>
    );
  }

  // Show main application layout if authenticated and workspace is ready
  return (
    <ToastProvider>
      <WorkspaceProvider>
        <WebSocketProvider>
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
        </WebSocketProvider>
      </WorkspaceProvider>
    </ToastProvider>
  );
} 