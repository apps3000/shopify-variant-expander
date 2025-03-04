# Code Maintenance Guide

This guide provides best practices for maintaining and extending the Shopify Variant Expander app codebase. Following these guidelines will help ensure the application remains maintainable, performant, and reliable.

## Table of Contents

1. [Code Organization](#code-organization)
2. [Coding Standards](#coding-standards)
3. [Adding New Features](#adding-new-features)
4. [Refactoring Guidelines](#refactoring-guidelines)
5. [Testing Requirements](#testing-requirements)
6. [Documentation Guidelines](#documentation-guidelines)
7. [Dependency Management](#dependency-management)
8. [Performance Considerations](#performance-considerations)
9. [Security Best Practices](#security-best-practices)
10. [Version Control Workflow](#version-control-workflow)

## Code Organization

### Backend Structure

The backend follows a modular architecture with clear separation of concerns:

```
server/src/
├── config/         # Configuration management
├── controllers/    # Request handlers
├── middleware/     # Express middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Helper functions
└── index.js        # Entry point
```

**Key Principles:**

- **Single Responsibility**: Each file should have a single, well-defined purpose
- **Dependency Injection**: Pass dependencies explicitly rather than importing within functions
- **Clear Module Boundaries**: Expose only what's necessary via module.exports
- **Separation of Concerns**: Keep routing, business logic, and data access separate

### Frontend Structure

The React frontend follows a component-based architecture:

```
web/src/
├── components/     # Reusable UI components
├── pages/          # Full page components
├── services/       # API clients and external services
├── utils/          # Helper functions
├── hooks/          # Custom React hooks
├── App.jsx         # Main application component
└── index.jsx       # Entry point
```

**Key Principles:**

- **Component Composition**: Build complex UIs from simple components
- **Container/Presentation Pattern**: Separate data management from rendering
- **Custom Hooks**: Extract stateful logic for reuse
- **Consistent Naming**: Use descriptive, consistent component names

### Theme App Extension

```
theme-app-extension/
├── assets/         # JavaScript and CSS files
├── blocks/         # Block definitions
└── extension.json  # Extension configuration
```

**Key Principles:**

- **Minimal Dependencies**: Avoid external libraries where possible
- **Progressive Enhancement**: Ensure basic functionality without JS
- **Isolated Styles**: Prevent styles from affecting the main theme
- **Clear Documentation**: Document all theme integration points

## Coding Standards

### JavaScript/TypeScript

- Use **ESLint** with the provided configuration
- Follow **Prettier** code formatting rules
- Use **modern ES6+ features** (e.g., destructuring, arrow functions)
- Prefer **const** over **let**, and avoid **var**
- Use **async/await** for asynchronous code
- Add **JSDoc comments** for all functions and classes

### React

- Use **functional components** with hooks instead of class components
- Extract **reusable logic** into custom hooks
- Use **PropTypes** or **TypeScript** for component props
- Follow the **React Hook Rules**
- **Memoize** expensive computations and component renders when necessary

### CSS

- Use **BEM naming** convention for CSS classes
- Prefer **CSS in JS** or **CSS Modules** to avoid style conflicts
- Keep selectors **simple and specific**
- Organize properties in **logical groups**
- Use **variables** for colors, spacing, and typography

## Adding New Features

When adding new features, follow this process:

1. **Requirement Definition**: Clearly define what the feature should do
2. **Design**: Create a simple design specification
3. **Implementation Plan**: Break down implementation into small steps
4. **Development**: Code the feature following the project's architecture
5. **Testing**: Write unit tests and integration tests
6. **Documentation**: Update relevant documentation
7. **Code Review**: Request review from another developer
8. **Merge**: Integrate with the main codebase

**Before adding a feature, ask:**

- Does this feature align with the app's core purpose?
- Can it be implemented without adding significant complexity?
- Will it benefit a majority of users?
- Is there a simpler way to achieve the same goal?

## Refactoring Guidelines

When refactoring code, follow these guidelines:

1. **Small, Incremental Changes**: Make small, targeted improvements
2. **Test Coverage**: Ensure solid test coverage before refactoring
3. **Maintain Behavior**: Refactoring should not change behavior
4. **Verify Improvements**: Document performance or maintainability benefits
5. **Review**: Get a second pair of eyes on significant refactors

**Common Refactoring Targets:**

- **Duplicate Code**: Extract into shared functions or components
- **Long Functions**: Break into smaller, focused functions
- **Complex Conditions**: Simplify conditional logic
- **Large Components**: Decompose into smaller components
- **Unclear Intent**: Improve naming and documentation

## Testing Requirements

The following tests are required for all code changes:

### Unit Tests

- Test individual functions and components in isolation
- Mock external dependencies
- Focus on business logic and edge cases
- Use Jest for JavaScript testing

### Integration Tests

- Test interaction between multiple components
- Focus on API communication and data flow
- Use Supertest for API endpoints

### End-to-End Tests

- Test complete user flows
- Focus on critical paths like installation and configuration
- Use Cypress for browser-based testing

**Test Coverage Requirements:**

- **New Features**: At least 80% line coverage
- **Critical Paths**: 100% coverage for authentication and data processing
- **Bug Fixes**: Test that specifically verifies the fix

## Documentation Guidelines

All code should be documented according to these guidelines:

### Code Documentation

- **Public APIs**: Full JSDoc documentation with types and examples
- **Internal Functions**: Brief description of purpose and behavior
- **Complex Logic**: Explanation of algorithms and decisions
- **Classes**: Purpose, methods, and usage examples

### User Documentation

- **Feature Guides**: Step-by-step instructions for user features
- **Configuration Options**: Detailed explanation of settings
- **Troubleshooting**: Common issues and solutions
- **FAQs**: Responses to common questions

### Development Documentation

- **Architecture**: High-level design and component interaction
- **Environment Setup**: Steps to set up development environment
- **Workflows**: Processes for common development tasks
- **Deployment**: Instructions for deploying the application

## Dependency Management

Follow these guidelines for managing dependencies:

- **Minimize Dependencies**: Only add dependencies when they provide significant value
- **Evaluate Thoroughly**: Check license, size, maintenance status, and security
- **Pin Versions**: Use exact versions for production dependencies
- **Regular Updates**: Schedule regular updates of dependencies
- **Vulnerability Scanning**: Use npm audit or similar tools
- **Bundle Analysis**: Regularly check bundle size impact

## Performance Considerations

When writing or modifying code, consider these performance factors:

### Frontend Performance

- **Bundle Size**: Keep JavaScript bundle size minimal
- **Lazy Loading**: Load components and data only when needed
- **Rendering Optimization**: Use React.memo, useMemo, and useCallback
- **Animation Performance**: Use CSS transitions and requestAnimationFrame
- **Memory Management**: Clean up event listeners and subscriptions

### Backend Performance

- **Query Optimization**: Ensure database queries are efficient
- **Caching**: Cache expensive operations and frequent requests
- **Response Size**: Minimize data sent over the network
- **Async Processing**: Use queues for long-running tasks
- **Resource Pooling**: Reuse connections and resources

## Security Best Practices

Follow these security practices in all code changes:

- **Input Validation**: Validate and sanitize all user inputs
- **Output Encoding**: Encode output to prevent XSS
- **Authentication**: Properly verify user identity
- **Authorization**: Check permissions for all operations
- **Secure Headers**: Set appropriate security headers
- **Auditing**: Log security-relevant events
- **Dependency Scanning**: Regularly check for vulnerabilities
- **Data Minimization**: Only collect and store necessary data

## Version Control Workflow

Follow this git workflow:

- **Main Branch**: Production-ready code
- **Develop Branch**: Latest development work
- **Feature Branches**: One branch per feature or fix
- **Pull Requests**: Required for all changes
- **Code Review**: At least one review required
- **CI Checks**: Must pass before merging
- **Semantic Versioning**: Follow semver principles
- **Commit Messages**: Use conventional commit format

**Commit Message Format:**

```
type(scope): short description

Detailed explanation if necessary
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation change
- `style`: Formatting, missing semi-colons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools
