'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common/button';
import { Badge } from '@/components/common/badge/badge';
import { 
  Save, 
  Sun, 
  Moon, 
  Monitor
} from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';

interface ProfileSettingsProps {
  user: any;
  onLanguageChange: (locale: string) => void;
  currentLocale: string;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ 
  user, 
  onLanguageChange, 
  currentLocale 
}) => {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  
  const [isSaving, setIsSaving] = useState(false);

  // Language and theme options
  const languages = [
    { code: 'en', name: t('settings.language.english'), flag: '🇺🇸' },
    { code: 'vi', name: t('settings.language.vietnamese'), flag: '🇻🇳' },
  ];

  const themeOptions = [
    { value: 'light', icon: Sun, label: t('settings.theme.light') },
    { value: 'dark', icon: Moon, label: t('settings.theme.dark') },
    { value: 'system', icon: Monitor, label: t('settings.theme.system') },
  ] as const;

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement profile save logic
      console.log('Saving profile...');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('settings.profile.title')}
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <span className="text-2xl font-semibold text-primary-600 dark:text-primary-400">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {user?.username || 'Unknown User'}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {user?.email || 'No email provided'}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="success">{t('settings.profile.active')}</Badge>
                {user?.role && (
                  <Badge variant="outline">{user.role}</Badge>
                )}
              </div>
            </div>
          </div>
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
      <div className="flex justify-end">
        <Button onClick={handleSaveProfile} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  );
};
