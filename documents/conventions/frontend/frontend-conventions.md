# Frontend Coding Conventions

## File Naming
- Use kebab-case for all file names: user-profile.tsx, chat-message.tsx, api-client.ts, date-utils.ts
- Component files: user-profile.tsx, chat-message.tsx
- Utility files: api-client.ts, date-utils.ts
- Page files: home-page.tsx, settings-page.tsx

## Component Structure
- One component per file
- Export component as default
- Use TypeScript interfaces for props
- Keep components small and focused

## Naming Conventions
- Components: PascalCase (UserProfile, ChatMessage)
- Functions: camelCase (getUserData, handleSubmit)
- Variables: camelCase (userName, messageCount)
- Constants: UPPER_SNAKE_CASE (API_BASE_URL, MAX_FILE_SIZE)
- CSS classes: kebab-case (user-profile, chat-message)

## Code Organization
- Import order: React, external libraries, internal components, types, utilities
- Group related functions together
- Use meaningful variable names
- Add comments for complex logic

## State Management
- Use React hooks (useState, useEffect, useContext)
- Keep state as close to where it's used as possible
- Use custom hooks for reusable logic
- Avoid prop drilling - use Context when needed

## Error Handling
- Always handle async operations with try-catch
- Show user-friendly error messages
- Log errors for debugging
- Use error boundaries for component errors

## Performance
- Use React.memo for expensive components
- Avoid inline functions in render
- Use useCallback for function props
- Use useMemo for expensive calculations

## Accessibility
- Use semantic HTML elements
- Add alt text to images
- Use ARIA labels when needed
- Ensure keyboard navigation works
- Test with screen readers

## Testing
- Write unit tests for components
- Test user interactions
- Mock external dependencies
- Use meaningful test descriptions

## Code Style
- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use trailing commas in objects and arrays
- Keep line length under 80 characters

## API Integration
- Use camelCase for all API request/response properties
- Create TypeScript interfaces for API responses
- Handle loading states for API calls
- Implement proper error handling for API failures
- Use consistent API client structure
- Cache API responses when appropriate 