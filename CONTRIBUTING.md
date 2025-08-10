# Contributing to My Agents Platform

Thank you for your interest in contributing to My Agents Platform! This document provides guidelines and information for contributors.

## 🎯 Project Goals

My Agents Platform is designed to be:
- **Open Source**: Free for non-commercial use and learning
- **Community-Driven**: Built with contributions from developers worldwide
- **Internal Tools Focused**: Optimized for internal organizational use
- **Educational**: Great for learning modern web development and AI integration

## 📋 Before You Start

### License Understanding
This project uses a **MIT License with Non-Commercial Use Restriction**. Please ensure you understand:
- ✅ You can use this for personal projects, learning, and internal tools in any organization
- ✅ You can self-host the software for internal use only
- ❌ Building SaaS applications or hosting for third parties is prohibited
- ❌ Commercial use requires separate licensing
- 📧 Contact us for commercial licensing inquiries

### Code of Conduct
We are committed to providing a welcoming and inspiring community for all. Please:
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Report any inappropriate behavior

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Basic knowledge of React, TypeScript, and Next.js

### Getting Started
```bash
# Fork and clone the repository
git clone https://github.com/yourusername/my-agents.git
cd my-agents

# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

### Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Configure your environment variables
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## 🎨 Development Guidelines

### Code Style
- **TypeScript**: Use strict TypeScript with proper typing
- **ESLint**: Follow ESLint rules and configurations
- **Prettier**: Use Prettier for code formatting
- **Conventions**: Follow established naming conventions

### Component Guidelines
```typescript
// Use functional components with hooks
import React from 'react';
import { ComponentProps } from './component.types';

export const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Hooks first
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // Handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### File Naming Conventions
- **Components**: `kebab-case.tsx` (e.g., `user-profile.tsx`)
- **Hooks**: `use-kebab-case.ts` (e.g., `use-auth.ts`)
- **Types**: `kebab-case-types.ts` (e.g., `user-types.ts`)
- **Utils**: `kebab-case-utils.ts` (e.g., `date-utils.ts`)

### Git Commit Messages
Use conventional commit format:
```
type(scope): description

feat(auth): add OAuth login support
fix(chat): resolve message rendering issue
docs(readme): update installation instructions
style(components): improve button styling
refactor(hooks): simplify useAuth hook
test(utils): add unit tests for date utils
```

## 🚀 Making Contributions

### Issue Reporting
Before creating an issue, please:
1. Check existing issues for duplicates
2. Use the appropriate issue template
3. Provide clear reproduction steps
4. Include relevant error messages and logs

### Feature Requests
When requesting features:
1. Describe the use case clearly
2. Explain the expected behavior
3. Consider the impact on internal tool users
4. Suggest implementation approach if possible

### Bug Fixes
When fixing bugs:
1. Create a minimal reproduction case
2. Write tests to prevent regression
3. Update documentation if needed
4. Test across different environments

### New Features
When adding features:
1. Ensure they align with internal tool use cases
2. Follow existing patterns and conventions
3. Add comprehensive tests
4. Update documentation
5. Consider accessibility and performance

## 📝 Pull Request Process

### Before Submitting
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes following the guidelines
4. **Test** your changes thoroughly
5. **Update** documentation as needed

### Pull Request Guidelines
1. **Clear Title**: Descriptive title for the PR
2. **Detailed Description**: Explain what and why, not how
3. **Screenshots**: Include screenshots for UI changes
4. **Tests**: Ensure all tests pass
5. **Documentation**: Update relevant documentation

### Review Process
Your PR will be reviewed for:
- **Code Quality**: Follows best practices
- **Functionality**: Works as expected
- **Performance**: No performance regressions
- **Accessibility**: Meets accessibility standards
- **Security**: No security vulnerabilities
- **Documentation**: Properly documented

## 🧪 Testing

### Test Types
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test user workflows
- **Accessibility Tests**: Ensure accessibility compliance

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Writing Tests
```typescript
import { render, screen } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName prop1="value" />);
    expect(screen.getByText('expected text')).toBeInTheDocument();
  });
});
```

## 📚 Documentation

### Code Documentation
- **JSDoc**: Use JSDoc for function documentation
- **TypeScript**: Leverage TypeScript for type documentation
- **Comments**: Add comments for complex logic
- **README**: Update README for new features

### User Documentation
- **User Guides**: Create guides for new features
- **API Documentation**: Document API changes
- **Screenshots**: Include screenshots for UI changes
- **Examples**: Provide usage examples

## 🎯 Areas for Contribution

### High Priority
- **Bug Fixes**: Critical bugs and issues
- **Accessibility**: Improving accessibility
- **Performance**: Performance optimizations
- **Security**: Security improvements

### Medium Priority
- **New Features**: Internal tool focused features
- **Documentation**: Improving documentation
- **Testing**: Adding test coverage
- **Code Quality**: Refactoring and improvements

### Low Priority
- **UI Polish**: Minor UI improvements
- **Code Style**: Style and formatting changes
- **Examples**: Adding usage examples
- **Tools**: Development tool improvements

## 🆘 Getting Help

### Resources
- **Documentation**: Check the docs first
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions
- **Community**: Join our community channels

### Contact
- **Email**: minhduongkhtn@gmail.com
- **Issues**: [GitHub Issues](https://github.com/yourusername/my-agents/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/my-agents/discussions)

## 🙏 Recognition

### Contributors
All contributors will be recognized in:
- **README**: Listed as contributors
- **Releases**: Mentioned in release notes
- **Documentation**: Credited in documentation
- **Community**: Acknowledged in community channels

### Hall of Fame
Exceptional contributors may be added to our Hall of Fame for:
- **Major Features**: Significant feature contributions
- **Long-term Support**: Sustained contribution over time
- **Community Leadership**: Helping other contributors
- **Innovation**: Creative solutions and ideas

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same MIT License with Non-Commercial Use Restriction as the project.

---

Thank you for contributing to My Agents Platform! Your contributions help make this project better for the entire community. 🚀 