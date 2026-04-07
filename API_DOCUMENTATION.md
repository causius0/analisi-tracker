# Analisi Tracker - API Documentation

## Base URL
```
http://localhost:3000
```

## Overview
The Analisi Tracker API provides comprehensive analytics for medical lab test data, including trend analysis, correlation detection, anomaly identification, and predictive insights.

---

## Endpoints

### Health Check

#### GET /health
Check server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-04-06T12:00:00Z",
  "uptime": 12345.67,
  "version": "1.0.0"
}
```

---

### Trend Analysis

#### GET /api/analytics/trends/:labTestId
Get comprehensive trend analysis for a specific lab test.

**Parameters:**
- `labTestId` (path) - Lab test identifier (e.g., "creatinine", "glucose")
- `forecastHorizon` (query, optional) - Number of days to forecast (default: 30)

**Example Request:**
```bash
curl http://localhost:3000/api/analytics/trends/creatinine?forecastHorizon=30
```

**Response:**
```json
{
  "metadata": {
    "labTestId": "creatinine",
    "dataPoints": 8,
    "dateRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-04-15T00:00:00Z"
    },
    "analysisDate": "2024-04-06T12:00:00Z",
    "cached": false
  },
  "statistics": {
    "mean": 0.9475,
    "median": 0.925,
    "standardDeviation": 0.1423,
    "minimum": 0.78,
    "maximum": 1.2,
    "count": 8
  },
  "trends": {
    "overall": {
      "direction": "decreasing",
      "rateOfChange": {
        "absolute": -0.0156,
        "percentage": -1.64,
        "unit": "per day"
      },
      "strength": {
        "level": "strong",
        "score": 0.87,
        "description": "Strong trend with high confidence"
      }
    }
  },
  "anomalies": {
    "totalCount": 1,
    "statistical": {
      "totalAnomalies": 0
    },
    "rateOfChange": {
      "totalAnomalies": 1,
      "anomalies": [...]
    }
  },
  "predictions": {
    "forecasts": {
      "method": "ensemble",
      "forecasts": [
        {
          "period": 1,
          "value": 0.76,
          "confidence": "high"
        }
      ]
    },
    "risk": {
      "riskLevel": "low",
      "riskScore": 25,
      "riskFactors": []
    }
  },
  "insights": [
    {
      "type": "trend",
      "priority": "high",
      "message": "Values are decreasing at a rate of 0.0156 mg/dL per day"
    }
  ],
  "summary": "Average: 0.95 | Trend: decreasing | 1 anomalies | Risk: low"
}
```

---

### Correlation Analysis

#### GET /api/analytics/correlations
Get correlation matrix for multiple lab tests.

**Parameters:**
- `labTests` (query, required) - Comma-separated list of lab test IDs
- `includeLagged` (query, optional) - Include time-lagged correlations (default: false)
- `includeRolling` (query, optional) - Include rolling correlations (default: false)

**Example Request:**
```bash
curl "http://localhost:3000/api/analytics/correlations?labTests=creatinine,egfr,glucose&includeLagged=true"
```

**Response:**
```json
{
  "correlations": {
    "matrix": {
      "creatinine": {
        "creatinine": 1,
        "egfr": -0.892,
        "glucose": 0.234
      },
      "egfr": {
        "creatinine": -0.892,
        "egfr": 1,
        "glucose": -0.156
      },
      "glucose": {
        "creatinine": 0.234,
        "egfr": -0.156,
        "glucose": 1
      }
    },
    "pValues": {
      "creatinine": {
        "creatinine": 0,
        "egfr": 0.003,
        "glucose": 0.234
      }
    },
    "significantPairs": [
      {
        "variable1": "creatinine",
        "variable2": "egfr",
        "correlation": -0.892,
        "pValue": 0.003,
        "strength": "very_strong",
        "direction": "negative"
      }
    ],
    "method": "pearson",
    "insights": {
      "strongCorrelations": [...],
      "leadLagRelationships": [...]
    }
  },
  "metadata": {
    "labTestCount": 3,
    "dataPointsPerTest": 8,
    "cached": false
  }
}
```

---

### Anomaly Detection

#### GET /api/analytics/anomalies/:labTestId
Get anomaly detection for a specific lab test.

**Parameters:**
- `labTestId` (path) - Lab test identifier
- `referenceMin` (query, optional) - Lower reference range (default: 0)
- `referenceMax` (query, optional) - Upper reference range (default: 100)

**Example Request:**
```bash
curl "http://localhost:3000/api/analytics/anomalies/alt?referenceMin=7&referenceMax=56"
```

**Response:**
```json
{
  "anomalies": {
    "statistical": {
      "anomalies": [
        {
          "index": 3,
          "value": 65,
          "zScore": 2.34,
          "isAnomaly": true,
          "severity": "moderate"
        }
      ],
      "totalAnomalies": 1,
      "percentage": 12.5,
      "referenceRange": {
        "mean": 39.75,
        "std": 10.82,
        "lower": 7.29,
        "upper": 72.21
      }
    },
    "rateOfChange": {
      "anomalies": [
        {
          "index": 3,
          "value": 65,
          "previousValue": 45,
          "absoluteChange": 20,
          "percentageChange": 44.44,
          "isAnomaly": true,
          "severity": "moderate",
          "type": "spike"
        }
      ],
      "totalAnomalies": 2
    },
    "contextual": {
      "anomalies": [],
      "totalAnomalies": 0
    },
    "persistent": {
      "persistentAbnormalities": [],
      "totalPersistent": 0
    },
    "allAnomalies": [...],
    "totalCount": 3
  },
  "metadata": {
    "labTestId": "alt",
    "dataPoints": 8
  }
}
```

---

### Predictive Analytics

#### GET /api/analytics/predictions/:labTestId
Get predictions and risk assessment for a specific lab test.

**Parameters:**
- `labTestId` (path) - Lab test identifier
- `forecastHorizon` (query, optional) - Days to forecast (default: 30)
- `referenceMin` (query, optional) - Lower reference range
- `referenceMax` (query, optional) - Upper reference range

**Example Request:**
```bash
curl "http://localhost:3000/api/analytics/predictions/glucose?forecastHorizon=30&referenceMin=70&referenceMax=100"
```

**Response:**
```json
{
  "predictions": {
    "forecasts": {
      "method": "ensemble",
      "forecasts": [
        {
          "period": 1,
          "value": 84.5,
          "confidence": "high",
          "components": [...]
        }
      ]
    },
    "risk": {
      "riskLevel": "medium",
      "riskScore": 45,
      "riskFactors": ["mild_outlier"],
      "currentValue": 85,
      "zScore": 1.23,
      "recommendations": [
        {
          "priority": "medium",
          "message": "Values are outside normal range - monitor closely"
        }
      ]
    },
    "warnings": {
      "warnings": [],
      "totalWarnings": 0
    },
    "personalizedRange": {
      "lower": 86.5,
      "upper": 108.2,
      "coverage": 0.95,
      "confidence": "high"
    }
  },
  "metadata": {
    "labTestId": "glucose",
    "dataPoints": 15
  }
}
```

---

### Statistics

#### GET /api/analytics/statistics/:labTestId
Get descriptive statistics for a specific lab test.

**Parameters:**
- `labTestId` (path) - Lab test identifier

**Example Request:**
```bash
curl http://localhost:3000/api/analytics/statistics/creatinine
```

**Response:**
```json
{
  "statistics": {
    "count": 8,
    "mean": 0.9475,
    "median": 0.925,
    "mode": 0.8,
    "standardDeviation": 0.1423,
    "variance": 0.0202,
    "minimum": 0.78,
    "maximum": 1.2,
    "range": 0.42,
    "percentiles": {
      "p25": 0.8225,
      "p50": 0.925,
      "p75": 1.0625,
      "p90": 1.14,
      "p95": 1.17,
      "p99": 1.194
    },
    "quartiles": {
      "q1": 0.8225,
      "q2": 0.925,
      "q3": 1.0625,
      "iqr": 0.24
    },
    "shape": {
      "skewness": 0.45,
      "kurtosis": -0.82
    },
    "coefficientOfVariation": 15.02
  },
  "variability": {
    "standardDeviation": 0.1423,
    "variance": 0.0202,
    "coefficientOfVariation": 15.02,
    "range": 0.42,
    "interquartileRange": 0.24
  },
  "confidenceInterval": {
    "lower": 0.845,
    "upper": 1.05,
    "marginOfError": 0.1025,
    "confidence": 0.95
  },
  "personalizedRange": {
    "lower": 0.8,
    "upper": 1.15,
    "coverage": 0.95,
    "confidence": "medium"
  }
}
```

---

### Insights

#### GET /api/analytics/insights
Get quick or detailed insights for multiple lab tests.

**Parameters:**
- `labTests` (query, required) - Comma-separated list of lab test IDs
- `type` (query, optional) - Insight type: "quick" or "detailed" (default: "quick")

**Example Request (Quick):**
```bash
curl "http://localhost:3000/api/analytics/insights?labTests=creatinine,glucose,egfr&type=quick"
```

**Response (Quick):**
```json
{
  "insights": [
    {
      "labTestId": "creatinine",
      "currentValue": 0.78,
      "average": 0.9475,
      "trend": "decreasing",
      "trendStrength": "strong",
      "anomalyCount": 1,
      "riskLevel": "normal",
      "status": "ok"
    },
    {
      "labTestId": "glucose",
      "currentValue": 85,
      "average": 95.4,
      "trend": "decreasing",
      "trendStrength": "very_strong",
      "anomalyCount": 0,
      "riskLevel": "normal",
      "status": "ok"
    }
  ],
  "metadata": {
    "type": "quick",
    "labTestCount": 3
  }
}
```

---

### Comprehensive Analysis

#### GET /api/analytics/comprehensive/:labTestId
Get comprehensive analysis including all analytics for a specific lab test.

**Parameters:**
- `labTestId` (path) - Lab test identifier
- `referenceMin` (query, optional) - Lower reference range
- `referenceMax` (query, optional) - Upper reference range
- `targetMin` (query, optional) - Lower target range (for time-in-range calculations)
- `targetMax` (query, optional) - Upper target range
- `forecastHorizon` (query, optional) - Days to forecast

**Example Request:**
```bash
curl "http://localhost:3000/api/analytics/comprehensive/glucose?referenceMin=70&referenceMax=100&targetMin=70&targetMax=140&forecastHorizon=30"
```

**Response:** Returns all analytics data including statistics, trends, anomalies, predictions, and insights in a single response.

---

### Cache Management

#### POST /api/analytics/cache/clear
Clear cache for specific lab test or all.

**Body:**
```json
{
  "labTestId": "creatinine",
  "pattern": "creatinine"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/analytics/cache/clear \
  -H "Content-Type: application/json" \
  -d '{"labTestId": "creatinine"}'
```

**Response:**
```json
{
  "message": "Cleared 3 cache entries for creatinine",
  "deleted": 3
}
```

#### GET /api/analytics/cache/stats
Get cache statistics.

**Example Request:**
```bash
curl http://localhost:3000/api/analytics/cache/stats
```

**Response:**
```json
{
  "keys": 15,
  "hits": 142,
  "misses": 23,
  "ksize": 1050,
  "vsize": 52400,
  "hitRate": 0.86
}
```

---

## Error Responses

All endpoints may return error responses:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (missing/invalid parameters)
- `404` - Not Found (no data for lab test)
- `500` - Internal Server Error

---

## Rate Limiting

API requests are rate limited to:
- 100 requests per 15 minutes per IP address

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704528000
```

---

## Caching

Analytics results are cached to improve performance:
- **Short TTL**: 5 minutes (anomalies, predictions)
- **Medium TTL**: 1 hour (trends, comprehensive)
- **Long TTL**: 24 hours (statistics, correlations)

Cache can be cleared using the cache management endpoints.

---

## Data Format

All dates are in ISO 8601 format (UTC).
All numeric values use standard decimal notation.

---

## Authentication

(Currently not implemented - will be added in future versions)

---

## WebSocket Support

(Currently not implemented - will be added for real-time updates)

---

## Examples

### Complete Workflow Example

```javascript
// 1. Get comprehensive analysis
const analysis = await fetch(
  'http://localhost:3000/api/analytics/comprehensive/creatinine'
).then(r => r.json());

// 2. Check risk level
if (analysis.predictions.risk.riskLevel === 'high') {
  console.log('High risk detected!');
  console.log(analysis.predictions.risk.recommendations);
}

// 3. Get correlations with other tests
const correlations = await fetch(
  'http://localhost:3000/api/analytics/correlations?labTests=creatinine,egfr'
).then(r => r.json());

// 4. Check for strong correlations
const strongCorrs = correlations.correlations.insights.strongCorrelations;
strongCorrs.forEach(correlation => {
  console.log(`${correlation.variable1} - ${correlation.variable2}: ${correlation.correlation}`);
});
```
