# Environment Variables Reference

Complete reference for all environment variables used in Analisi Tracker.

## Table of Contents
- [Server Configuration](#server-configuration)
- [Database Configuration](#database-configuration)
- [Redis Configuration](#redis-configuration)
- [Cache Configuration](#cache-configuration)
- [Analytics Configuration](#analytics-configuration)
- [Prediction Configuration](#prediction-configuration)
- [Rate Limiting](#rate-limiting)
- [Export Configuration](#export-configuration)
- [PDF Processing](#pdf-processing)
- [Security Configuration](#security-configuration)
- [Logging Configuration](#logging-configuration)
- [External Services](#external-services)

---

## Server Configuration

### `PORT`
**Default**: `3000`
**Required**: Yes

Port number for the Express server to listen on.

```bash
PORT=3000
```

**Notes:**
- Must be between 1024 and 65535
- Ports below 1024 require root/admin privileges
- Ensure port is not in use by other applications

### `NODE_ENV`
**Default**: `development`
**Required**: Yes

Environment mode for the application.

```bash
NODE_ENV=production  # Options: development, production, test
```

**Effects:**
- **development**: Detailed error messages, debug logging, hot reload
- **production**: Optimized performance, minimal logging
- **test**: Testing configuration, mock data

### `HOST`
**Default**: `0.0.0.0`
**Required**: No

Host address for the server to bind to.

```bash
HOST=0.0.0.0  # Options: 0.0.0.0 (all interfaces), localhost, specific IP
```

### `API_PREFIX`
**Default**: `/api`
**Required**: No

URL prefix for all API endpoints.

```bash
API_PREFIX=/api
```

**Example**: With `/api/v1`, endpoints become `/api/v1/analytics/trends/:id`

---

## Database Configuration

### `DATABASE_TYPE`
**Default**: `file`
**Required**: No

Type of database to use for data storage.

```bash
DATABASE_TYPE=file  # Options: file, postgresql, mongodb
```

**Notes:**
- `file`: JSON file storage (current implementation)
- `postgresql`: PostgreSQL database (planned)
- `mongodb`: MongoDB database (planned)

### `POSTGRES_HOST`
**Default**: `localhost`
**Required**: Yes (if DATABASE_TYPE=postgresql)

PostgreSQL server hostname or IP address.

```bash
POSTGRES_HOST=localhost
```

### `POSTGRES_PORT`
**Default**: `5432`
**Required**: Yes (if DATABASE_TYPE=postgresql)

PostgreSQL server port.

```bash
POSTGRES_PORT=5432
```

### `POSTGRES_DATABASE`
**Default**: `analisi_tracker`
**Required**: Yes (if DATABASE_TYPE=postgresql)

Database name to connect to.

```bash
POSTGRES_DATABASE=analisi_tracker
```

### `POSTGRES_USER`
**Default**: `postgres`
**Required**: Yes (if DATABASE_TYPE=postgresql)

Database user for authentication.

```bash
POSTGRES_USER=analisi_user
```

### `POSTGRES_PASSWORD`
**Default**: (none)
**Required**: Yes (if DATABASE_TYPE=postgresql)

Database password for authentication.

```bash
POSTGRES_PASSWORD=your_secure_password
```

**Security**: Never commit this to version control. Use environment-specific secrets management.

### `POSTGRES_SSL`
**Default**: `false`
**Required**: No

Enable SSL/TLS for database connection.

```bash
POSTGRES_SSL=true  # Options: true, false
```

### `POSTGRES_POOL_MIN`
**Default**: `2`
**Required**: No

Minimum number of database connections in pool.

```bash
POSTGRES_POOL_MIN=2
```

### `POSTGRES_POOL_MAX`
**Default**: `10`
**Required**: No

Maximum number of database connections in pool.

```bash
POSTGRES_POOL_MAX=10
```

---

## Redis Configuration

### `REDIS_HOST`
**Default**: `localhost`
**Required**: No

Redis server hostname or IP address.

```bash
REDIS_HOST=localhost
```

**Used for**: Caching, job queues, session storage

### `REDIS_PORT`
**Default**: `6379`
**Required**: No

Redis server port.

```bash
REDIS_PORT=6379
```

### `REDIS_PASSWORD`
**Default**: (none)
**Required**: No

Redis password for authentication.

```bash
REDIS_PASSWORD=your_redis_password
```

### `REDIS_DB`
**Default**: `0`
**Required**: No

Redis database number to use.

```bash
REDIS_DB=0  # Options: 0-15
```

### `REDIS_TLS`
**Default**: `false`
**Required**: No

Enable TLS for Redis connection.

```bash
REDIS_TLS=true
```

---

## Cache Configuration

### `CACHE_TTL_SHORT`
**Default**: `300`
**Required**: No

Short cache TTL in seconds (5 minutes). Used for:
- Anomaly detection results
- Prediction results
- Real-time analytics

```bash
CACHE_TTL_SHORT=300  # 5 minutes
```

### `CACHE_TTL_MEDIUM`
**Default**: `3600`
**Required**: No

Medium cache TTL in seconds (1 hour). Used for:
- Trend analysis
- Comprehensive analysis
- Patient dashboards

```bash
CACHE_TTL_MEDIUM=3600  # 1 hour
```

### `CACHE_TTL_LONG`
**Default**: `86400`
**Required**: No

Long cache TTL in seconds (24 hours). Used for:
- Descriptive statistics
- Correlation matrices
- Reference ranges

```bash
CACHE_TTL_LONG=86400  # 24 hours
```

### `CACHE_ENABLED`
**Default**: `true`
**Required**: No

Enable or disable caching globally.

```bash
CACHE_ENABLED=true  # Options: true, false
```

**Use cases**: Disable for debugging, testing

---

## Analytics Configuration

### `MIN_DATA_POINTS`
**Default**: `5`
**Required**: No

Minimum number of data points required for analysis.

```bash
MIN_DATA_POINTS=5
```

**Effects:**
- Trend analysis requires at least this many points
- Fewer points will return error
- Higher values = more accurate but less flexible

### `MAX_DATA_POINTS`
**Default**: `1000`
**Required**: No

Maximum number of data points to process in one analysis.

```bash
MAX_DATA_POINTS=1000
```

**Purpose**: Prevent performance issues with very large datasets

### `TREND_SIGNIFICANCE_LEVEL`
**Default**: `0.05`
**Required**: No

Statistical significance level (alpha) for trend detection.

```bash
TREND_SIGNIFICANCE_LEVEL=0.05  # 5% significance level
```

**Options**:
- `0.01`: Very strict (99% confidence)
- `0.05`: Standard (95% confidence)
- `0.10`: More lenient (90% confidence)

### `ANOMALY_Z_SCORE_THRESHOLD`
**Default**: `3`
**Required**: No

Z-score threshold for anomaly detection.

```bash
ANOMALY_Z_SCORE_THRESHOLD=3  # 3 standard deviations
```

**Effects**:
- Higher values = fewer anomalies detected
- Lower values = more sensitive detection
- Standard: 3 (99.7% of normal distribution)

### `ANOMALY_IQR_MULTIPLIER`
**Default**: `1.5`
**Required**: No

IQR multiplier for anomaly detection.

```bash
ANOMALY_IQR_MULTIPLIER=1.5
```

**Effects**:
- Standard: 1.5 (mild outliers)
- Extremes: 3.0 (extreme outliers)

### `CORRELATION_METHOD`
**Default**: `pearson`
**Required**: No

Default correlation calculation method.

```bash
CORRELATION_METHOD=pearson  # Options: pearson, spearman
```

**Options**:
- `pearson`: Linear relationships (fast, standard)
- `spearman`: Monotonic relationships (robust to outliers)

---

## Prediction Configuration

### `PREDICTION_HORIZON_DAYS`
**Default**: `90`
**Required**: No

Default forecast horizon in days.

```bash
PREDICTION_HORIZON_DAYS=90  # 3 months
```

**Common values**:
- `30`: Short-term (1 month)
- `90`: Medium-term (3 months)
- `180`: Long-term (6 months)

### `ARIMA_ORDER_P`
**Default**: `3`
**Required**: No

AR (AutoRegressive) order for ARIMA model.

```bash
ARIMA_ORDER_P=3
```

**Range**: 1-5
Higher values capture more complex patterns but require more data.

### `ARIMA_ORDER_D`
**Default**: `1`
**Required**: No

I (Integrated) order for ARIMA model (differencing).

```bash
ARIMA_ORDER_D=1
```

**Range**: 0-2
Most time series need d=1 (first differencing).

### `ARIMA_ORDER_Q`
**Default**: `0`
**Required**: No

MA (Moving Average) order for ARIMA model.

```bash
ARIMA_ORDER_Q=0
```

**Range**: 0-5

---

## Rate Limiting

### `RATE_LIMIT_ENABLED`
**Default**: `true`
**Required**: No

Enable or disable rate limiting.

```bash
RATE_LIMIT_ENABLED=true
```

### `RATE_LIMIT_WINDOW_MS`
**Default**: `900000`
**Required**: No

Rate limit time window in milliseconds (15 minutes).

```bash
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
```

**Common values**:
- `60000`: 1 minute
- `300000`: 5 minutes
- `900000`: 15 minutes (standard)
- `3600000`: 1 hour

### `RATE_LIMIT_MAX_REQUESTS`
**Default**: `100`
**Required**: No

Maximum number of requests per window.

```bash
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per 15 minutes
```

**Recommendations**:
- Free tier: 50-100 requests per 15 minutes
- Premium tier: 500-1000 requests per 15 minutes
- Enterprise tier: 10000+ requests per 15 minutes

### `RATE_LIMIT_SKIP_FAILED_REQUESTS`
**Default**: `false`
**Required**: No

Don't count failed requests against rate limit.

```bash
RATE_LIMIT_SKIP_FAILED_REQUESTS=false
```

---

## Export Configuration

### `EXPORT_MAX_ROWS`
**Default**: `10000`
**Required**: No

Maximum number of rows in CSV exports.

```bash
EXPORT_MAX_ROWS=10000
```

**Purpose**: Prevent excessive memory usage and large file generation

### `EXPORT_BATCH_SIZE`
**Default**: `1000`
**Required**: No

Number of rows to process per batch during export.

```bash
EXPORT_BATCH_SIZE=1000
```

**Effects**: Smaller batches = more progress updates but slower

### `EXPORT_FORMATS`
**Default**: `pdf,csv,json`
**Required**: No

Allowed export formats.

```bash
EXPORT_FORMATS=pdf,csv,json
```

---

## PDF Processing

### `GEMINI_API_KEY`
**Default**: (none)
**Required**: No (but recommended)

Google Gemini API key for AI-powered PDF extraction.

```bash
GEMINI_API_KEY=your_gemini_api_key
```

**Get key**: https://ai.google.dev/

**Effects**:
- With key: AI-powered extraction (85-98% accuracy)
- Without key: Fallback to regex extraction (60-75% accuracy)

### `TESSERACT_JS_PATH`
**Default**: (auto-loaded)
**Required**: No

Path to Tesseract.js for OCR processing.

```bash
TESSERACT_JS_PATH=/node_modules/tesseract.js/dist/tesseract.min.js
```

### `PDF_MAX_SIZE_MB`
**Default**: `10`
**Required**: No

Maximum PDF file size in megabytes.

```bash
PDF_MAX_SIZE_MB=10
```

### `PDF_TIMEOUT_MS`
**Default**: `120000`
**Required**: No

Maximum time to process a PDF in milliseconds.

```bash
PDF_TIMEOUT_MS=120000  # 2 minutes
```

---

## Security Configuration

### `JWT_SECRET`
**Default**: (auto-generated)
**Required**: Yes (for authentication)

Secret key for JWT token signing.

```bash
JWT_SECRET=your_random_secret_key_at_least_32_characters
```

**Security**:
- Must be at least 32 characters
- Use random, high-entropy string
- Never commit to version control
- Rotate periodically

**Generate**: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### `JWT_EXPIRES_IN`
**Default**: `7d`
**Required**: No

JWT token expiration time.

```bash
JWT_EXPIRES_IN=7d  # Options: 1h, 1d, 7d, 30d
```

### `BCRYPT_ROUNDS`
**Default**: `10`
**Required**: No

Number of rounds for bcrypt password hashing.

```bash
BCRYPT_ROUNDS=10  # Range: 4-12
```

**Effects**:
- Higher = more secure but slower
- Standard: 10-12
- Fast (dev only): 4-6

### `CORS_ORIGIN`
**Default**: `*`
**Required**: No

Allowed CORS origins for API access.

```bash
CORS_ORIGIN=*  # All origins (development)
CORS_ORIGIN=https://analisi-tracker.com  # Specific origin (production)
```

**Multiple origins**: Comma-separated
```bash
CORS_ORIGIN=https://app.example.com,https://www.example.com
```

### `RATE_LIMIT_TRUST_PROXY`
**Default**: `false`
**Required**: No

Trust X-Forwarded-* headers for rate limiting.

```bash
RATE_LIMIT_TRUST_PROXY=true  # Enable behind reverse proxy
```

---

## Logging Configuration

### `LOG_LEVEL`
**Default**: `info`
**Required**: No

Logging verbosity level.

```bash
LOG_LEVEL=info  # Options: error, warn, info, debug
```

**Levels**:
- `error`: Errors only
- `warn`: Warnings and errors
- `info`: General information (default)
- `debug`: Detailed debugging (development)

### `LOG_FORMAT`
**Default**: `json`
**Required**: No

Log output format.

```bash
LOG_FORMAT=json  # Options: json, simple
```

**Options**:
- `json`: Structured JSON logs (production)
- `simple`: Human-readable text (development)

### `LOG_FILE_ENABLED`
**Default**: `false`
**Required**: No

Enable logging to file.

```bash
LOG_FILE_ENABLED=true
```

### `LOG_FILE_PATH`
**Default**: `./logs/app.log`
**Required**: Yes (if LOG_FILE_ENABLED=true)

Path to log file.

```bash
LOG_FILE_PATH=./logs/app.log
```

---

## External Services

### `EMAIL_SERVICE`
**Default**: (none)
**Required**: No

Email service provider.

```bash
EMAIL_SERVICE=sendgrid  # Options: sendgrid, ses, mailgun
```

### `SENDGRID_API_KEY`
**Default**: (none)
**Required**: Yes (if EMAIL_SERVICE=sendgrid)

SendGrid API key for email notifications.

```bash
SENDGRID_API_KEY=your_sendgrid_api_key
```

### `AWS_ACCESS_KEY_ID`
**Default**: (none)
**Required**: Yes (for AWS services)

AWS access key for S3, SES, etc.

```bash
AWS_ACCESS_KEY_ID=your_aws_access_key
```

### `AWS_SECRET_ACCESS_KEY`
**Default**: (none)
**Required**: Yes (for AWS services)

AWS secret access key.

```bash
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### `AWS_REGION`
**Default**: `us-east-1`
**Required**: Yes (for AWS services)

AWS region for services.

```bash
AWS_REGION=us-east-1
```

### `S3_BUCKET_NAME`
**Default**: (none)
**Required**: Yes (for file storage in S3)

S3 bucket name for file storage.

```bash
S3_BUCKET_NAME=analisi-tracker-uploads
```

---

## Example Configuration Files

### Development (.env.development)
```bash
# Server
PORT=3000
NODE_ENV=development
HOST=localhost

# Analytics
MIN_DATA_POINTS=5
CACHE_ENABLED=true
LOG_LEVEL=debug

# PDF Processing
GEMINI_API_KEY=dev_api_key

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=1000
```

### Production (.env.production)
```bash
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_TYPE=postgresql
POSTGRES_HOST=db.production.com
POSTGRES_DATABASE=analisi_tracker_prod
POSTGRES_USER=analisi_user
POSTGRES_PASSWORD=secure_password

# Redis
REDIS_HOST=redis.production.com
REDIS_PASSWORD=redis_password

# Cache
CACHE_ENABLED=true

# Security
JWT_SECRET=production_secret_key_min_32_chars
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://app.analisi-tracker.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_ENABLED=true

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100

# External Services
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=production_sendgrid_key
```

---

## Environment Variable Best Practices

### Security

1. **Never commit** .env files to version control
2. **Use different values** for each environment
3. **Rotate secrets** periodically
4. **Use strong, random values** for secrets
5. **Limit access** to production secrets
6. **Use secrets management** in production (AWS Secrets Manager, etc.)

### Organization

1. **Group related variables** with comments
2. **Document defaults** and allowed values
3. **Include units** for numeric values
4. **Provide examples** in .env.example

### Validation

```javascript
// Validate required environment variables on startup
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'JWT_SECRET'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

---

## Testing Environment Variables

Set specific values for testing:

```bash
# .env.test
NODE_ENV=test
PORT=3001
DATABASE_TYPE=file
CACHE_ENABLED=false
LOG_LEVEL=error
RATE_LIMIT_ENABLED=false
```

---

**Version**: 1.0.0
**Last Updated**: April 2026

For deployment guides, see:
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
