/**
 * AddMemberModal Component
 * Modal for inviting new members to workspace by email
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Mail, Shield, User, Crown, Loader2 } from "lucide-react";
import type { WorkspaceMember } from "@/services/team-service";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (email: string, role: WorkspaceMember["role"]) => Promise<void>;
  currentUserRole: "owner" | "admin" | "member" | "viewer";
}

const ROLE_OPTIONS: Array<{
  value: WorkspaceMember["role"];
  icon: typeof Shield;
  color: string;
  adminCanSelect: boolean;
}> = [
  { value: "owner", icon: Crown, color: "text-amber-500", adminCanSelect: false },
  { value: "admin", icon: Shield, color: "text-blue-500", adminCanSelect: false },
  { value: "member", icon: User, color: "text-gray-500", adminCanSelect: true },
  { value: "viewer", icon: User, color: "text-gray-400", adminCanSelect: true },
];

export function AddMemberModal({
  isOpen,
  onClose,
  onAdd,
  currentUserRole,
}: AddMemberModalProps) {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<WorkspaceMember["role"]>("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableRoles = ROLE_OPTIONS.filter((role) => {
    if (currentUserRole === "owner") return true;
    if (currentUserRole === "admin") return role.adminCanSelect;
    return false;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t("settings.team.errors.emailRequired"));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t("settings.team.errors.invalidEmail"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(email.trim(), selectedRole);
      // Reset form and close
      setEmail("");
      setSelectedRole("member");
      onClose();
    } catch (err: unknown) {
      // Extract error message from API response
      let errorMessage: string;
      if (err && typeof err === 'object') {
        const errorObj = err as { response?: { data?: { detail?: string } }; message?: string };
        errorMessage = errorObj.response?.data?.detail || errorObj.message || String(err);
      } else {
        errorMessage = String(err);
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail("");
      setSelectedRole("member");
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("settings.team.addMember")}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t("settings.team.email")}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("settings.team.emailPlaceholder")}
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("settings.team.role")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableRoles.map((roleOption) => {
                const Icon = roleOption.icon;
                const isSelected = selectedRole === roleOption.value;
                return (
                  <button
                    key={roleOption.value}
                    type="button"
                    onClick={() => setSelectedRole(roleOption.value)}
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    } disabled:opacity-50`}
                  >
                    <Icon className={`w-4 h-4 ${roleOption.color}`} />
                    <span
                      className={`text-sm font-medium ${
                        isSelected
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {t(`settings.team.roles.${roleOption.value}`)}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t(`settings.team.roleDescriptions.${selectedRole}`)}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("settings.team.invite")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
