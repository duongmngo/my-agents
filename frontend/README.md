# Frontend Application Structure

## Overview

This frontend application is built with **Next.js 14+**, **React 18+**, and **TypeScript** following the functional requirements for a multi-tenant ChatGPT-like application with MCP integration.

## Project Structure

```
frontend/
├── src/                          # Source code
│   ├── components/               # React components
│   │   ├── common/              # Reusable UI components
│   │   │   ├── button/          # Button components
│   │   │   ├── input/           # Input components
│   │   │   ├── modal/           # Modal components
│   │   │   ├── loading/         # Loading components
│   │   │   ├── error/           # Error components
│   │   │   ├── avatar/          # Avatar components
│   │   │   ├── badge/           # Badge components
│   │   │   ├── card/            # Card components
│   │   │   ├── dropdown/        # Dropdown components
│   │   │   ├── form/            # Form components
│   │   │   ├── icon/            # Icon components
│   │   │   ├── notification/    # Notification components
│   │   │   ├── pagination/      # Pagination components
│   │   │   ├── search/          # Search components
│   │   │   ├── table/           # Table components
│   │   │   └── tooltip/         # Tooltip components
│   │   ├── layout/              # Layout components
│   │   │   ├── header/          # Header component
│   │   │   ├── sidebar/         # Sidebar component
│   │   │   ├── footer/          # Footer component
│   │   │   ├── navigation/      # Navigation component
│   │   │   ├── breadcrumb/      # Breadcrumb component
│   │   │   ├── container/       # Container component
│   │   │   ├── sidebar-nav/     # Sidebar navigation
│   │   │   └── tenant-switcher/ # Tenant switcher
│   │   └── features/            # Feature-specific components
│   │       ├── authentication/  # Auth components
│   │       ├── agent-management/ # Agent management
│   │       ├── chat-system/     # Chat components
│   │       ├── tenant-management/ # Tenant management
│   │       ├── knowledge-base/  # Knowledge base
│   │       ├── mcp-integration/ # MCP integration
│   │       ├── file-storage/    # File storage
│   │       ├── analytics/       # Analytics components
│   │       ├── user-management/ # User management
│   │       └── admin-panel/     # Admin panel
│   ├── pages/                   # Page components
│   │   ├── dashboard/           # Dashboard page
│   │   ├── login/               # Login page
│   │   ├── register/            # Register page
│   │   ├── agents/              # Agents page
│   │   ├── chat/                # Chat page
│   │   ├── settings/            # Settings page
│   │   ├── analytics/           # Analytics page
│   │   ├── admin/               # Admin page
│   │   ├── knowledge/           # Knowledge page
│   │   ├── files/               # Files page
│   │   ├── profile/             # Profile page
│   │   ├── billing/             # Billing page
│   │   └── help/                # Help page
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-auth/            # Authentication hook
│   │   ├── use-chat/            # Chat hook
│   │   ├── use-agents/          # Agents hook
│   │   ├── use-tenant/          # Tenant hook
│   │   ├── use-api/             # API hook
│   │   ├── use-websocket/       # WebSocket hook
│   │   ├── use-local-storage/   # Local storage hook
│   │   ├── use-theme/           # Theme hook
│   │   ├── use-notification/    # Notification hook
│   │   ├── use-debounce/        # Debounce hook
│   │   ├── use-throttle/        # Throttle hook
│   │   ├── use-form/            # Form hook
│   │   └── use-pagination/      # Pagination hook
│   ├── services/                # API services
│   │   ├── api-client/          # API client
│   │   ├── auth-service/        # Authentication service
│   │   ├── chat-service/        # Chat service
│   │   ├── agent-service/       # Agent service
│   │   ├── tenant-service/      # Tenant service
│   │   ├── file-service/        # File service
│   │   ├── analytics-service/   # Analytics service
│   │   ├── mcp-service/         # MCP service
│   │   ├── websocket-service/   # WebSocket service
│   │   └── notification-service/ # Notification service
│   ├── utils/                   # Utility functions
│   │   ├── date-utils/          # Date utilities
│   │   ├── validation-utils/    # Validation utilities
│   │   ├── format-utils/        # Format utilities
│   │   ├── storage-utils/       # Storage utilities
│   │   ├── crypto-utils/        # Crypto utilities
│   │   ├── file-utils/          # File utilities
│   │   ├── url-utils/           # URL utilities
│   │   ├── array-utils/         # Array utilities
│   │   ├── object-utils/        # Object utilities
│   │   └── string-utils/        # String utilities
│   ├── types/                   # TypeScript types
│   │   ├── api-types/           # API types
│   │   ├── component-types/     # Component types
│   │   ├── user-types/          # User types
│   │   ├── agent-types/         # Agent types
│   │   ├── chat-types/          # Chat types
│   │   ├── tenant-types/        # Tenant types
│   │   ├── file-types/          # File types
│   │   ├── mcp-types/           # MCP types
│   │   ├── theme-types/         # Theme types
│   │   └── common-types/        # Common types
│   ├── constants/               # Application constants
│   │   ├── api-constants/       # API constants
│   │   ├── theme-constants/     # Theme constants
│   │   ├── validation-constants/ # Validation constants
│   │   ├── route-constants/     # Route constants
│   │   ├── feature-constants/   # Feature constants
│   │   └── error-constants/     # Error constants
│   ├── styles/                  # Styles and themes
│   │   ├── global/              # Global styles
│   │   ├── themes/              # Theme definitions
│   │   ├── components/          # Component styles
│   │   └── utilities/           # Utility styles
│   └── assets/                  # Static assets
│       ├── images/              # Images
│       ├── icons/               # Icons
│       ├── fonts/               # Fonts
│       └── logos/               # Logos
├── public/                      # Public assets
├── config/                      # Configuration files
├── scripts/                     # Build scripts
└── docs/                        # Documentation
```

## Technology Stack

### Core Technologies
- **Next.js 14+**: React framework with App Router
- **React 18+**: UI library with hooks and concurrent features
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework

### State Management
- **Zustand**: Lightweight state management
- **React Query**: Server state management
- **React Context**: Theme and auth context

### UI Components
- **Headless UI**: Unstyled, accessible components
- **React Hook Form**: Form management
- **React Hot Toast**: Toast notifications
- **Lucide React**: Icon library

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **TypeScript**: Type checking

## Key Features

### Multi-Tenant Support
- **Tenant Isolation**: Complete data isolation per tenant
- **Tenant Switching**: Easy tenant switching in UI
- **Tenant Branding**: Custom branding per tenant
- **Tenant Analytics**: Isolated analytics per tenant

### Authentication & Authorization
- **JWT Authentication**: Secure token-based auth
- **OAuth Integration**: Google, GitHub, Microsoft
- **Multi-Factor Auth**: 2FA support
- **Role-Based Access**: User, admin, owner roles

### Chat System
- **Real-time Messaging**: WebSocket-based chat
- **Agent Conversations**: Multiple agents per conversation
- **Message History**: Persistent conversation history
- **File Upload**: Support for various file types

### Agent Management
- **Custom Agents**: Create and configure agents
- **Agent Templates**: Pre-built templates
- **MCP Integration**: Model Context Protocol tools
- **Agent Analytics**: Usage and performance metrics

### Knowledge Base
- **Document Upload**: PDF, Word, Excel, text files
- **Vector Search**: Semantic search with embeddings
- **Web Content**: Import from websites and RSS
- **Database Integration**: External database connections

### File Storage
- **S3-Compatible**: MinIO integration
- **Multi-Tenant**: Tenant-specific file isolation
- **File Versioning**: Automatic version control
- **Access Control**: Granular permissions

### Analytics & Monitoring
- **Usage Analytics**: Track user activity
- **Performance Metrics**: Response times and errors
- **Cost Tracking**: API usage and billing
- **Real-time Monitoring**: Live system monitoring

## Development Guidelines

### File Naming Conventions
- **Components**: kebab-case (e.g., `user-profile.tsx`)
- **Hooks**: kebab-case (e.g., `use-auth.ts`)
- **Services**: kebab-case (e.g., `api-client.ts`)
- **Utils**: kebab-case (e.g., `date-utils.ts`)
- **Types**: kebab-case (e.g., `user-types.ts`)

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

### API Integration
- **CamelCase**: All API properties use camelCase
- **Type Safety**: Full TypeScript interfaces
- **Error Handling**: Consistent error handling
- **Loading States**: Proper loading state management

### State Management
- **Local State**: useState for component-specific state
- **Global State**: Zustand for complex global state
- **Server State**: React Query for API data
- **Context**: React Context for theme and auth

### Styling
- **Tailwind CSS**: Utility-first approach
- **CSS Modules**: Component-specific styles
- **CSS Variables**: Theme system
- **Responsive Design**: Mobile-first approach

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Authentication
NEXT_PUBLIC_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_AUTH_CLIENT_ID=your-client-id

# File Storage
NEXT_PUBLIC_S3_ENDPOINT=http://localhost:9000
NEXT_PUBLIC_S3_BUCKET=your-bucket-name

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

## Development Workflow

### Feature Development
1. **Create Feature Branch**: `git checkout -b feature/feature-name`
2. **Implement Feature**: Follow coding conventions
3. **Write Tests**: Unit and integration tests
4. **Code Review**: Submit pull request
5. **Merge**: After approval and CI passing

### Code Quality
- **ESLint**: Automatic code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Pre-commit hooks

### Testing Strategy
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API integration testing
- **E2E Tests**: User flow testing
- **Accessibility Tests**: Screen reader and keyboard navigation

## Deployment

### Build Process
```bash
# Install dependencies
npm ci

# Run tests
npm test

# Build application
npm run build

# Start production server
npm start
```

### Environment Configuration
- **Development**: Local development setup
- **Staging**: Pre-production testing
- **Production**: Live application deployment

### Monitoring
- **Performance**: Core Web Vitals monitoring
- **Errors**: Error tracking and alerting
- **Analytics**: User behavior analytics
- **Uptime**: Application availability monitoring

## Contributing

### Code Standards
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error boundaries
- Write comprehensive tests
- Document complex logic

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Update documentation
6. Submit pull request

### Review Guidelines
- Code quality and standards
- Test coverage
- Performance impact
- Security considerations
- Accessibility compliance

## Support

### Documentation
- **Component Library**: Storybook documentation
- **API Documentation**: OpenAPI/Swagger docs
- **Architecture**: Technical documentation
- **User Guide**: End-user documentation

### Troubleshooting
- **Common Issues**: Known problems and solutions
- **Debug Guide**: Debugging techniques
- **Performance**: Optimization tips
- **Security**: Security best practices

This frontend structure provides a solid foundation for building a scalable, maintainable, and feature-rich multi-tenant ChatGPT-like application with comprehensive MCP integration capabilities. 