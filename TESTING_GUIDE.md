# Testing Guide

Complete guide for running, writing, and maintaining tests in the analisi-tracker application.

## Table of Contents

- [Quick Start](#quick-start)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Utilities](#test-utilities)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Node.js 18+ and npm installed
- All project dependencies installed (`npm install`)

### Run All Tests

```bash
# Run all unit and integration tests
npm test

# Run with coverage
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

### Run Specific Tests

```bash
# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run specific test file
npx vitest server/utils/data-validator.test.js

# Run tests matching a pattern
npx vitest --grep "statistics"
```

## Test Structure

```
analisi-tracker/
├── tests/
│   ├── setup.ts                 # Test setup and global configuration
│   ├── mocks/                   # MSW mock handlers
│   │   ├── handlers.ts         # API route mocks
│   │   └── server.ts           # MSW server setup
│   ├── factories/              # Test data factories
│   │   ├── patient.factory.ts
│   │   ├── lab-result.factory.ts
│   │   └── index.ts
│   ├── utils/                  # Test helper functions
│   │   ├── test-helpers.ts
│   │   └── api-helpers.ts
│   └── e2e/                    # End-to-end tests
│       ├── authentication.spec.ts
│       └── lab-data.spec.ts
├── server/                     # Backend tests (co-located)
│   ├── utils/
│   │   └── data-validator.test.js
│   ├── analytics/
│   │   └── statistics.test.js
│   └── api/
│       └── analytics.test.js
└── client/                     # Frontend tests (co-located)
    └── src/
        └── utils/
            └── cn.test.ts
```

## Running Tests

### Unit Tests

Unit tests test individual functions and components in isolation.

```bash
# Run all unit tests with coverage
npm run test:unit

# Run with UI
npm run test:ui

# Watch mode for development
npm run test:watch
```

### Integration Tests

Integration tests test how multiple parts work together.

```bash
# Run integration tests
npm run test:integration

# Run with verbose output
npm run test:integration -- --reporter=verbose
```

### E2E Tests

End-to-end tests test the entire application from the user's perspective.

```bash
# Run all E2E tests
npm run test:e2e

# Run with Playwright UI (for debugging)
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/authentication.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in specific browser
npx playwright test --project=chromium
```

### View Test Results

- **Unit/Integration Tests**: Results appear in terminal and in `test-results/` directory
- **E2E Tests**: Results appear in `playwright-report/` directory
- **Coverage Reports**: Generated in `coverage/` directory (open `coverage/index.html`)

## Writing Tests

### Unit Test Example

```javascript
import { describe, it, expect } from 'vitest';
import { calculateDescriptiveStatistics } from './statistics.js';

describe('Statistics - calculateDescriptiveStatistics', () => {
  it('should calculate basic statistics', () => {
    const values = [1, 2, 3, 4, 5];
    const stats = calculateDescriptiveStatistics(values);

    expect(stats.count).toBe(5);
    expect(stats.mean).toBe(3);
    expect(stats.median).toBe(3);
  });

  it('should throw error for empty array', () => {
    expect(() => calculateDescriptiveStatistics([]))
      .toThrow('Values array is empty');
  });
});
```

### Integration Test Example

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('Analytics API - Trends Endpoint', () => {
  it('should return trend analysis for valid lab test', async () => {
    const response = await request(app)
      .get('/api/analytics/trends/test-123')
      .expect(200);

    expect(response.body).toHaveProperty('trends');
    expect(response.body).toHaveProperty('predictions');
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });
});
```

## Test Utilities

### Data Factories

Generate realistic test data using factories:

```javascript
import { patientFactory, labResultFactory } from '@tests/factories';

// Create a single patient
const patient = patientFactory({
  name: 'John Doe',
  gender: 'male'
});

// Create multiple lab results
const labResults = createMultipleLabResults(5, {
  patientId: 'patient-123'
});
```

### Mock API Handlers

Use MSW to mock API responses:

```javascript
import { createMockHandler } from '@tests/utils/api-helpers';
import { server } from '@tests/mocks/server';

// Add custom handler for a test
server.use(
  createMockHandler('get', '/api/patients', {
    patients: [{ id: '1', name: 'Test' }]
  })
);
```

### Custom Render for React

```javascript
import { renderWithProviders } from '@tests/utils/test-helpers';
import { MyComponent } from './MyComponent';

test('renders component', () => {
  const { getByText } = renderWithProviders(<MyComponent />);
  expect(getByText('Hello')).toBeInTheDocument();
});
```

## Best Practices

### General

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Descriptive Names**: Use clear, descriptive test names that explain what is being tested
3. **Arrange-Act-Assert**: Structure tests in three phases:
   - Arrange: Set up test data and conditions
   - Act: Execute the code being tested
   - Assert: Verify the expected outcome

### Unit Tests

1. **One Assertion Per Test**: Focus on testing one thing at a time
2. **Test Edge Cases**: Test boundary conditions, null values, and error cases
3. **Mock Dependencies**: Mock external dependencies (APIs, databases, etc.)

```javascript
// Good: Focused test
it('should normalize Italian test names to English', () => {
  expect(normalizeTestName('emoglobina')).toBe('hemoglobin');
});

// Bad: Multiple assertions
it('should handle all test names', () => {
  expect(normalizeTestName('emoglobina')).toBe('hemoglobin');
  expect(normalizeTestName('globuli rossi')).toBe('rbc');
  // ... more assertions
});
```

### Integration Tests

1. **Test Real Interactions**: Test actual API endpoints and database interactions
2. **Use Test Database**: Use a separate test database to avoid polluting development data
3. **Clean Up**: Reset database state between tests

### E2E Tests

1. **Focus on User Flows**: Test complete user workflows, not implementation details
2. **Use Page Objects**: Encapsulate page interactions in reusable objects
3. **Wait for Elements**: Use proper wait methods instead of fixed timeouts

```typescript
// Good: Wait for element
await expect(page.getByText('Welcome')).toBeVisible();

// Bad: Fixed timeout
await page.waitForTimeout(1000);
```

### Test Data

1. **Use Factories**: Generate test data programmatically using factories
2. **Avoid Hardcoding**: Use factory methods instead of hardcoded test data
3. **Realistic Data**: Use realistic data that matches production scenarios

## Troubleshooting

### Tests Fail Locally But Pass in CI

1. **Check Environment Variables**: Ensure all required environment variables are set
2. **Database State**: Reset test database between test runs
3. **Timing Issues**: Increase timeouts for slow operations

### Flaky Tests

1. **Race Conditions**: Ensure proper async/await handling
2. **Shared State**: Verify tests are not sharing mutable state
3. **Network Issues**: Mock external API calls in unit/integration tests

### E2E Tests Are Slow

1. **Run in Parallel**: Use Playwright's parallel execution
2. **Skip Unnecessary Tests**: Use `test.skip()` for slow or unstable tests
3. **Use Test Isolation**: Ensure each test cleans up after itself

### Coverage Is Low

1. **Identify Gaps**: Review coverage report to see untested code
2. **Add Edge Cases**: Test error paths and boundary conditions
3. **Test Utilities**: Don't forget to test utility functions

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)

## Getting Help

If you encounter issues:

1. Check existing tests for examples
2. Review documentation for the testing library
3. Ask for help in team channels
4. Create an issue on GitHub with reproduction steps
