# Analisi Tracker API - Setup Guide

Complete production-ready backend API infrastructure for the analisi-tracker application.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)

## Features

✅ **Complete REST API**
- 15+ RESTful endpoints with proper HTTP methods
- OpenAPI/Swagger documentation
- Request/response validation with Zod schemas
- Standardized error handling

✅ **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (user, admin, clinician)
- Refresh token rotation
- Protected routes

✅ **Multi-Patient Management**
- Create, read, update, delete patients
- Primary patient selection
- Patient-specific data isolation

✅ **Lab Data Management**
- Lab test definitions (20+ common tests)
- Lab test results CRUD operations
- Abnormal value detection
- Historical data tracking

✅ **Advanced Analytics**
- Trend analysis
- Anomaly detection
- Correlation analysis
- Predictive analytics
- Statistical summaries

✅ **Insights & Alerts**
- Real-time insights generation
- Severity-based alerts (info, warning, critical)
- Read/unread status tracking
- Insight dismissal

✅ **Data Export**
- CSV export
- JSON export
- PDF export
- Asynchronous job processing

✅ **Security**
- Helmet.js security headers
- CORS configuration
- Rate limiting (multiple tiers)
- SQL injection prevention
- XSS protection
- Request size limits

✅ **Performance**
- Response compression (gzip)
- Caching layer
- Connection pooling
- Optimized queries

✅ **Monitoring & Logging**
- Winston structured logging
- Request logging (Morgan-style)
- Error tracking
- Performance metrics

## Architecture

```
analisi-tracker/
├── server/
│   ├── api/
│   │   └── routes/
│   │       ├── auth.js          # Authentication endpoints
│   │       ├── users.js         # User management
│   │       ├── patients.js      # Patient management
│   │       ├── labs.js          # Lab test data
│   │       ├── insights.js      # Insights & alerts
│   │       ├── export.js        # Data export
│   │       └── index.js         # Routes index
│   ├── db/
│   │   ├── schema.js            # Database schema
│   │   ├── index.js             # Database connection
│   │   ├── migrations/          # Database migrations
│   │   └── seeds/
│   │       └── seed.js          # Seed data
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   ├── validation.js        # Request validation
│   │   ├── rateLimiter.js       # Rate limiting
│   │   ├── logger.js            # Logging
│   │   ├── errorHandler.js      # Error handling
│   │   ├── security.js          # Security headers
│   │   └── index.js
│   ├── config/
│   │   └── swagger.js           # API documentation
│   ├── analytics/               # Analytics engine
│   ├── cache/                   # Cache management
│   ├── utils/                   # Utility functions
│   └── index-new.js             # Main server file
├── tests/
│   └── api/                     # Integration tests
├── scripts/
│   └── db-migrate.js            # Database migrations
├── drizzle.config.js            # Drizzle ORM config
├── package.json
└── .env.example
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## Installation

1. **Clone the repository**
   ```bash
   cd /Users/causius/Documents/GitHub/analisi-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/analisi_tracker

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

   # Redis Configuration (for caching)
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # Logging
   LOG_LEVEL=info
   ```

## Database Setup

1. **Create PostgreSQL database**
   ```bash
   createdb analisi_tracker
   ```

2. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

3. **Seed database with test data** (optional)
   ```bash
   npm run db:seed
   ```

   This creates:
   - 3 test users (test@example.com, admin@example.com, clinician@example.com)
   - Password: `password123`
   - 2 test patients
   - 20+ lab test definitions
   - Sample lab results

## Configuration

### Database Schema

The application uses the following main tables:

- **users** - User accounts and authentication
- **user_preferences** - User settings
- **patients** - Patient information
- **lab_test_definitions** - Lab test reference data
- **lab_test_results** - Patient lab test results
- **insights** - Analytics insights and alerts
- **pdfs** - PDF uploads and metadata
- **export_jobs** - Data export jobs
- **refresh_tokens** - JWT refresh tokens
- **analytics_cache** - Analytics results cache
- **audit_log** - Audit trail

### Rate Limiting

Different rate limits apply to different endpoints:

- **General**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **API calls**: 60 requests per minute
- **Uploads**: 20 uploads per hour
- **Exports**: 10 exports per hour

## Running the Server

### Development Mode

```bash
npm run server:dev
```

The server will:
- Start with hot-reload (nodemon)
- Enable detailed error messages
- Log all requests to console
- Serve API documentation at `/api-docs`

### Production Mode

```bash
npm start
```

The server will:
- Use production optimizations
- Enable compression
- Log to files (`logs/combined.log`, `logs/error.log`)
- Serve API documentation at `/api-docs`

## API Documentation

### Interactive Documentation

Visit `http://localhost:3000/api-docs` for interactive Swagger UI documentation.

### Core Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

#### Users
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update profile
- `POST /api/users/change-password` - Change password
- `GET /api/users/preferences` - Get preferences
- `PUT /api/users/preferences` - Update preferences

#### Patients
- `GET /api/patients` - List all patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:patientId` - Get patient
- `PATCH /api/patients/:patientId` - Update patient
- `DELETE /api/patients/:patientId` - Delete patient
- `PATCH /api/patients/:patientId/set-primary` - Set as primary

#### Lab Tests
- `GET /api/labs/definitions` - List lab test definitions
- `GET /api/labs/results` - List lab results
- `POST /api/labs/results` - Create lab result
- `PATCH /api/labs/results/:resultId` - Update result
- `DELETE /api/labs/results/:resultId` - Delete result
- `GET /api/labs/results/patient/:patientId` - Get patient results

#### Insights
- `GET /api/insights` - List insights
- `PATCH /api/insights/:insightId/read` - Mark as read
- `PATCH /api/insights/:insightId/dismiss` - Dismiss insight
- `GET /api/insights/unread-count` - Get unread count

#### Export
- `POST /api/export/request` - Request export
- `GET /api/export/jobs` - List export jobs
- `GET /api/export/jobs/:jobId/download` - Download export

#### Analytics
- `GET /api/analytics/trends/:labTestId` - Trend analysis
- `GET /api/analytics/correlations` - Correlation analysis
- `GET /api/analytics/anomalies/:labTestId` - Anomaly detection
- `GET /api/analytics/predictions/:labTestId` - Predictions
- `GET /api/analytics/statistics/:labTestId` - Statistics
- `GET /api/analytics/comprehensive/:labTestId` - Full analysis

### Request/Response Format

**Success Response:**
```json
{
  "message": "Success message",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "error": "ErrorType",
  "message": "Detailed error message",
  "statusCode": 400,
  "details": { ... }
}
```

## Testing

### Run Integration Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
npm test -- tests/api/auth.test.js
```

### Test Coverage

```bash
npm run test:coverage
```

## Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
ALLOWED_ORIGINS=https://yourdomain.com
LOG_LEVEL=warn
```

### Production Checklist

- [ ] Set strong JWT secrets
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring (Sentry, DataDog, etc.)
- [ ] Configure rate limiting for production load
- [ ] Set up Redis for distributed caching
- [ ] Configure CDN for static assets
- [ ] Set up CI/CD pipeline

### Deployment Platforms

The API can be deployed to:

- **Render** (recommended)
- **Heroku**
- **AWS** (ECS, EC2, Lambda)
- **Google Cloud Run**
- **DigitalOcean App Platform**
- **Railway**
- **Fly.io**

### Example: Deploy to Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Configure build settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables
6. Deploy

## Scripts

```bash
# Development
npm run dev              # Start development server with hot-reload
npm run server:dev       # Start API server only

# Database
npm run db:migrate       # Apply database migrations
npm run db:seed          # Seed database with test data

# Testing
npm test                 # Run integration tests
npm run test:coverage    # Run tests with coverage

# Production
npm start                # Start production server
npm run build            # Build for production
```

## Support

For issues, questions, or contributions:
- GitHub: https://github.com/yourusername/analisi-tracker
- Documentation: https://github.com/yourusername/analisi-tracker/docs

## License

MIT License - See LICENSE file for details
