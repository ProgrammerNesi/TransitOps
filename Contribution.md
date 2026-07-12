# Contributing to TransitOps

First off, thank you for contributing to **TransitOps**! As a Smart Transport Operations Platform built for efficiency and correctness, we maintain high standards for code quality, architectural consistency, and team alignment.

Please read through the guidelines below before starting your development work.

---

# Branch Naming Conventions

All development must be performed in isolated branches.

Use the following branch prefixes:

| Prefix | Purpose | Example |
|---------|----------|---------|
| `feature/` | New features or business capabilities | `feature/dispatch-rules` |
| `bugfix/` | Fixing defects in existing code | `bugfix/license-validation-timezone` |
| `docs/` | Documentation updates | `docs/architecture-mermaid-update` |
| `refactor/` | Internal code improvements without new functionality | `refactor/express-routing` |
| `test/` | Test additions or improvements | `test/maintenance-triggers` |
| `chore/` | Dependency updates, tooling, configs, build scripts | `chore/prisma-schema-update` |

---

# Commit Message Standards

TransitOps follows the **Conventional Commits Specification (v1.0.0)**.

## Format

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Supported Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | Introduces a new user-facing capability | `feat(dispatch): validate driver duty hours before trip` |
| `fix` | Resolves a bug | `fix(registry): allow alphanumeric vehicle plate registrations` |
| `docs` | Documentation-only changes | `docs: add roadmap outline` |
| `style` | Formatting or whitespace changes only | `style: format service files` |
| `refactor` | Improves code structure without changing behavior | `refactor(auth): simplify JWT middleware` |
| `perf` | Performance improvements | `perf(cache): optimize route lookup` |
| `test` | Adds or updates tests | `test(dispatch): add validation test cases` |
| `chore` | Build tools, dependencies, or maintenance | `chore: update Prisma dependencies` |

---

# Pull Request Workflow

Follow these steps before opening a Pull Request.

## 1. Pull the Latest Changes

Sync your local development branch with the latest changes from the remote repository.

## 2. Create a Branch

Create a new branch using the appropriate prefix.

Example:

```bash
git checkout -b feature/dispatch-engine
```

## 3. Implement Your Changes

- Keep commits focused and small.
- Avoid committing temporary debugging code.
- Follow project architecture and coding standards.

## 4. Run Formatting & Linting

Execute all formatting and linting tools before committing.

## 5. Write Tests

Add or update unit and integration tests for your changes.

## 6. Push and Open a Pull Request

Push your branch to the remote repository and create a Pull Request.

## 7. Code Review

At least one core team member must approve the Pull Request before merging.

## 8. Merge

Use **Squash and Merge** to maintain a clean commit history.

---

# Code Quality Expectations

## DRY Principles

- Avoid duplicate logic.
- Extract reusable validation into shared services or helpers.

## TypeScript

- Use strict typing.
- Avoid `any` unless absolutely necessary.
- Prefer interfaces and type aliases where appropriate.

## Error Handling

- Use structured `try/catch` blocks.
- Return meaningful HTTP status codes.
- Return structured JSON error responses.

Example:

```json
{
  "success": false,
  "message": "Vehicle not found",
  "errorCode": "VEHICLE_NOT_FOUND"
}
```

## Middleware Security

Secure every:

- REST API route
- Socket.IO namespace

using:

- JWT Authentication
- Role-Based Access Control (RBAC)

---

# Testing Expectations

## Automated Verification

Every:

- new feature
- business rule
- validation logic

must include corresponding automated tests.

## Coverage

Maintain high coverage, especially around:

- Validation engines
- Scheduling logic
- Compliance calculators

## Pre-commit Checks

Ensure the following pass locally before pushing:

- Unit tests
- Integration tests
- Linting
- Type checking

---

# Documentation Requirements

## API Documentation

Document all newly added endpoints including:

- Request payload
- Response payload
- Status codes
- Validation rules

## JSDoc

Use clear JSDoc comments for complex logic, particularly:

- Scoring engines
- Compliance calculations
- Dispatch optimization
- Scheduling algorithms

## README Updates

Whenever adding or modifying:

- Environment variables
- Configuration options
- Setup instructions

update the project **README.md** accordingly.

---

# General Best Practices

- Follow the existing project architecture.
- Keep Pull Requests focused and reasonably small.
- Write readable and maintainable code.
- Remove unused imports and dead code.
- Never commit secrets, API keys, or credentials.
- Ensure CI pipelines pass before requesting review.
- Prefer reusable services over duplicated business logic.
- Use meaningful variable, function, and class names.

---

# Contribution Checklist

Before opening a Pull Request, ensure the following:

- [ ] Branch follows the correct naming convention.
- [ ] Commit messages follow Conventional Commits.
- [ ] Code is formatted.
- [ ] Linting passes.
- [ ] Type checking passes.
- [ ] Unit tests pass.
- [ ] Integration tests pass (if applicable).
- [ ] No debug statements remain.
- [ ] Documentation has been updated.
- [ ] README updated (if configuration changed).
- [ ] PR is ready for review.

---

Thank you for helping improve **TransitOps** and maintaining a high-quality, reliable codebase!