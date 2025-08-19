# Frontend Architecture Rules

> **Current Status**: This document reflects the implemented frontend architecture in the prototype. ✅ indicates fully implemented patterns.

## Project Structure ✅
```
src/
├── app/                # Next.js App Router pages and layouts
│   ├── [locale]/      # Internationalized routes
│   │   ├── (authenticated)/  # Protected route group
│   │   ├── login/     # Authentication pages
│   │   └── globals.css # Global styles
├── components/         # Reusable UI components
│   ├── common/        # Shared components (Button, Input, Modal)
│   ├── features/      # Feature-specific components
│   └── layout/        # Layout components (Header, Sidebar, Footer)
├── pages/             # Page components (legacy structure)
├── hooks/             # Custom React hooks
├── services/          # API services and external integrations
├── utils/             # Utility functions
├── types/             # TypeScript type definitions
├── constants/         # Application constants
├── styles/            # Global styles and theme
├── assets/            # Images, icons, fonts
├── i18n/              # Internationalization configuration
└── providers/         # React context providers
```

## Component Architecture

### Component Categories
- **Common Components**: Reusable across the entire app
- **Layout Components**: Structure and navigation
- **Feature Components**: Specific to features (chat, agents, etc.)
- **Page Components**: Top-level page components

### Component Structure
```typescript
// Component file structure
import React from 'react';
import { ComponentProps } from './component.types';

export const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
};
```

## State Management ✅

### Local State ✅
- Use useState for component-specific state
- Keep state as close to where it's used as possible
- Use useReducer for complex state logic

### Global State ✅
- **Zustand**: Primary global state management (auth, workspace, conversations)
- **React Context**: Theme provider and locale context
- **Avoid prop drilling**: Use Zustand stores for cross-component state

### Server State (🚧 Planned)
- **React Query**: For API data fetching (planned for backend integration)
- **Optimistic Updates**: Immediate UI updates with rollback
- **Caching Strategy**: Intelligent cache invalidation

## Data Flow

### API Integration
- Centralized API client
- Consistent error handling
- Request/response interceptors
- Type-safe API calls

### Data Fetching
- Use React Query for server state
- Implement optimistic updates
- Handle offline scenarios
- Cache invalidation strategies

## Routing ✅

### Route Structure ✅
- **Next.js App Router**: Fully implemented with nested layouts
- **Internationalized Routes**: `[locale]` parameter for multi-language support
- **Route Groups**: `(authenticated)` for protected routes
- **Loading/Error Pages**: Proper loading and error boundaries

### Route Protection ✅
- **Authentication Guards**: Layout-level protection for authenticated routes
- **Role-Based Access**: Admin/user role validation
- **Tenant Context**: Automatic tenant isolation
- **Redirect Handling**: Automatic redirects for unauthenticated users

## Styling Architecture ✅

### CSS Strategy ✅
- **Tailwind CSS**: Primary utility-first CSS framework
- **CSS Variables**: Dynamic theming with CSS custom properties
- **Component Classes**: Scoped styling for complex components
- **Responsive Design**: Mobile-first responsive patterns

### Theme System ✅
- **Light/Dark Mode**: Real-time theme switching implemented
- **CSS Variables**: Dynamic color system with theme inheritance
- **Tenant Branding**: Support for custom logos and colors (partially implemented)
- **Typography Scale**: Consistent font sizing and spacing system

## Performance

### Code Splitting
- Route-based code splitting
- Component lazy loading
- Dynamic imports for heavy components
- Bundle analysis and optimization

### Rendering Optimization
- React.memo for expensive components
- useCallback for function props
- useMemo for expensive calculations
- Virtual scrolling for large lists

## Security

### Input Validation
- Client-side validation
- Sanitize user inputs
- Prevent XSS attacks
- Secure form handling

### Authentication
- JWT token management
- Secure token storage
- Automatic token refresh
- Logout and session cleanup

## Accessibility

### Standards
- WCAG 2.1 AA compliance
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support

### Testing
- Screen reader testing
- Keyboard-only navigation
- Color contrast validation
- Focus management

## Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- Hook testing
- Utility function testing
- Mock external dependencies

### Integration Testing
- API integration tests
- User flow testing
- Cross-browser testing
- Performance testing

## Error Handling

### Error Boundaries
- Component error boundaries
- Route error boundaries
- Global error handling
- Error reporting and logging

### User Experience
- User-friendly error messages
- Loading states
- Retry mechanisms
- Graceful degradation

## Internationalization ✅

### Language Support ✅
- **next-intl Integration**: Full i18n support with 10+ languages
- **Dynamic Language Switching**: Real-time language changes without reload
- **Route-Based Localization**: URL-based locale detection (`/en`, `/vi`, etc.)
- **Fallback Mechanism**: Automatic fallback to default language
- **RTL Support**: Ready for right-to-left languages

### Implementation Pattern ✅
```typescript
// Usage in components
import { useTranslations } from 'next-intl';

export function Component() {
  const t = useTranslations('namespace');
  return <div>{t('key')}</div>;
}

// Message files structure
messages/
├── en.json
├── vi.json
├── es.json
└── ...
```

### Translation Management ✅
- **Namespaced Translations**: Organized by feature/component
- **Type-Safe Keys**: TypeScript integration for translation keys
- **Pluralization**: Built-in plural form handling
- **Date/Number Formatting**: Locale-aware formatting

## Multi-Tenant Support ✅

### Tenant Context ✅
- **Tenant Identification**: Automatic tenant detection and isolation
- **Tenant-Specific Routing**: Route-level tenant context injection
- **Data Isolation**: All API calls include tenant context
- **Tenant Branding**: Custom logos and company names per tenant

### Feature Flags (🚧 Planned)
- **Tenant-Specific Features**: Per-tenant feature toggles
- **A/B Testing**: Experimental feature testing
- **Feature Toggles**: Runtime feature enabling/disabling
- **Gradual Rollouts**: Phased feature deployment

## Build and Deployment

### Environment Configuration
- Environment-specific configs
- Feature flags
- API endpoints
- Build optimization

### CI/CD Integration
- Automated testing
- Code quality checks
- Build optimization
- Deployment strategies 