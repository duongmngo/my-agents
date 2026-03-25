/**
 * MemberCard Component
 * Displays a workspace member with role management and removal options
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { User, ChevronDown, Shield, UserMinus, Crown } from "lucide-react";
import type { WorkspaceMember } from "@/services/team-service";

interface MemberCardProps {
  member: WorkspaceMember;
  currentUserRole: "owner" | "admin" | "member" | "viewer";
  currentUserId: string;
  onRoleChange: (userId: string, newRole: WorkspaceMember["role"]) => void;
  onRemove: (userId: string) => void;
  isUpdating?: boolean;
}

const ROLE_CONFIG: Record<
  WorkspaceMember["role"],
  { label: string; icon: typeof Shield; color: string }
> = {
  owner: { label: "Owner", icon: Crown, color: "text-amber-500" },
  admin: { label: "Admin", icon: Shield, color: "text-blue-500" },
  member: { label: "Member", icon: User, color: "text-gray-500" },
  viewer: { label: "Viewer", icon: User, color: "text-gray-400" },
};

export function MemberCard({
  member,
  currentUserRole,
  currentUserId,
  onRoleChange,
  onRemove,
  isUpdating = false,
}: MemberCardProps) {
  const t = useTranslations();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isCurrentUser = member.userId === currentUserId;
  const canManageRoles = currentUserRole === "owner" || currentUserRole === "admin";
  const canRemove = canManageRoles && !isCurrentUser;

  // Role change restrictions
  const canChangeRole = (): boolean => {
    if (!canManageRoles) return false;
    if (isCurrentUser) return false;
    if (currentUserRole === "admin") {
      // Admins cannot change owner or admin roles
      return member.role !== "owner" && member.role !== "admin";
    }
    return true; // Owners can change any role
  };

  // Get available roles for dropdown
  const getAvailableRoles = (): WorkspaceMember["role"][] => {
    if (currentUserRole === "owner") {
      return ["owner", "admin", "member", "viewer"];
    }
    if (currentUserRole === "admin") {
      return ["member", "viewer"];
    }
    return [];
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowRoleDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleConfig = ROLE_CONFIG[member.role];
  const RoleIcon = roleConfig.icon;

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Member Info */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
          {member.user?.avatarUrl ? (
            <img
              src={member.user.avatarUrl}
              alt={member.user.fullName || member.user.email}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-gray-500" />
          )}
        </div>

        {/* Name and Email */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {member.user?.fullName || member.user?.username || "Unknown User"}
            </span>
            {isCurrentUser && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                {t("settings.team.you")}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {member.user?.email || "No email"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Role Badge/Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => canChangeRole() && setShowRoleDropdown(!showRoleDropdown)}
            disabled={!canChangeRole() || isUpdating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              canChangeRole()
                ? "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                : "bg-gray-50 dark:bg-gray-800 cursor-default"
            } ${isUpdating ? "opacity-50" : ""}`}
          >
            <RoleIcon className={`w-4 h-4 ${roleConfig.color}`} />
            <span className="text-gray-700 dark:text-gray-300">
              {t(`settings.team.roles.${member.role}`)}
            </span>
            {canChangeRole() && (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Role Dropdown */}
          {showRoleDropdown && (
            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
              {getAvailableRoles().map((role) => {
                const config = ROLE_CONFIG[role];
                const Icon = config.icon;
                return (
                  <button
                    key={role}
                    onClick={() => {
                      onRoleChange(member.userId, role);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                      role === member.role
                        ? "bg-gray-50 dark:bg-gray-750"
                        : ""
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className="text-gray-700 dark:text-gray-300">
                      {t(`settings.team.roles.${role}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Remove Button */}
        {canRemove && (
          <button
            onClick={() => onRemove(member.userId)}
            disabled={isUpdating}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
            title={t("settings.team.removeMember")}
          >
            <UserMinus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
