# Contributing to Guardian Platform

Thank you for your interest in contributing to Guardian Platform! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Accept feedback gracefully

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/guardian-platform.git`
3. Add upstream remote: `git remote add upstream https://github.com/sarim2000/guardian-platform.git`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Setup

1. **Prerequisites**
   - Node.js 20+ (use `nvm` for version management)
   - PostgreSQL 14+ with pgvector extension
   - GitHub App credentials (see [setup guide](docs/README.md))
   - Docker and Docker Compose (optional)

2. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Install dependencies
   npm install
   
   # Run database migrations
   npm run db:migrate
   
   # Start development server
   npm run dev
   ```

3. **Verify Setup**
   - Visit http://localhost:3000
   - Check that all pages load correctly
   - Test service discovery functionality

## How to Contribute

### Reporting Bugs

- Check existing issues first
- Use the bug report template
- Include steps to reproduce
- Provide system information
- Include relevant logs

### Suggesting Features

- Check the roadmap and existing issues
- Use the feature request template
- Explain the use case
- Describe expected behavior
- Consider implementation approach

### Code Contributions

1. **Find an Issue**
   - Look for "good first issue" labels
   - Comment on the issue to claim it
   - Ask for clarification if needed

2. **Make Changes**
   - Follow coding standards
   - Write tests for new features
   - Update documentation
   - Keep commits focused and atomic

## Pull Request Process

1. **Before Submitting**
   - Run `npm run lint` and fix any issues
   - Run `npm run build` to ensure production build works
   - Write/update tests as needed
   - Update documentation
   - Add changeset if applicable

2. **PR Guidelines**
   - Use a descriptive title
   - Reference the issue number
   - Describe what changed and why
   - Include screenshots for UI changes
   - List any breaking changes

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Related Issue
   Fixes #(issue number)
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Tests pass locally
   - [ ] Added new tests
   - [ ] Manual testing completed
   
   ## Screenshots (if applicable)
   ```

4. **Review Process**
   - PRs require at least one approval
   - Address review feedback promptly
   - Keep PR scope focused
   - Squash commits before merging

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Prefer functional components in React

### Code Style

```typescript
// Good
export const fetchServices = async (teamId: string): Promise<Service[]> => {
  const response = await fetch(`/api/services?team=${teamId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch services: ${response.statusText}`);
  }
  return response.json();
};

// Avoid
export async function fetch_services(team_id) {
  const res = await fetch('/api/services?team=' + team_id);
  return res.json();
}
```

### Database

- Use Drizzle ORM for database operations
- Create migrations for schema changes
- Use transactions for multi-step operations
- Index frequently queried columns

### React Components

- Use function components with hooks
- Keep components focused and small
- Use Mantine UI components
- Follow accessibility guidelines

## Testing Guidelines

### Unit Tests

```typescript
describe('Service Discovery', () => {
  it('should parse valid service YAML', () => {
    const yaml = `
      kind: Service
      metadata:
        name: test-service
    `;
    const result = parseServiceYaml(yaml);
    expect(result.metadata.name).toBe('test-service');
  });
});
```

### Integration Tests

- Test API endpoints
- Test database operations
- Mock external services
- Use test database

### E2E Tests

- Test critical user flows
- Use Playwright or Cypress
- Run in CI pipeline

## Documentation

### Code Documentation

- Add JSDoc comments for functions
- Document complex algorithms
- Explain business logic
- Include examples

### User Documentation

- Update README for new features
- Add guides to docs folder
- Include screenshots
- Keep language clear and simple

### API Documentation

- Document all endpoints
- Include request/response examples
- Note authentication requirements
- List possible error codes

## Release Process

1. **Version Bumping**
   - Follow semantic versioning
   - Update package.json
   - Update CHANGELOG.md

2. **Release Notes**
   - List new features
   - Note breaking changes
   - Credit contributors

## Getting Help

- Join our Discord: [link]
- Check documentation: [docs](docs/)
- Open a discussion: [GitHub Discussions]
- Email: support@guardian-platform.com

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in documentation

Thank you for contributing to Guardian Platform! 🎉