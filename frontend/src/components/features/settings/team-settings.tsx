/**
 * TeamSettings Component
 * Displays and manages workspace team members
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Users, UserPlus, Loader2, AlertCircle } from "lucide-react";
import { teamService, type WorkspaceMember } from "@/services/team-service";
import { MemberCard } from "./member-card";
import { AddMemberModal } from "./add-member-modal";

interface TeamSettingsProps {
  workspaceId: string;
  currentUserId: string;
  currentUserRole: "owner" | "admin" | "member" | "viewer";
}

export function TeamSettings({
  workspaceId,
  currentUserId,
  currentUserRole,
}: TeamSettingsProps) {
  const t = useTranslations();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  const canManageTeam = currentUserRole === "owner" || currentUserRole === "admin";

  // Fetch members
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await teamService.getMembers(workspaceId);
      // Sort: owners first, then admins, then members, then viewers
      const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 };
      data.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
      setMembers(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast.error(t("settings.team.errors.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, t]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Add member
  const handleAddMember = async (email: string, role: WorkspaceMember["role"]) => {
    const newMember = await teamService.addMemberByEmail(workspaceId, { email, role });
    setMembers((prev) => {
      const updated = [...prev, newMember];
      const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 };
      updated.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
      return updated;
    });
    toast.success(t("settings.team.memberAdded"));
  };

  // Update member role
  const handleRoleChange = async (userId: string, newRole: WorkspaceMember["role"]) => {
    setUpdatingMemberId(userId);
    try {
      await teamService.updateMemberRole(workspaceId, userId, newRole);
      setMembers((prev) => {
        const updated = prev.map((m) =>
          m.userId === userId ? { ...m, role: newRole } : m
        );
        const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 };
        updated.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
        return updated;
      });
      toast.success(t("settings.team.roleUpdated"));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(errorMessage);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  // Remove member
  const handleRemoveMember = async (userId: string) => {
    const member = members.find((m) => m.userId === userId);
    const memberName = member?.user?.fullName || member?.user?.email || "this member";

    if (!confirm(t("settings.team.confirmRemove", { name: memberName }))) {
      return;
    }

    setUpdatingMemberId(userId);
    try {
      await teamService.removeMember(workspaceId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.success(t("settings.team.memberRemoved"));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(errorMessage);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <button
          onClick={fetchMembers}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-gray-500" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("settings.team.title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("settings.team.memberCount", { count: members.length })}
            </p>
          </div>
        </div>

        {canManageTeam && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {t("settings.team.addMember")}
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {members.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t("settings.team.noMembers")}
          </div>
        ) : (
          members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              currentUserRole={currentUserRole}
              currentUserId={currentUserId}
              onRoleChange={handleRoleChange}
              onRemove={handleRemoveMember}
              isUpdating={updatingMemberId === member.userId}
            />
          ))
        )}
      </div>

      {/* Role Permissions Info */}
      {!canManageTeam && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("settings.team.viewOnlyMessage")}
          </p>
        </div>
      )}

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMember}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
