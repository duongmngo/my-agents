'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Edit, 
  Trash2, 
  Plus, 
  Crown, 
  User, 
  Eye,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { Button } from '@/components/common/button';
import { Badge } from '@/components/common/badge/badge';
import { Workspace, WorkspaceMember } from '@/types/common-types';

interface WorkspaceSettingsProps {
  workspace: Workspace;
}

export const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({ workspace }) => {
  const { 
    workspaceMembers, 
    loadWorkspaceMembers, 
    updateWorkspace, 
    deleteWorkspace,
    addMember,
    updateMemberRole,
    removeMember,
    hasPermission
  } = useWorkspaceStore();
  
  const { user } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form states
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [workspaceDescription, setWorkspaceDescription] = useState(workspace.description || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaceMembers(workspace.id);
  }, [workspace.id, loadWorkspaceMembers]);

  useEffect(() => {
    setWorkspaceName(workspace.name);
    setWorkspaceDescription(workspace.description || '');
  }, [workspace]);

  const handleSaveWorkspace = async () => {
    try {
      setError(null);
      const result = await updateWorkspace(workspace.id, {
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
      const result = await deleteWorkspace(workspace.id);
      
      if (result.success) {
        setSuccess('Workspace deleted successfully');
        setShowDeleteConfirm(false);
        setIsDeleting(false);
      } else {
        setError(result.error || 'Failed to delete workspace');
      }
    } catch (err) {
      setError('Failed to delete workspace');
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      setError('Please enter an email address');
      return;
    }
    
    try {
      setError(null);
      // Note: This would need to be updated to use actual user ID lookup
      // For now, we'll use a placeholder - in a real app, you'd look up the user by email
      const userId = `user-${Date.now()}`; // This should come from user lookup
      const result = await addMember(userId, inviteRole);
      
      if (result.success) {
        setSuccess('Member added successfully');
        setInviteEmail('');
        setInviteRole('member');
        setIsInviting(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to add member');
      }
    } catch (err) {
      setError('Failed to add member');
    }
  };

  const handleUpdateMemberRole = async (userId: string, role: 'admin' | 'member' | 'viewer') => {
    try {
      setError(null);
      const result = await updateMemberRole(userId, role);
      
      if (result.success) {
        setSuccess('Member role updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to update member role');
      }
    } catch (err) {
      setError('Failed to update member role');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      setError(null);
      const result = await removeMember(userId);
      
      if (result.success) {
        setSuccess('Member removed successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to remove member');
      }
    } catch (err) {
      setError('Failed to remove member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'member':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="warning" size="sm">Admin</Badge>;
      case 'member':
        return <Badge variant="primary" size="sm">Member</Badge>;
      case 'viewer':
        return <Badge variant="secondary" size="sm">Viewer</Badge>;
      default:
        return null;
    }
  };

  const canManageWorkspace = hasPermission('canManageSettings');
  const canInviteMembers = hasPermission('canInviteMembers');

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
          <span className="text-success-700 dark:text-success-300">{success}</span>
        </div>
      )}
      
      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
          <span className="text-error-700 dark:text-error-300">{error}</span>
        </div>
      )}

      {/* Workspace Details */}
      <div className="bg-white dark:bg-neutral-900 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Workspace Details</h2>
          </div>
          {canManageWorkspace && !isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Workspace Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-900 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Description
              </label>
              <textarea
                value={workspaceDescription}
                onChange={(e) => setWorkspaceDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-900 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button onClick={handleSaveWorkspace}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Name</span>
              <p className="text-neutral-900 dark:text-neutral-100">{workspace.name}</p>
            </div>
            
            {workspace.description && (
              <div>
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Description</span>
                <p className="text-neutral-900 dark:text-neutral-100">{workspace.description}</p>
              </div>
            )}
            
            <div>
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Created</span>
              <p className="text-neutral-900 dark:text-neutral-100">
                {new Date(workspace.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            {workspace.isDefault && (
              <div className="flex items-center space-x-2">
                <Badge variant="success" size="sm">Default Workspace</Badge>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Workspace Members */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Members</h2>
            <Badge variant="secondary" size="sm">{workspaceMembers.length}</Badge>
          </div>
          {canInviteMembers && (
            <Button variant="outline" size="sm" onClick={() => setIsInviting(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          )}
        </div>

        {/* Invite Member Form */}
        {isInviting && (
          <div className="mb-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">Invite New Member</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button onClick={handleInviteMember}>
                  <Plus className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
                <Button variant="outline" onClick={() => setIsInviting(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-3">
          {workspaceMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getRoleIcon(member.role)}
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {member.userId === 'user-1' ? 'You' : `User ${member.userId}`}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {getRoleBadge(member.role)}
              </div>
              
              {canManageWorkspace && member.userId !== 'user-1' && (
                <div className="flex items-center space-x-2">
                  <select
                    value={member.role}
                    onChange={(e) => handleUpdateMemberRole(member.userId, e.target.value as 'admin' | 'member' | 'viewer')}
                    className="text-sm border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveMember(member.userId)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          {workspaceMembers.length === 0 && (
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
              <Users className="h-12 w-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
              <p>No members yet</p>
              {canInviteMembers && (
                <Button variant="outline" className="mt-4" onClick={() => setIsInviting(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite First Member
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      {canManageWorkspace && !workspace.isDefault && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-red-700">
              Once you delete a workspace, there is no going back. Please be certain.
            </p>
            
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-sm text-red-700 font-medium">
                  Are you sure you want to delete "{workspace.name}"? This action cannot be undone.
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="danger"
                    onClick={handleDeleteWorkspace}
                    loading={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Yes, Delete Workspace
                  </Button>
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Workspace
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
