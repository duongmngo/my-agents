# Internationalization and Theming

This document explains how to use the internationalization (i18n) and theming features in the My Agents frontend application.

## Internationalization (i18n)

### Supported Languages

- English (en) - Default
- Vietnamese (vi)

### How to Use Translations

1. **Import the translation hook:**
```tsx
import { useTranslations } from 'next-intl';
```

2. **Use translations in your component:**
```tsx
function MyComponent() {
  const t = useTranslations();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### Language Switching

Users can switch languages using the Language Settings in the Profile section of the Settings page (`/settings`). The language preference is session-based and will reset when the browser session ends.

### Translation Files

Translation files are located in `messages/`:
- `messages/en.json` - English translations
- `messages/vi.json` - Vietnamese translations

### Adding New Translations

1. Add the translation key and value to both language files
2. Use the translation in your component with `t('your.translation.key')`

Example:
```json
// messages/en.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my feature"
  }
}

// messages/vi.json
{
  "myFeature": {
    "title": "Tính năng của tôi",
    "description": "Đây là tính năng của tôi"
  }
}
```

## Theming

### Supported Themes

- Light mode
- Dark mode
- System (follows OS preference)

### How to Use the Theme System

1. **Import the theme hook:**
```tsx
import { useTheme } from '@/providers/theme-provider';
```

2. **Use theme in your component:**
```tsx
function MyComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      <button onClick={() => setTheme('dark')}>
        Switch to Dark
      </button>
    </div>
  );
}
```

### Theme Classes

The application uses Tailwind CSS with dark mode support. Use dark mode classes like:

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Content that adapts to theme
</div>
```

### Theme Switching

Users can switch themes using the Theme Settings in the Profile section of the Settings page (`/settings`). The theme preference is session-based and stored in sessionStorage, resetting when the browser session ends.

### CSS Variables and Component Classes

Global component classes automatically support dark mode:

- `.card` - Card background with dark mode support
- `.btn-primary` - Primary button with dark mode support
- `.btn-secondary` - Secondary button with dark mode support
- `.btn-outline` - Outline button with dark mode support
- `.input-field` - Input field with dark mode support

## Implementation Details

### File Structure

```
src/
├── providers/
│   └── theme-provider.tsx          # Theme context and provider (session-based)
├── app/
│   └── [locale]/
│       └── (authenticated)/
│           └── settings/
│               └── page.tsx         # Settings page with theme/language controls
├── components/
│   └── common/
│       ├── theme-switcher/         # Theme switching component (legacy)
│       └── language-switcher/      # Language switching component (legacy)
├── messages/                       # Translation files
│   ├── en.json
│   └── vi.json
├── i18n/
│   └── request.ts                  # i18n configuration
└── middleware.ts                   # Locale routing middleware
```

### Configuration Files

- `next.config.js` - Next.js configuration with next-intl plugin
- `middleware.ts` - Handles locale routing with `localePrefix: 'always'`
- `tailwind.config.js` - Tailwind configuration with `darkMode: 'class'`
- `src/i18n/request.ts` - i18n request configuration for next-intl

## Best Practices

### For Translations

1. Use nested keys for organization: `navigation.dashboard`
2. Keep keys descriptive and consistent
3. Always add translations to both language files
4. Use the namespace pattern for feature-specific translations

### For Theming

1. Always include dark mode variants for colors using `dark:` prefix
2. Test components in both light and dark modes
3. Use semantic color classes when possible
4. Avoid hardcoded colors in favor of theme-aware classes
5. Remember that theme preferences are session-based and reset on browser restart

### Testing

1. Test language switching from the Settings page profile section
2. Verify theme changes apply immediately and persist during the session
3. Check that all UI elements adapt properly to dark mode
4. Ensure proper contrast ratios in both themes
5. Verify session-based behavior: settings reset on browser restart
6. Test URL locale routing (e.g., `/en/dashboard`, `/vi/dashboard`)

## Troubleshooting

### Common Issues

1. **Missing translations**: Check that the key exists in both language files
2. **Theme not persisting**: Verify sessionStorage is available and working (note: session-based storage)
3. **Dark mode not applying**: Check that Tailwind's dark mode is configured with `darkMode: 'class'`
4. **Route not found after language switch**: Verify middleware configuration with `localePrefix: 'always'`
5. **Settings reset on page refresh**: This is expected behavior for session-based storage

### Profile Settings Location

Language and theme preferences are now managed through:

**Location**: Settings Page → Profile Tab → Preferences Section
**Path**: `/[locale]/settings` (e.g., `/en/settings` or `/vi/settings`)

**Features**:
- **Language Settings**: Switch between English and Vietnamese with visual flag indicators
- **Theme Settings**: Choose between Light, Dark, and System themes with icon indicators
- **Current Status**: Shows which language/theme is currently active
- **Session-Based**: Settings are preserved during the browser session but reset on restart

**UI Elements**:
- Language selector with country flags (🇺🇸 English, 🇻🇳 Vietnamese)
- Theme selector with icons (☀️ Light, 🌙 Dark, 🖥️ System)
- "Current" badges to indicate active selections
- Explanatory text indicating session-based behavior

## Recent Implementation Changes

### Migration from Sidebar to Settings Page

The language and theme switchers have been moved from the sidebar to the profile settings for better user experience and organization:

**Previous Location**: Sidebar (bottom section)
**New Location**: Settings → Profile → Preferences

### Session-Based Storage

**Previous Behavior**: 
- Theme preferences stored in `localStorage` (persistent across browser restarts)
- Language preferences handled by URL routing only

**Current Behavior**:
- Theme preferences stored in `sessionStorage` (reset on browser restart)
- Language preferences remain session-based through URL routing
- Both settings reset when the browser session ends

### Code Changes

**Theme Provider Updates**:
```tsx
// Before: localStorage
localStorage.setItem('theme', theme);
const storedTheme = localStorage.getItem('theme');

// After: sessionStorage  
sessionStorage.setItem('theme', theme);
const storedTheme = sessionStorage.getItem('theme');
```

**Settings Page Integration**:
- Added language and theme controls to `frontend/src/app/[locale]/(authenticated)/settings/page.tsx`
- Removed switcher components from sidebar
- Added translation keys for new settings UI
- Integrated with existing `useTheme` and `useLocale` hooks

### Translation Keys Added

```json
// English (en.json)
{
  "common": {
    "current": "Current"
  },
  "settings": {
    "sessionBased": "Session-based setting"
  }
}

// Vietnamese (vi.json)  
{
  "common": {
    "current": "Hiện tại"
  },
  "settings": {
    "sessionBased": "Cài đặt theo phiên"
  }
}
```
