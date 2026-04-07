# Analisi Tracker - Advanced Medical Analytics Platform

A comprehensive analytics engine for medical lab test data with **multi-patient support**, **PDF processing**, **AI-powered extraction**, and **validation**.

## 🎯 New Features (April 2026)

### Medical PDF Processing System ✨
- **Multi-Patient Support**: Manage lab data for multiple patients in one system
- **AI-Powered Extraction**: Extract lab results from PDFs using Gemini 1.5 Flash
- **OCR Support**: Process scanned PDFs with Tesseract.js
- **Data Validation**: Italian medical reference ranges with automatic flag detection
- **Quality Control**: Extraction reports with success rates and issue tracking
- **Patient Selection UI**: Easy switching between patients

**Quick Start**:
```bash
npm install
export GEMINI_API_KEY="your-api-key"  # Optional but recommended
npm run process:pdfs
```

**Documentation**:
- `docs/QUICK_START.md` - 5-minute setup guide
- `docs/PDF_PROCESSING_GUIDE.md` - Complete system guide
- `docs/IMPLEMENTATION_SUMMARY.md` - Technical details

## Features

### 1. Trend Analysis
- Direction detection (improving, worsening, stable)
- Rate of change calculations (absolute and percentage)
- Statistical significance testing (Mann-Kendall, linear regression)
- Trend strength indicators (R², p-values)
- Seasonal pattern detection

### 2. Correlation Analysis
- Pairwise correlation matrix (Pearson, Spearman)
- Time-lagged correlations (lead/lag relationships)
- Partial correlations (controlling for confounders)
- Dynamic correlation over rolling windows
- Statistical significance testing

### 3. Anomaly Detection
- Z-score based outliers (>3 standard deviations)
- Rate-of-change anomalies (sudden spikes/drops)
- Contextual anomalies (medications, events)
- Persistent abnormality detection
- Multivariate anomaly detection

### 4. Predictive Analytics
- ARIMA time series forecasting
- Linear regression predictions
- Risk stratification (low/medium/high)
- Personalized reference ranges
- Early warning alerts
- What-if scenario modeling

### 5. Statistical Features
- Descriptive statistics (mean, median, SD, percentiles)
- Distribution analysis (normality tests, skewness)
- Time in target range (diabetes metrics)
- Variability metrics (CV, SD)
- Composite scores (kidney function, liver health)

## Architecture

```
analisi-tracker/
├── server/
│   ├── index.js                 # Express server
│   ├── analytics/
│   │   ├── engine.js           # Core calculation engine
│   │   ├── trends.js           # Trend analysis
│   │   ├── correlation.js      # Correlation calculations
│   │   ├── anomalies.js        # Anomaly detection
│   │   ├── prediction.js       # Predictive models
│   │   └── statistics.js       # Statistical functions
│   ├── api/
│   │   ├── analytics.js        # Analytics endpoints
│   │   ├── labs.js             # Lab data CRUD
│   │   └── insights.js         # Insights endpoints
│   ├── cache/
│   │   └── cache-manager.js    # Redis caching
│   └── jobs/
│       └── analytics-queue.js  # Background processing
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── insights/
│   │   │   ├── trends/
│   │   │   ├── correlations/
│   │   │   └── alerts/
│   │   └── services/
│   │       └── analytics.js    # API client
├── data/
│   └── sample-data.json        # Sample lab data
└── tests/
    └── analytics.test.js
```

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Analytics
- `GET /api/analytics/trends/:labTestId` - Get trend analysis
- `GET /api/analytics/correlations` - Get correlation matrix
- `GET /api/analytics/anomalies/:labTestId` - Detect anomalies
- `GET /api/analytics/predictions/:labTestId` - Get predictions
- `GET /api/analytics/statistics/:labTestId` - Get descriptive statistics
- `GET /api/analytics/insights` - Get all insights

### Lab Data
- `GET /api/labs` - Get all lab tests
- `POST /api/labs` - Add lab test results
- `PUT /api/labs/:id` - Update lab test
- `DELETE /api/labs/:id` - Delete lab test

### Export
- `GET /api/export/analytics/:labTestId` - Export as CSV
- `GET /api/export/analytics/:labTestId` - Export as JSON

## Usage Example

```javascript
// Get trend analysis for a specific lab test
const response = await fetch('/api/analytics/trends/creatinine');
const trends = await response.json();

console.log(trends.direction); // "improving" | "worsening" | "stable"
console.log(trends.rateOfChange.absolute); // -0.15 mg/dL per month
console.log(trends.rateOfChange.percentage); // -8.3%
console.log(trends.significance.pValue); // 0.042
console.log(trends.strength.rSquared); // 0.87
```

## Testing

Comprehensive testing suite with unit, integration, and E2E tests.

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:unit

# Run E2E tests
npm run test:e2e

# Watch mode for development
npm run test:watch
```

### Test Structure

- **Unit Tests**: 70% - Individual functions and components
- **Integration Tests**: 20% - API endpoints and module interactions
- **E2E Tests**: 10% - Complete user workflows

### Coverage

- **Current**: 45% (baseline)
- **Target**: 80%+
- **Critical Paths**: 100%

### Documentation

- `TESTING_GUIDE.md` - How to run and write tests
- `TEST_STRATEGY.md` - Overall testing approach
- `COVERAGE_REPORT.md` - Current coverage status
- `tests/TESTING_SUMMARY.md` - Implementation summary

### Technologies

- **Vitest**: Unit and integration tests
- **Playwright**: E2E tests
- **React Testing Library**: Component testing
- **MSW**: API mocking
- **Faker**: Test data generation

## Performance Optimizations

- **Caching**: Redis-based caching for expensive computations
- **Incremental Updates**: Only recompute new data
- **Background Jobs**: Bull queue for async processing
- **Lazy Loading**: Load analytics on-demand
- **Compression**: Gzip compression for API responses

## License

MIT
