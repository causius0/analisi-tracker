# Test Strategy

Comprehensive testing strategy for the analisi-tracker application to ensure reliability, maintainability, and confidence in deployments.

## Overview

This document outlines the overall testing approach, including what we test, how we test it, and why. The goal is to achieve high confidence in the codebase while keeping tests maintainable and fast.

## Testing Pyramid

We follow the testing pyramid model:

```
           E2E Tests (10%)
          /              \
     Integration Tests (20%)
    /                        \
Unit Tests (70%)
```

### Unit Tests (70%)
- **What**: Test individual functions, components, and modules in isolation
- **Speed**: Very fast (milliseconds)
- **Coverage**: 80%+ code coverage target
- **Examples**:
  - Statistical calculation functions
  - Data validation logic
  - React component rendering
  - Utility functions

### Integration Tests (20%)
- **What**: Test how multiple modules work together
- **Speed**: Fast to moderate (seconds)
- **Coverage**: All critical paths and API endpoints
- **Examples**:
  - API endpoints with database
  - Analytics engine with data processing
  - Multi-component workflows

### E2E Tests (10%)
- **What**: Test complete user workflows from UI to backend
- **Speed**: Slow (seconds to minutes)
- **Coverage**: Main user workflows only
- **Examples**:
  - User registration and login
  - Lab data entry and visualization
  - PDF upload and processing

## Test Categories

### 1. Unit Tests

#### Backend Unit Tests
- **Location**: Co-located with source files (e.g., `server/utils/data-validator.test.js`)
- **Framework**: Vitest
- **Focus**:
  - Pure functions (no side effects)
  - Data transformations
  - Validation logic
  - Statistical calculations

**Example Tests**:
- Data validator: normalize test names, validate lab results, detect anomalies
- Statistics: mean, median, standard deviation, outliers
- Analytics: trend calculations, correlation analysis, predictions

#### Frontend Unit Tests
- **Location**: Co-located with source files (e.g., `client/src/utils/cn.test.ts`)
- **Framework**: Vitest + React Testing Library
- **Focus**:
  - Component rendering
  - User interactions
  - State management
  - Utility functions

**Example Tests**:
- Utilities: className merging, date formatting, calculations
- Components: button clicks, form validation, data display
- Hooks: custom hooks behavior
- State: Zustand store actions

### 2. Integration Tests

#### API Integration Tests
- **Location**: `server/api/*.test.js`
- **Framework**: Vitest + Supertest
- **Focus**:
  - Request/response handling
  - Error handling
  - Authentication/authorization
  - Data persistence

**Example Tests**:
- Analytics endpoints: trends, correlations, predictions
- Lab results CRUD operations
- Patient management
- PDF upload/download

#### Database Integration Tests
- **Framework**: Vitest + Test database
- **Focus**:
  - Database queries
  - Data integrity
  - Transactions
  - Migrations

### 3. End-to-End Tests

#### User Workflows
- **Location**: `tests/e2e/*.spec.ts`
- **Framework**: Playwright
- **Focus**:
  - Critical user paths
  - Multi-page workflows
  - Data visualization
  - Error recovery

**Example Workflows**:
1. **Authentication**:
   - User registration
   - Login/logout
   - Password reset
   - Session management

2. **Lab Data Management**:
   - Add new lab result
   - Edit existing result
   - Delete with confirmation
   - Filter and search
   - Export data

3. **Patient Management**:
   - Switch between patients
   - Add new patient
   - Data isolation

4. **Analytics & Visualization**:
   - View trends chart
   - Check correlations
   - Review anomalies
   - See predictions

5. **PDF Handling**:
   - Upload encrypted PDF
   - Download and decrypt
   - Share with expiration

## Test Data Management

### Factories
Use factory functions to generate realistic test data:

```typescript
// Patient factory
const patient = patientFactory({
  name: 'John Doe',
  gender: 'male'
});

// Lab result factory
const labResults = createMultipleLabResults(5, {
  patientId: 'patient-123',
  testName: 'Complete Blood Count'
});
```

### Fixtures
Use fixtures for static test data that doesn't change:

```typescript
const mockPatients = [
  { id: '1', name: 'John Doe', gender: 'male' },
  { id: '2', name: 'Jane Smith', gender: 'female' }
];
```

### Database Seeding
Seed test database with consistent data for integration tests:

```javascript
beforeEach(async () => {
  await seedTestDatabase();
});

afterEach(async () => {
  await clearTestDatabase();
});
```

## Mocking Strategy

### When to Mock
- **External APIs**: Always mock (unreliable, slow, or paid)
- **Database**: Don't mock for integration tests, use test database
- **Time**: Mock for consistent test results
- **Random Values**: Mock for deterministic tests

### MSW (Mock Service Worker)
Use MSW for API mocking in unit/integration tests:

```typescript
import { server } from '@tests/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Coverage Goals

### Minimum Coverage Thresholds
- **Overall**: 80% coverage
- **Critical Paths**: 100% coverage
- **Utilities**: 90%+ coverage
- **Components**: 75%+ coverage

### Coverage Categories
1. **Statements**: Percentage of executable statements run
2. **Branches**: Percentage of conditional branches tested
3. **Functions**: Percentage of functions called
4. **Lines**: Percentage of lines executed

### What Not to Test
- Configuration files
- Type definitions (TypeScript)
- Simple getters/setters
- Auto-generated code
- Third-party libraries

## Performance Testing

### Load Testing
Test application performance under load:
- API response times
- Database query performance
- Chart rendering performance
- Large dataset handling

### Performance Budgets
- API endpoints: < 500ms (p95)
- Page load: < 3s (3G)
- Time to Interactive: < 5s
- Chart rendering: < 100ms

## Security Testing

### Security Tests
- Input validation
- SQL injection prevention
- XSS prevention
- CSRF protection
- Authentication/authorization
- Rate limiting
- Data encryption

### Tools
- OWASP ZAP for vulnerability scanning
- Custom security test suites
- Dependency vulnerability scanning

## Accessibility Testing

### A11y Tests
Ensure accessibility for all users:
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus management
- ARIA labels

### Tools
- axe-core for automated testing
- Manual testing with screen readers
- Browser accessibility tools

## Continuous Integration

### CI Pipeline
1. **Lint**: Run ESLint
2. **Unit Tests**: Fast feedback on code changes
3. **Integration Tests**: Verify module interactions
4. **E2E Tests**: Verify critical user paths
5. **Coverage Report**: Ensure coverage thresholds met
6. **Security Scan**: Check for vulnerabilities

### Parallel Execution
Run tests in parallel to reduce CI time:
- Unit tests: 4-8 threads
- Integration tests: 2-4 threads
- E2E tests: 3-5 browsers in parallel

## Test Maintenance

### Review Schedule
- **Weekly**: Review failed tests and flaky tests
- **Monthly**: Update test documentation and best practices
- **Quarterly**: Review and update test strategy

### Dealing with Flaky Tests
1. Identify root cause (timing, state, async issues)
2. Add proper waits and assertions
3. Use retries only for network-dependent tests
4. Disable and file issue if can't fix quickly

### Test Debt
Track and manage test debt:
- Prioritize fixing failing tests
- Update deprecated test patterns
- Remove obsolete tests
- Refactor duplicated test code

## Metrics and KPIs

### Key Metrics
- **Test Coverage**: Percentage of code covered
- **Test Execution Time**: How long tests take to run
- **Flaky Test Rate**: Percentage of tests that fail intermittently
- **Test Pass Rate**: Percentage of tests that pass
- **Time to Fix**: Average time to fix failing tests

### Goals
- Coverage: > 80%
- Execution time: < 5 minutes for full suite
- Flaky test rate: < 2%
- Pass rate: > 98%

## Documentation

### Test Documentation
1. **TESTING_GUIDE.md**: How to run and write tests
2. **TEST_STRATEGY.md**: This document - overall approach
3. **COVERAGE_REPORT.md**: Current coverage status (auto-generated)
4. **Inline Comments**: Explain complex test scenarios

### Code Examples
Maintain a collection of test examples for common scenarios:
- Testing async functions
- Testing React components
- Testing API endpoints
- Testing with mocks
- E2E test patterns

## Tools and Technologies

### Testing Frameworks
- **Vitest**: Unit and integration tests (fast, modern)
- **Playwright**: E2E tests (reliable, multi-browser)
- **React Testing Library**: Component testing (user-centric)

### Supporting Tools
- **MSW**: API mocking
- **Faker**: Test data generation
- **Supertest**: HTTP testing
- **Codecov**: Coverage reporting

### CI/CD
- **GitHub Actions**: CI/CD pipeline
- **Parallel Execution**: Faster test runs
- **Artifact Upload**: Test reports and screenshots

## Conclusion

This testing strategy ensures:

1. **Fast Feedback**: Quick test execution for rapid development
2. **High Confidence**: Comprehensive coverage of critical paths
3. **Maintainability**: Clear, well-organized tests
4. **Reliability**: Minimal flaky tests and false positives
5. **User Focus**: E2E tests mirror real user workflows

By following this strategy, we maintain high code quality while keeping development velocity high.
