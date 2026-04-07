/**
 * OpenAPI/Swagger Configuration
 * API documentation setup
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Analisi Tracker API',
      version: '1.0.0',
      description: `Advanced medical lab test analytics platform with trend analysis, correlation detection, and predictive insights.

## Features

- **Multi-patient Management**: Manage lab test data for multiple patients
- **Advanced Analytics**: Trend analysis, anomaly detection, correlations, and predictions
- **PDF Upload**: Automatic extraction of lab results from PDF files
- **Data Export**: Export data in CSV, JSON, or PDF formats
- **Insights & Alerts**: Real-time insights and notifications for abnormal results

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-access-token>
\`\`\`

## Rate Limiting

- General: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes
- API calls: 60 requests per minute
- Uploads: 20 uploads per hour
- Exports: 10 exports per hour`,
      contact: {
        name: 'API Support',
        email: 'support@analisitracker.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.analisitracker.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type or message'
            },
            message: {
              type: 'string',
              description: 'Detailed error message'
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code'
            },
            details: {
              type: 'object',
              description: 'Additional error details (available in development mode)'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'clinician'],
              description: 'User role'
            },
            isActive: {
              type: 'boolean',
              description: 'Account active status'
            },
            emailVerified: {
              type: 'boolean',
              description: 'Email verification status'
            }
          }
        },
        Patient: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date-time'
            },
            sex: {
              type: 'string',
              enum: ['male', 'female', 'other']
            },
            bloodType: {
              type: 'string'
            },
            allergies: {
              type: 'array',
              items: {
                type: 'object'
              }
            },
            medications: {
              type: 'array',
              items: {
                type: 'object'
              }
            },
            conditions: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            isPrimary: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        LabTestResult: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            patientId: {
              type: 'string',
              format: 'uuid'
            },
            labTestDefinitionId: {
              type: 'string',
              format: 'uuid'
            },
            value: {
              type: 'number'
            },
            unit: {
              type: 'string'
            },
            date: {
              type: 'string',
              format: 'date-time'
            },
            isAbnormal: {
              type: 'boolean'
            },
            notes: {
              type: 'string'
            },
            source: {
              type: 'string',
              enum: ['manual', 'pdf', 'import']
            }
          }
        },
        Insight: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            patientId: {
              type: 'string',
              format: 'uuid'
            },
            type: {
              type: 'string',
              enum: ['trend', 'anomaly', 'correlation', 'prediction', 'alert']
            },
            severity: {
              type: 'string',
              enum: ['info', 'warning', 'critical']
            },
            title: {
              type: 'string'
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'object'
            },
            isRead: {
              type: 'boolean'
            },
            isDismissed: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./server/api/routes/*.js', './server/api/**/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);
