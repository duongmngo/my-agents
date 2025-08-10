# Frontend Architecture Rules

## Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components (Button, Input, Modal)
│   ├── layout/         # Layout components (Header, Sidebar, Footer)
│   └── features/       # Feature-specific components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API services and external integrations
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── constants/          # Application constants
├── styles/             # Global styles and theme
└── assets/             # Images, icons, fonts
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

## State Management

### Local State
- Use useState for component-specific state
- Keep state as close to where it's used as possible
- Use useReducer for complex state logic

### Global State
- Use React Context for theme, auth, user preferences
- Use Zustand for complex global state
- Avoid prop drilling - use Context or state management

### Server State
- Use React Query for API data fetching
- Implement proper caching strategies
- Handle loading and error states

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

## Routing

### Route Structure
- Use Next.js App Router
- Organize routes by feature
- Implement proper loading states
- Handle 404 and error pages

### Route Protection
- Authentication guards
- Role-based access control
- Tenant-specific routing
- Redirect handling

## Styling Architecture

### CSS Strategy
- Use Tailwind CSS for utility classes
- CSS Modules for component-specific styles
- CSS Variables for theming
- Responsive design patterns

### Theme System
- Light/dark mode support
- Tenant-specific branding
- Consistent color palette
- Typography scale

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

## Multi-Tenant Support

### Tenant Context
- Tenant identification
- Tenant-specific routing
- Tenant data isolation
- Tenant branding

### Feature Flags
- Tenant-specific features
- A/B testing support
- Feature toggles
- Gradual rollouts

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