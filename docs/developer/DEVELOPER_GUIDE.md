# Analisi Tracker - Developer Guide

Complete guide for developers working on Analisi Tracker.

## Table of Contents
- [Development Environment](#development-environment)
- [Project Architecture](#project-architecture)
- [Core Analytics Modules](#core-analytics-modules)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)

---

## Development Environment

### Prerequisites

```bash
# Required
Node.js >= 18.0.0
npm >= 9.0.0
Git >= 2.30.0

# Optional (for full development)
PostgreSQL >= 14.0
Redis >= 6.0
Docker >= 20.10.0
```

### Initial Setup

```bash
# Clone repository
git clone https://github.com/analisi-tracker/analisi-tracker.git
cd analisi-tracker

# Install dependencies
npm install
cd client && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run development server
npm run dev
```

### Environment Variables

See [ENVIRONMENT_VARIABLES.md](../deployment/ENVIRONMENT_VARIABLES.md) for complete list.

**Minimum required for development:**
```bash
PORT=3000
NODE_ENV=development
```

### IDE Configuration

**VS Code** (recommended):
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "javascript.preferences.importModuleSpecifier": "relative"
}
```

**Recommended Extensions:**
- ESLint
- Prettier
- GitLens
- REST Client (for API testing)

---

## Project Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│                     (React + Vite)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │   Charts     │  │   Tables     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Express)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  API Layer   │  │   Analytics  │  │    Cache     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────┬───────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
    ┌─────────┐         ┌─────────┐         ┌─────────┐
    │  File   │         │ Redis   │         │  PostgreSQL│
    │ Storage │         │  Cache  │         │  (future)  │
    └─────────┘         └─────────┘         └─────────┘
```

### Directory Structure

```
analisi-tracker/
├── server/                          # Backend
│   ├── index.js                     # Express app entry point
│   ├── analytics/                   # Analytics engine
│   │   ├── engine.js               # Main orchestrator
│   │   ├── statistics.js           # Statistical functions
│   │   ├── trends.js               # Trend analysis
│   │   ├── correlation.js          # Correlation calculations
│   │   ├── anomalies.js            # Anomaly detection
│   │   └── prediction.js           # Predictive models
│   ├── api/
│   │   └── analytics.js            # API endpoints
│   ├── cache/
│   │   └── cache-manager.js        # Caching layer
│   ├── utils/
│   │   └── data-validator.js       # Validation utilities
│   └── jobs/
│       └── analytics-queue.js      # Background jobs
│
├── client/                          # Frontend (React)
│   ├── src/
│   │   ├── components/             # React components
│   │   ├── services/               # API client
│   │   ├── pages/                  # Page components
│   │   ├── hooks/                  # Custom hooks
│   │   ├── stores/                 # State management
│   │   └── utils/                  # Utilities
│   └── package.json
│
├── data/                           # Sample data
│   ├── sample-data.json
│   └── lab-data-complete.json
│
├── scripts/                        # Utility scripts
│   ├── test-analytics.js
│   └── process-pdfs.js
│
├── tests/                          # Test files
│   └── analytics.test.js
│
├── docs/                           # Documentation
│   ├── user/                      # User guides
│   ├── developer/                 # Developer docs
│   ├── api/                       # API docs
│   └── deployment/                # Deployment guides
│
├── package.json                    # Root package.json
├── .env.example                    # Environment template
└── README.md                       # Main README
```

---

## Core Analytics Modules

### Analytics Engine (`engine.js`)

Main orchestrator that coordinates all analytics.

**Key Function:**
```javascript
async function analyzeSingleLabTest(data, options) {
  // 1. Validate data
  // 2. Calculate statistics
  // 3. Detect trends
  // 4. Find anomalies
  // 5. Generate predictions
  // 6. Create insights
  // 7. Return comprehensive analysis
}
```

### Statistics Module (`statistics.js`)

Provides fundamental statistical operations.

**Key Functions:**
```javascript
// Descriptive statistics
calculateMean(data)
calculateMedian(data)
calculateStandardDeviation(data)
calculatePercentiles(data, percentile)

// Distribution analysis
testNormality(data)
calculateSkewness(data)
calculateKurtosis(data)

// Confidence intervals
calculateConfidenceInterval(data, confidence = 0.95)

// Time in range
calculateTimeInRange(data, min, max)
```

### Trends Module (`trends.js`)

Detects and analyzes trends in time series data.

**Key Functions:**
```javascript
// Main trend analysis
calculateTrend(data, options)

// Trend detection methods
linearRegression(data)
mannKendallTest(data)
sensSlopeEstimator(data)

// Rate of change
calculateRateOfChange(data)
calculateTrendAcceleration(data)

// Seasonality
detectSeasonality(data, period)
decomposeTrend(data)
```

**Trend Strength Interpretation:**
- R² > 0.9: Very strong
- R² 0.7-0.9: Strong
- R² 0.4-0.7: Moderate
- R² 0.2-0.4: Weak
- R² < 0.2: Very weak

### Correlation Module (`correlation.js`)

Analyzes relationships between multiple variables.

**Key Functions:**
```javascript
// Correlation calculations
calculatePearsonCorrelation(x, y)
calculateSpearmanCorrelation(x, y)
calculatePartialCorrelation(x, y, z)

// Matrix operations
createCorrelationMatrix(data)

// Time-lagged correlations
calculateLaggedCorrelation(x, y, lag)

// Rolling correlations
calculateRollingCorrelation(data, windowSize)

// Significance testing
testCorrelationSignificance(correlation, n)
```

### Anomalies Module (`anomalies.js`)

Detects outliers and unusual patterns.

**Key Functions:**
```javascript
// Statistical anomalies
detectZScoreAnomalies(data, threshold = 3)
detectIQRAnomalies(data, multiplier = 1.5)

// Rate-of-change anomalies
detectRateOfChangeAnomalies(data, threshold = 50)

// Contextual anomalies
detectContextualAnomalies(data, context)

// Persistent abnormalities
detectPersistentAbnormalities(data, referenceRange)

// Multivariate anomalies
detectMultivariateAnomalies(data, method = 'mahalanobis')
```

**Severity Levels:**
- Z-score >5: Extreme
- Z-score 4-5: High
- Z-score 3-4: Moderate
- Z-score 2-3: Low

### Prediction Module (`prediction.js`)

Forecasts future values and assesses risk.

**Key Functions:**
```javascript
// Forecasting methods
calculateMovingAverage(data, periods)
calculateLinearRegressionForecast(data, horizon)
calculateExponentialSmoothing(data, alpha)
calculateARIMAForecast(data, order, horizon)

// Ensemble forecast
calculateEnsembleForecast(data, horizon, methods)

// Risk assessment
assessRisk(currentValue, predictions, referenceRange)
calculateRiskScore(value, referenceRange, trends)

// Personalized ranges
calculatePersonalizedRange(data, coverage = 0.95)

// Early warnings
generateEarlyWarnings(predictions, referenceRange, threshold)
```

**Risk Level Calculation:**
```javascript
riskScore = (zScore × 0.4) +
            (trendFactor × 0.3) +
            (variability × 0.2) +
            (outlierCount × 0.1)
```

---

## API Development

### API Structure

All endpoints in `server/api/analytics.js`:

```javascript
// Analytics endpoints
GET  /api/analytics/trends/:labTestId
GET  /api/analytics/correlations
GET  /api/analytics/anomalies/:labTestId
GET  /api/analytics/predictions/:labTestId
GET  /api/analytics/statistics/:labTestId
GET  /api/analytics/insights
GET  /api/analytics/comprehensive/:labTestId

// Cache management
POST /api/analytics/cache/clear
GET  /api/analytics/cache/stats

// System endpoints
GET  /health
GET  /
```

### Adding New Endpoints

1. **Define route in `api/analytics.js`:**
```javascript
app.get('/api/analytics/new-endpoint/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await performAnalysis(id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

2. **Update API documentation:**
   - Add to `API_REFERENCE.md`
   - Include request/response examples
   - Document parameters

3. **Add tests:**
```javascript
describe('New Endpoint', () => {
  it('should return valid response', async () => {
    const response = await request(app)
      .get('/api/analytics/new-endpoint/test-id')
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

### Error Handling

```javascript
// Standard error response
{
  "success": false,
  "error": "Error message description",
  "details": {
    "field": "Specific error details"
  }
}

// HTTP status codes
400 - Bad Request (invalid parameters)
404 - Not Found (no data)
500 - Internal Server Error (unexpected error)
```

---

## Frontend Development

### Component Structure

```
client/src/
├── components/
│   ├── dashboard/
│   │   ├── Dashboard.jsx
│   │   ├── MetricCard.jsx
│   │   └── InsightsPanel.jsx
│   ├── trends/
│   │   ├── TrendChart.jsx
│   │   ├── TrendAnalysis.jsx
│   │   └── TrendTable.jsx
│   ├── correlations/
│   │   ├── CorrelationMatrix.jsx
│   │   └── ScatterPlot.jsx
│   └── shared/
│       ├── Button.jsx
│       ├── Input.jsx
│       └── Modal.jsx
├── services/
│   └── api.js              # API client
├── pages/
│   ├── Dashboard.jsx
│   ├── Trends.jsx
│   └── Settings.jsx
├── hooks/
│   ├── useAnalytics.js    # Custom hook for analytics
│   └── usePatient.js      # Patient management hook
└── stores/
    └── useStore.js        # Global state (Zustand)
```

### API Client

```javascript
// services/api.js
const API_BASE = 'http://localhost:3000/api/analytics';

export const api = {
  async getTrends(labTestId, options = {}) {
    const params = new URLSearchParams(options);
    const response = await fetch(`${API_BASE}/trends/${labTestId}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch trends');
    return response.json();
  },

  async getCorrelations(labTests, options = {}) {
    const params = new URLSearchParams({
      labTests: labTests.join(','),
      ...options
    });
    const response = await fetch(`${API_BASE}/correlations?${params}`);
    if (!response.ok) throw new Error('Failed to fetch correlations');
    return response.json();
  },

  // ... other methods
};
```

### Custom Hooks

```javascript
// hooks/useAnalytics.js
export function useAnalytics(labTestId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await api.getTrends(labTestId);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [labTestId]);

  return { data, loading, error };
}
```

---

## Database Schema

### Current: File-based Storage

```javascript
// data/sample-data.json structure
{
  "labTests": [
    {
      "id": "creatinine",
      "name": "Creatinine",
      "unit": "mg/dL",
      "referenceRange": { "min": 0.7, "max": 1.3 },
      "data": [
        {
          "date": "2026-01-01",
          "value": 1.2,
          "notes": "Initial test"
        }
      ]
    }
  ],
  "context": {
    "medications": [...],
    "events": [...]
  }
}
```

### Planned: PostgreSQL Schema

```sql
-- Patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lab tests table
CREATE TABLE lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  test_name VARCHAR(255) NOT NULL,
  value DECIMAL(10, 4) NOT NULL,
  unit VARCHAR(50),
  reference_min DECIMAL(10, 4),
  reference_max DECIMAL(10, 4),
  test_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_patient_tests (patient_id, test_date)
);

-- Analytics cache table
CREATE TABLE analytics_cache (
  cache_key VARCHAR(255) PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  analysis_type VARCHAR(50),
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  INDEX idx_cache_expiry (expires_at)
);
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- trends.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Test Structure

```javascript
// tests/analytics/trends.test.js
describe('Trend Analysis', () => {
  const sampleData = [
    { date: '2026-01-01', value: 100 },
    { date: '2026-02-01', value: 95 },
    { date: '2026-03-01', value: 90 }
  ];

  describe('calculateTrend', () => {
    it('should detect decreasing trend', async () => {
      const result = await calculateTrend(sampleData);
      expect(result.direction).toBe('decreasing');
    });
  });
});
```

### Test Fixtures

```javascript
// tests/fixtures/sample-data.js
export const creatinineData = [
  { date: '2026-01-01', value: 1.2 },
  { date: '2026-02-01', value: 1.1 },
  // ...
];

export const glucoseData = [
  { date: '2026-01-01', value: 120 },
  { date: '2026-02-01', value: 115 },
  // ...
];
```

---

## Debugging

### Server Debugging

```bash
# Run with Node debugger
node --inspect server/index.js

# Or with nodemon (auto-restart)
nodemon --inspect server/index.js
```

Then connect with Chrome DevTools:
1. Open chrome://inspect
2. Click "Inspect" under "Remote Target"

### Client Debugging

```bash
# Run Vite dev server with debug
cd client
npm run dev -- --debug
```

### Logging

```javascript
// Use winston or console with levels
logger.info('Processing started', { labTestId });
logger.warn('Insufficient data', { count: data.length });
logger.error('Analysis failed', { error: err.message });
```

---

## Performance Optimization

### Caching Strategy

```javascript
// Three-tier caching
const CACHE_TTL = {
  SHORT: 300,    // 5 minutes - anomalies, predictions
  MEDIUM: 3600,  // 1 hour - trends, comprehensive
  LONG: 86400    // 24 hours - statistics, correlations
};

function getCacheTTL(analysisType) {
  switch (analysisType) {
    case 'anomalies':
    case 'predictions':
      return CACHE_TTL.SHORT;
    case 'trends':
    case 'comprehensive':
      return CACHE_TTL.MEDIUM;
    case 'statistics':
    case 'correlations':
      return CACHE_TTL.LONG;
    default:
      return CACHE_TTL.MEDIUM;
  }
}
```

### Incremental Updates

```javascript
// Only recompute when new data added
function shouldRecompute(lastUpdate, newData) {
  const daysSinceUpdate =
    (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);

  return daysSinceUpdate > 7 || newData.length > 0;
}
```

### Performance Tips

1. **Use caching** for expensive computations
2. **Batch operations** for multiple analyses
3. **Optimize database queries** with indexes
4. **Use pagination** for large datasets
5. **Compress API responses** with gzip
6. **Implement rate limiting** to prevent abuse

---

**Version**: 1.0.0
**Last Updated**: April 2026

For more information, see:
- [API Documentation](../api/API_REFERENCE.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Architecture Docs](ARCHITECTURE.md)
