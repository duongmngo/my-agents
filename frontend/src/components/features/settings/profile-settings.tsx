'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common/button';
import { Badge } from '@/components/common/badge/badge';
import { Input } from '@/components/common/input';
import { 
  Save, 
  Sun, 
  Moon, 
  Monitor,
  Lock,
  User as UserIcon,
  Mail,
  Calendar,
  Loader2
} from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { userService, ProfileUpdateData, UserProfile } from '@/services/user-service';
import toast from 'react-hot-toast';
import { AvatarUpload } from './avatar-upload';
import { PasswordChangeModal } from './password-change-modal';
import { User } from '@/types/common-types';

interface ProfileSettingsProps {
  user: User | null;
  onLanguageChange: (locale: string) => void;
  currentLocale: string;
  onProfileUpdate?: (profile: UserProfile) => void;
}

// Timezone options
const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh (ICT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ 
  user, 
  onLanguageChange, 
  currentLocale,
  onProfileUpdate 
}) => {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  
  // Profile state (fetched from API for full details)
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  
  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch full profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const fullProfile = await userService.getProfile();
        setProfile(fullProfile);
        setFirstName(fullProfile.firstName || '');
        setLastName(fullProfile.lastName || '');
        setBio(fullProfile.bio || '');
        setTimezone(fullProfile.timezone || 'UTC');
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // Fall back to user prop data
        if (user) {
          setFirstName(user.firstName || '');
          setLastName(user.lastName || '');
          setBio(user.bio || '');
          setTimezone(user.timezone || 'UTC');
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Track changes
  useEffect(() => {
    if (profile) {
      const changed = 
        firstName !== (profile.firstName || '') ||
        lastName !== (profile.lastName || '') ||
        bio !== (profile.bio || '') ||
        timezone !== (profile.timezone || 'UTC');
      setHasChanges(changed);
    }
  }, [firstName, lastName, bio, timezone, profile]);

  // Language and theme options
  const languages = [
    { code: 'en', name: t('settings.language.english'), flag: '🇺🇸' },
    { code: 'vi', name: t('settings.language.vietnamese'), flag: '🇻🇳' },
    { code: 'ja', name: t('settings.language.japanese'), flag: '🇯🇵' },
  ];

  const themeOptions = [
    { value: 'light', icon: Sun, label: t('settings.theme.light') },
    { value: 'dark', icon: Moon, label: t('settings.theme.dark') },
    { value: 'system', icon: Monitor, label: t('settings.theme.system') },
  ] as const;

  const handleSaveProfile = async () => {
    if (!hasChanges) return;
    
    setIsSaving(true);
    try {
      const updateData: ProfileUpdateData = {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        bio: bio || undefined,
        timezone: timezone || undefined,
        language: currentLocale || undefined,
      };
      
      const updatedProfile = await userService.updateProfile(updateData);
      setProfile(updatedProfile);
      
      toast.success(t('settings.profile.profileUpdated'));
      setHasChanges(false);
      
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error?.response?.data?.detail || t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpdate = async (avatarUrl: string) => {
    if (profile) {
      const updatedProfile = { ...profile, avatarUrl };
      setProfile(updatedProfile);
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    // Validate locale - fallback to 'en' if invalid
    const validLocales = ['en', 'vi', 'ja', 'en-US', 'en-GB', 'vi-VN', 'ja-JP'];
    const locale = validLocales.includes(currentLocale) ? currentLocale : 'en';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Use profile data for display, fall back to user prop
  const displayData = profile || (user ? {
    id: user.id,
    email: user.email,
    username: user.username || user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.name,
    avatarUrl: user.avatar || user.avatarUrl,
    bio: user.bio,
    role: user.role,
    isActive: user.isActive ?? true,
    isVerified: user.isVerified ?? false,
    timezone: user.timezone || 'UTC',
    language: user.language || 'en',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  } : null);

  if (isLoadingProfile) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <span className="ml-2 text-neutral-500">{t('common.loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('settings.profile.title')}
        </h2>
        
        <div className="space-y-6">
          {/* Avatar and basic info */}
          <div className="flex items-start space-x-6">
            <AvatarUpload
              currentAvatarUrl={displayData?.avatarUrl}
              username={displayData?.username || 'U'}
              onAvatarUpdate={handleAvatarUpdate}
            />
            
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {displayData?.fullName || displayData?.username || 'Unknown User'}
              </h3>
              <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 space-x-4">
                <span className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  {displayData?.email || 'No email'}
                </span>
                <span className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  @{displayData?.username || 'unknown'}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="success">{t('settings.profile.active')}</Badge>
                {displayData?.role && (
                  <Badge variant="outline">{displayData.role}</Badge>
                )}
              </div>
              {displayData?.createdAt && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {t('settings.profile.memberSince')}: {formatDate(displayData.createdAt)}
                </p>
              )}
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('settings.profile.firstName')}
              </label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t('settings.profile.firstName')}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('settings.profile.lastName')}
              </label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t('settings.profile.lastName')}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('settings.profile.bio')}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('settings.profile.bioPlaceholder')}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-neutral-400 mt-1">{bio.length}/500</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('settings.profile.timezone')}
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('settings.profile.security')}
        </h2>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {t('settings.profile.changePassword')}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('settings.profile.passwordRequirements')}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsPasswordModalOpen(true)}
          >
            <Lock className="h-4 w-4 mr-2" />
            {t('common.change')}
          </Button>
        </div>
      </div>

      {/* Language Settings */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('settings.language.title')}
        </h2>
        
        <div className="space-y-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className={`
                w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors
                ${currentLocale === lang.code
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                }
              `}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="flex-1 text-left font-medium text-neutral-900 dark:text-neutral-100">
                {lang.name}
              </span>
              {currentLocale === lang.code && (
                <Badge variant="success">{t('settings.language.current')}</Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('settings.theme.title')}
        </h2>
        
        <div className="space-y-3">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`
                  w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors
                  ${theme === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }
                `}
              >
                <Icon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                <span className="flex-1 text-left font-medium text-neutral-900 dark:text-neutral-100">
                  {option.label}
                </span>
                {theme === option.value && (
                  <Badge variant="success">{t('settings.theme.current')}</Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end sticky bottom-4">
          <Button onClick={handleSaveProfile} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      )}

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
