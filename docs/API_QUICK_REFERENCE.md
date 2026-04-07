# API Quick Reference Card

## Base URL
```
http://localhost:3000
```

## Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

## Users
```
GET    /api/users/profile
PATCH  /api/users/profile
POST   /api/users/change-password
GET    /api/users/preferences
PUT    /api/users/preferences
```

## Patients
```
GET    /api/patients
POST   /api/patients
GET    /api/patients/:patientId
PATCH  /api/patients/:patientId
DELETE /api/patients/:patientId
PATCH  /api/patients/:patientId/set-primary
GET    /api/patients/primary
```

## Lab Tests
```
GET    /api/labs/definitions
GET    /api/labs/definitions/:definitionId
GET    /api/labs/results
POST   /api/labs/results
GET    /api/labs/results/:resultId
PATCH  /api/labs/results/:resultId
DELETE /api/labs/results/:resultId
GET    /api/labs/results/patient/:patientId
GET    /api/labs/results/patient/:patientId/abnormal
```

## Insights
```
GET    /api/insights
GET    /api/insights/:insightId
PATCH  /api/insights/:insightId/read
PATCH  /api/insights/:insightId/dismiss
PATCH  /api/insights/mark-all-read
GET    /api/insights/unread-count
DELETE /api/insights/cleanup
```

## Export
```
POST   /api/export/request
GET    /api/export/jobs
GET    /api/export/jobs/:jobId
GET    /api/export/jobs/:jobId/download
DELETE /api/export/jobs/:jobId
```

## Analytics
```
GET    /api/analytics/trends/:labTestId
GET    /api/analytics/correlations
GET    /api/analytics/anomalies/:labTestId
GET    /api/analytics/predictions/:labTestId
GET    /api/analytics/statistics/:labTestId
GET    /api/analytics/insights
GET    /api/analytics/comprehensive/:labTestId
POST   /api/analytics/cache/clear
GET    /api/analytics/cache/stats
```

## Health
```
GET    /health
```

## Documentation
```
GET    /api-docs
GET    /
```

## Request Format

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Example Request
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Response Format

### Success (200-299)
```json
{
  "message": "Success",
  "data": { ... }
}
```

### Error (400-599)
```json
{
  "error": "ErrorType",
  "message": "Error message",
  "statusCode": 400
}
```

## Rate Limits

- General: 100/15min
- Auth: 5/15min
- API: 60/min
- Upload: 20/hour
- Export: 10/hour

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 429: Too Many Requests
- 500: Internal Server Error

## Query Parameters

### Pagination
```
?limit=50&offset=0
```

### Filtering
```
?patientId=uuid&labTestDefinitionId=uuid
```

### Date Range
```
?startDate=2024-01-01&endDate=2024-12-31
```

### Search
```
?search=john
```

## Lab Test Categories

- kidney
- liver
- metabolic
- thyroid
- cbc (Complete Blood Count)
- electrolyte

## User Roles

- user: Standard user
- admin: Administrator
- clinician: Healthcare provider

## Common Lab Tests

- Creatinine
- eGFR
- BUN
- ALT
- AST
- Glucose
- HbA1c
- Cholesterol
- LDL
- HDL
- TSH
- Hemoglobin
- WBC
- Platelets
- Sodium
- Potassium
