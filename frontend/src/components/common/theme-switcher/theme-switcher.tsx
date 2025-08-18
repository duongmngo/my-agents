'use client';

import React from 'react';
import { useTheme } from '@/providers/theme-provider';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';

const themes = [
  { value: 'light', icon: Sun, label: 'theme.light' },
  { value: 'dark', icon: Moon, label: 'theme.dark' },
  { value: 'system', icon: Monitor, label: 'theme.system' },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations();

  const currentTheme = themes.find(t => t.value === theme);
  const CurrentIcon = currentTheme?.icon || Sun;

  return (
    <div className="relative group">
      <button
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={t('theme.switchTheme')}
      >
        <CurrentIcon className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {t(currentTheme?.label || 'theme.light')}
        </span>
      </button>

      <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-2">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            return (
              <button
                key={themeOption.value}
                onClick={() => setTheme(themeOption.value)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  theme === themeOption.value
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="flex items-center space-x-3">
                  <Icon className="h-4 w-4" />
                  <span>{t(themeOption.label)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
