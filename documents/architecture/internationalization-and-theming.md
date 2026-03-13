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

### Color System and Theme Classes

The application uses an improved color system with Tailwind CSS and dark mode support. 

#### Color Palette

**Primary Colors (Indigo-based)**:
- `primary-50`: `#eef2ff` - Very light backgrounds
- `primary-100`: `#e0e7ff` - Light backgrounds
- `primary-500`: `#6366f1` - Default primary
- `primary-600`: `#4f46e5` - Primary buttons (light mode)
- `primary-700`: `#4338ca` - Hover states

**Neutral Colors (True Gray)**:
- `neutral-50`: `#fafafa` - Light mode background
- `neutral-100`: `#f5f5f5` - Light cards
- `neutral-300`: `#d4d4d4` - Light borders
- `neutral-600`: `#525252` - Medium text
- `neutral-700`: `#404040` - Dark text (light mode)
- `neutral-800`: `#262626` - Dark backgrounds
- `neutral-900`: `#171717` - Darker backgrounds
- `neutral-950`: `#0a0a0a` - Darkest background

**Semantic Colors**:
- `success-*`: Green colors for positive states
- `warning-*`: Amber colors for warning states
- `error-*`: Red colors for error states

#### Using Theme Classes

Use dark mode classes with the improved color system:

```tsx
// Card components
<div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
  Content that adapts to theme
</div>

// Text hierarchy
<h1 className="text-neutral-900 dark:text-neutral-100">Primary text</h1>
<p className="text-neutral-700 dark:text-neutral-300">Secondary text</p>
<span className="text-neutral-600 dark:text-neutral-400">Tertiary text</span>

// Interactive elements
<button className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600">
  Primary Button
</button>
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

### Color Migration Guidelines

When updating components to use the new color system:

#### Replace Old Classes
```diff
# Background Colors
- bg-gray-50 → bg-neutral-50
- bg-gray-100 → bg-neutral-100
- bg-gray-800 → bg-neutral-800
- bg-gray-900 → bg-neutral-900

# Text Colors
- text-gray-400 → text-neutral-500 (light mode)
- text-gray-500 → text-neutral-600 (light mode)
- text-gray-300 → text-neutral-300 (dark mode)
- text-gray-400 → text-neutral-400 (dark mode)

# Border Colors
- border-gray-200 → border-neutral-200
- border-gray-300 → border-neutral-300
- border-gray-600 → border-neutral-600
- border-gray-700 → border-neutral-700

# Hover States
- hover:bg-gray-100 → hover:bg-neutral-100
- hover:bg-gray-700 → hover:bg-neutral-800
```

#### Accessibility Guidelines

**Light Mode Contrast**:
- Background: `neutral-50` (#fafafa)
- Cards: `white` with `neutral-200` borders
- Primary text: `neutral-900` (AAA compliance)
- Secondary text: `neutral-700` (AA compliance)
- Tertiary text: `neutral-600` (AA compliance)

**Dark Mode Contrast**:
- Background: `neutral-950` (#0a0a0a)
- Cards: `neutral-900` with `neutral-700` borders
- Primary text: `neutral-100` (AAA compliance)
- Secondary text: `neutral-300` (AA compliance)
- Tertiary text: `neutral-400` (AA compliance)

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

### Color and Theme Issues

1. **Low contrast warnings**: Use darker neutral shades for light mode text
2. **Text disappearing in dark mode**: Use lighter neutral shades (300-100 range)
3. **Buttons too bright in dark mode**: Use `primary-500` instead of `primary-600`
4. **Borders invisible**: Ensure sufficient contrast with background colors
5. **Hover states not working**: Include both light and dark variants

#### Quick Fixes

```css
/* If text is too light in dark mode */
.dark .my-text {
  @apply text-neutral-300 instead of text-neutral-500;
}

/* If borders are invisible in dark mode */
.dark .my-border {
  @apply border-neutral-600 instead of border-neutral-800;
}

/* If buttons are too bright in dark mode */
.dark .my-button {
  @apply bg-primary-500 hover:bg-primary-600;
}
```

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

## Color System Implementation Status

### ✅ Completed
- [x] Tailwind config updated with new color palette
- [x] Global CSS classes updated
- [x] Sidebar navigation colors migrated
- [x] Button component variants updated
- [x] Settings page complete redesign
- [x] Workspace switcher dark theme
- [x] Dashboard page dark theme enhancement
- [x] Chat page dark theme implementation
- [x] Agents page dark theme implementation
- [x] Knowledge page dark theme implementation
- [x] Analytics page dark theme implementation
- [x] Agent creation/edit forms dark theme
- [x] Card components throughout the app
- [x] Modal components styling
- [x] Form inputs and interactive elements

### 🎯 Color System Benefits

1. **Improved Accessibility**: WCAG AA/AAA compliance in both themes
2. **Better Visual Hierarchy**: Clear text contrast ratios
3. **Professional Appearance**: Modern indigo-based primary colors
4. **Enhanced UX**: Consistent hover states and interactions
5. **Maintainable Code**: Systematic color naming and usage

## Resources

- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
