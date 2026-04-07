# Contributing to Analisi Tracker

Thank you for your interest in contributing to Analisi Tracker! This document provides guidelines and instructions for contributing.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Standards](#documentation-standards)
- [Pull Request Process](#pull-request-process)
- [Community Guidelines](#community-guidelines)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:
- Age
- Body size
- Disability
- Ethnicity
- Gender identity and expression
- Level of experience
- Nationality
- Personal appearance
- Race
- Religion
- Sexual identity and orientation

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Harassment, trolling, or derogatory comments
- Personal or political attacks
- Public or private harassment
- Publishing others' private information
- Any other unethical or unprofessional conduct

### Reporting Issues

If you experience or witness unacceptable behavior, please contact us at conduct@analisi-tracker.com. All reports will be reviewed and investigated.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

```bash
# Required Software
Node.js >= 18.0.0
npm >= 9.0.0
Git >= 2.30.0

# Optional but Recommended
Docker >= 20.10.0
PostgreSQL >= 14.0
Redis >= 6.0
```

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork**:

```bash
git clone https://github.com/YOUR_USERNAME/analisi-tracker.git
cd analisi-tracker
```

3. **Add upstream remote**:

```bash
git remote add upstream https://github.com/analisi-tracker/analisi-tracker.git
```

### Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies (if working on frontend)
cd client && npm install && cd ..
```

### Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# At minimum, set:
# - PORT
# - NODE_ENV=development
# - Any API keys needed
```

### Run Development Server

```bash
# Start both server and client
npm run dev

# Or start individually
npm run server:dev  # Backend only
npm run client:dev  # Frontend only
```

### Verify Setup

1. Open http://localhost:3000
2. Check health endpoint: http://localhost:3000/health
3. Run tests: `npm test`

---

## Development Workflow

### Branch Strategy

We use a simplified Git flow:

```
main          → Production-ready code
develop       → Integration branch for features
feature/*     → New features
bugfix/*      → Bug fixes
hotfix/*      → Urgent production fixes
docs/*        → Documentation changes
```

### Creating a Feature Branch

1. **Ensure your develop is up-to-date**:

```bash
git checkout develop
git pull upstream develop
```

2. **Create feature branch**:

```bash
git checkout -b feature/your-feature-name
```

3. **Make changes** and commit regularly

4. **Push to your fork**:

```bash
git push origin feature/your-feature-name
```

### Commit Message Format

We follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Examples:**

```bash
# Feature
git commit -m "feat(analytics): add ARIMA prediction model"

# Bug fix
git commit -m "fix(pdf): correct OCR text extraction for Italian reports"

# Documentation
git commit -m "docs(api): update authentication flow examples"
```

### Keeping Your Branch Updated

```bash
# Fetch upstream changes
git fetch upstream

# Rebase your branch on develop
git checkout feature/your-feature
git rebase upstream/develop

# If conflicts occur, resolve them then:
git rebase --continue
```

---

## Coding Standards

### JavaScript (ES6+)

**Follow Airbnb Style Guide** with modifications:

```javascript
// ✅ Good
const calculateTrend = (dataPoints, options = {}) => {
  const { method = 'linear', significance = 0.05 } = options;

  if (!dataPoints || dataPoints.length < 5) {
    throw new Error('Insufficient data points');
  }

  return analyzeTrend(dataPoints, method);
};

// ❌ Bad
function calculateTrend(dataPoints, options) {
  var method = options.method;
  // ...
}
```

**Key rules:**
- Use `const` by default, `let` if reassignment needed
- Avoid `var`
- Use arrow functions for callbacks
- Destructure objects and arrays
- Use template literals for string concatenation
- Prefer async/await over promises
- Handle errors appropriately

### File Naming

```
// Components: PascalCase
TrendAnalysis.js
PatientSelector.jsx

// Utilities: camelCase
dateFormatter.js
apiClient.js

// Constants: UPPER_SNAKE_CASE
API_ENDPOINTS.js
REFERENCE_RANGES.js

// Tests: camelCase with .test.js
trends.test.js
apiClient.test.js
```

### Project Structure

```
server/
├── analytics/
│   ├── engine.js          # Main orchestrator
│   ├── statistics.js      # Statistical functions
│   ├── trends.js          # Trend analysis
│   ├── correlation.js     # Correlation calculations
│   ├── anomalies.js       # Anomaly detection
│   └── prediction.js      # Predictive models
├── api/
│   └── analytics.js       # API endpoints
├── cache/
│   └── cache-manager.js   # Caching layer
├── utils/
│   └── data-validator.js  # Validation utilities
└── index.js               # Server entry point
```

### Error Handling

```javascript
// ✅ Good: Specific errors
class InsufficientDataError extends Error {
  constructor(minimum, actual) {
    super(`Insufficient data: need ${minimum}, got ${actual}`);
    this.name = 'InsufficientDataError';
    this.statusCode = 400;
  }
}

// ✅ Good: Try-catch with logging
async function analyzeData(data) {
  try {
    const result = await performAnalysis(data);
    return { success: true, data: result };
  } catch (error) {
    logger.error('Analysis failed', { error: error.message, data });
    return { success: false, error: error.message };
  }
}

// ❌ Bad: Silent failures
function analyzeData(data) {
  try {
    // ...
  } catch (error) {
    // Do nothing
  }
}
```

### Comments and Documentation

```javascript
/**
 * Calculates trend analysis for lab test data
 *
 * @param {Array<Object>} dataPoints - Array of lab test results
 * @param {string} dataPoints[].date - ISO date string
 * @param {number} dataPoints[].value - Lab test value
 * @param {Object} options - Analysis options
 * @param {string} [options.method='linear'] - Trend detection method
 * @param {number} [options.significance=0.05] - Statistical significance level
 *
 * @returns {Promise<Object>} Trend analysis results
 * @throws {InsufficientDataError} If less than 5 data points provided
 *
 * @example
 * const trends = await calculateTrend([
 *   { date: '2026-01-01', value: 100 },
 *   { date: '2026-02-01', value: 95 },
 *   { date: '2026-03-01', value: 90 }
 * ], { method: 'linear' });
 */
async function calculateTrend(dataPoints, options = {}) {
  // Implementation...
}
```

### Performance Considerations

```javascript
// ✅ Good: Efficient algorithms
function findAnomalies(data) {
  // O(n) single pass
  const mean = calculateMean(data);
  const std = calculateStd(data);
  return data.filter(point =>
    Math.abs((point - mean) / std) > 3
  );
}

// ❌ Bad: Inefficient nested loops
function findAnomalies(data) {
  // O(n²) nested loops
  return data.filter(point1 => {
    return data.every(point2 => {
      // ...
    });
  });
}

// ✅ Good: Use caching
const memoized = require('lodash/memoize');
const expensiveCalculation = memoize((input) => {
  // Expensive computation
});
```

---

## Testing Guidelines

### Test Structure

```javascript
// tests/analytics/trends.test.js
describe('Trend Analysis', () => {
  describe('calculateTrend', () => {
    it('should detect decreasing trend', async () => {
      const data = [
        { date: '2026-01-01', value: 100 },
        { date: '2026-02-01', value: 90 },
        { date: '2026-03-01', value: 80 }
      ];

      const result = await calculateTrend(data);

      expect(result.direction).toBe('decreasing');
      expect(result.rateOfChange.percentage).toBeLessThan(0);
    });

    it('should throw error for insufficient data', async () => {
      const data = [
        { date: '2026-01-01', value: 100 },
        { date: '2026-02-01', value: 90 }
      ];

      await expect(calculateTrend(data))
        .rejects
        .toThrow('Insufficient data');
    });
  });
});
```

### Test Coverage Goals

- **Overall**: >80% coverage
- **Core analytics**: >90% coverage
- **API endpoints**: >85% coverage
- **Utilities**: >95% coverage

Check coverage:
```bash
npm test -- --coverage
```

### Writing Good Tests

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Test edge cases**: Empty data, single value, outliers
5. **Mock external dependencies**: APIs, databases
6. **Use fixtures**: Reusable test data

```javascript
// ✅ Good: Behavior-focused
it('should return risk level based on z-score', () => {
  const result = assessRisk({ zScore: 4.5 });
  expect(result.riskLevel).toBe('high');
});

// ❌ Bad: Implementation-focused
it('should set riskLevel to "high" when zScore > 4', () => {
  const result = assessRisk({ zScore: 4.5 });
  expect(result.riskLevel).toBe('high');
});
```

---

## Documentation Standards

### Code Documentation

Every function should have JSDoc:

```javascript
/**
 * Brief description
 *
 * Detailed description if needed
 *
 * @param {Type} param - Description
 * @returns {Type} Description
 * @throws {ErrorType} Description
 *
 * @example
 * const result = functionName(args);
 */
function functionName(param) {
  // ...
}
```

### README Updates

When adding features:
1. Update main README with feature overview
2. Add example usage
3. Update API documentation
4. Add screenshots (if UI change)

### API Documentation

Update API_DOCUMENTATION.md with:
- New endpoints
- Parameter changes
- Response format changes
- Example requests/responses

---

## Pull Request Process

### Before Submitting

1. **Run tests**: `npm test` (all must pass)
2. **Lint code**: `npm run lint` (no errors)
3. **Update docs**: README, API docs, comments
4. **Add tests**: For new features/bug fixes
5. **Update CHANGELOG.md**: Add entry under "Unreleased"

### Submitting a Pull Request

1. **Push to your fork**
2. **Create PR on GitHub** targeting `develop`
3. **Fill PR template**:
   - Description of changes
   - Related issues
   - Testing steps
   - Screenshots (if applicable)
4. **Wait for review** (usually within 48 hours)

### PR Review Criteria

- **Code quality**: Follows style guide
- **Functionality**: Works as intended
- **Tests**: Adequate coverage
- **Documentation**: Updated and clear
- **Performance**: No significant regressions
- **Security**: No vulnerabilities introduced

### Addressing Review Feedback

1. **Make requested changes**
2. **Push to same branch**
3. **Request re-review** (leave comment on PR)
4. **Respond to all review comments**

### Merging

PRs are merged after:
- At least one approval
- All tests passing
- No merge conflicts
- Documentation updated

Maintainers will:
- Squash commits for merge
- Delete branch after merge
- Update CHANGELOG

---

## Community Guidelines

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas
- **Discord**: Real-time chat (contributors only)
- **Email**: core@analisi-tracker.com (sensitive issues only)

### Asking for Help

1. **Search existing issues** first
2. **Check documentation**
3. **Create GitHub Discussion** for questions
4. **Be specific**: Include code, errors, steps to reproduce

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email security@analisi-tracker.com
2. Include details and reproduction steps
3. Wait for response (within 24 hours)
4. We'll work with you on responsible disclosure

### Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Annual community post

### Types of Contributions

We welcome all types:
- **Code**: Features, bug fixes, tests
- **Documentation**: Guides, examples, API docs
- **Design**: UI/UX improvements
- **Bug reports**: Well-documented issues
- **Feature requests**: Thoughtful proposals
- **Code review**: Feedback on PRs

---

## Developer Certificate of Origin (DCO)

By contributing, you agree to the DCO:

```
Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.
```

This is affirmed by adding a `Signed-off-by` line to commit messages:

```bash
git commit -s -m "feat: add new feature"
```

---

## Getting Help

### Resources

- **Documentation**: /docs directory
- **API Reference**: /docs/api/API_REFERENCE.md
- **Examples**: /examples directory
- **Existing Issues**: GitHub Issues tab

### Contact

- **General questions**: GitHub Discussions
- **Bug reports**: GitHub Issues
- **Security issues**: security@analisi-tracker.com
- **Core team**: core@analisi-tracker.com

---

## License

By contributing, you agree that your contributions will be licensed under the **MIT License**, the same license as the project.

---

Thank you for contributing to Analisi Tracker! 🎉

---

**Version**: 1.0.0
**Last Updated**: April 2026
