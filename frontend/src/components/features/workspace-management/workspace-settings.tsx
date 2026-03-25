'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { Button } from '@/components/common/button';
import { Badge } from '@/components/common/badge/badge';
import { LoadingSpinner } from '@/components/common/loading';
import { TeamSettings } from '@/components/features/settings/team-settings';
import { 
  Settings, 
  Edit, 
  Trash2, 
  Save,
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Workspace, WorkspaceMember } from '@/types/common-types';

interface WorkspaceSettingsProps {
  workspaceId: string;
}

export const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({ workspaceId }) => {
  const t = useTranslations();
  const router = useRouter();
  const { 
    currentWorkspace,
    loadWorkspaceMembers, 
    updateWorkspace, 
    deleteWorkspace,
    hasPermission
  } = useWorkspaceStore();
  
  const { user } = useAuthStore();
  
  // State for data loading
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State for UI
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form states
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');

  // Load workspace data
  useEffect(() => {
    const loadWorkspaceData = async () => {
      if (!workspaceId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Load workspace members
        await loadWorkspaceMembers(workspaceId);
        
        // Set form values
        if (currentWorkspace) {
          setWorkspaceName(currentWorkspace.name);
          setWorkspaceDescription(currentWorkspace.description || '');
        }
        
      } catch (err) {
        console.error('Error loading workspace data:', err);
        // Only set error if it's not a loading issue
        if (!currentWorkspace) {
          setError('Failed to load workspace data. Please try refreshing the page.');
        } else {
          setError('Failed to load workspace members. Some features may be limited.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWorkspaceData();
  }, [workspaceId, loadWorkspaceMembers]); // Removed currentWorkspace dependency to prevent circular issues

  // Check permissions
  const canManageWorkspace = hasPermission('canManageSettings');
  const canDeleteWorkspace = hasPermission('canManageSettings');

  // Show loading state while checking permissions or if workspace is not loaded
  if (isLoading || !currentWorkspace) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading workspace settings..." />
      </div>
    );
  }

  // Show error state if there was an error loading data
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-neutral-400 dark:text-neutral-500 mb-4">
          <AlertCircle className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          Error Loading Workspace
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          {error}
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="primary"
          size="sm"
        >
          Refresh Page
        </Button>
      </div>
    );
  }

  if (!canManageWorkspace) {
    return (
      <div className="text-center py-12">
        <div className="text-neutral-400 dark:text-neutral-500 mb-4">
          <Settings className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          Access Restricted
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          You don't have permission to access workspace settings.
        </p>
      </div>
    );
  }

  const handleSaveWorkspace = async () => {
    try {
      setError(null);
      const result = await updateWorkspace(workspaceId, {
        name: workspaceName,
        description: workspaceDescription
      });
      
      if (result.success) {
        setSuccess('Workspace updated successfully');
        setIsEditing(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to update workspace');
      }
    } catch (err) {
      setError('Failed to update workspace');
    }
  };

  const handleDeleteWorkspace = async () => {
    try {
      setError(null);
      const result = await deleteWorkspace(workspaceId);
      
      if (result.success) {
        setShowDeleteConfirm(false);
        setIsDeleting(false);
        // Navigate to dashboard after successful deletion
        router.push('/dashboard');
      } else {
        setError(result.error || 'Failed to delete workspace');
      }
    } catch (err) {
      setError('Failed to delete workspace');
    }
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-success-500 dark:text-success-400" />
          <span className="text-success-700 dark:text-success-300">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-error-500 dark:text-error-400" />
          <span className="text-error-700 dark:text-error-300">{error}</span>
        </div>
      )}

      {/* Workspace Information */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-neutral-500" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t('settings.workspace.title')}
            </h2>
          </div>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('settings.workspace.name')}
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('settings.workspace.description')}
              </label>
              <textarea
                value={workspaceDescription}
                onChange={(e) => setWorkspaceDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleSaveWorkspace}>
                <Save className="h-4 w-4 mr-2" />
                {t('common.save')}
              </Button>
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                setWorkspaceName(currentWorkspace.name);
                setWorkspaceDescription(currentWorkspace.description || '');
              }}>
                <X className="h-4 w-4 mr-2" />
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {currentWorkspace.name}
              </h3>
              {currentWorkspace.description && (
                <p className="text-neutral-600 dark:text-neutral-400">
                  {currentWorkspace.description}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">workspace</Badge>
              <Badge variant="success">{t('settings.workspace.active')}</Badge>
            </div>
          </div>
        )}
      </div>

      {/* Team Members Section */}
      {user && currentWorkspace && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <TeamSettings
            workspaceId={workspaceId}
            currentUserId={user.id}
            currentUserRole={currentWorkspace.userRole as 'owner' | 'admin' | 'member' | 'viewer'}
          />
        </div>
      )}

      {/* Danger Zone */}
      {canDeleteWorkspace && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
              {t('settings.workspace.dangerZone')}
            </h2>
          </div>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {t('settings.workspace.deleteWarning')}
          </p>
          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? t('common.deleting') : t('settings.workspace.deleteWorkspace')}
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {t('settings.workspace.confirmDelete')}
              </h3>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {t('settings.workspace.deleteConfirmation')}
            </p>
            <div className="flex space-x-3">
              <Button
                variant="danger"
                onClick={handleDeleteWorkspace}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? t('common.deleting') : t('common.delete')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
