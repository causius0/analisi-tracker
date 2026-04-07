/**
 * Validation Middleware
 * Request validation using Zod schemas
 */

import { z } from 'zod';
import { body, param, query, validationResult } from 'express-validator';

/**
 * Validation error handler
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path.join('.'),
        message: err.msg,
        value: err.value
      }))
    });
  }

  next();
}

/**
 * Zod validation middleware factory
 */
export function validateZod(schema) {
  return (req, res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }

      next(error);
    }
  };
}

// Common validation schemas
export const schemas = {
  // Auth schemas
  register: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required')
    })
  }),

  login: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(1, 'Password is required')
    })
  }),

  refreshToken: z.object({
    body: z.object({
      refreshToken: z.string().min(1, 'Refresh token is required')
    })
  }),

  // User schemas
  updateUser: z.object({
    body: z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      email: z.string().email().optional()
    }).partial()
  }),

  updatePreferences: z.object({
    body: z.object({
      preferences: z.record(z.any())
    })
  }),

  // Patient schemas
  createPatient: z.object({
    body: z.object({
      name: z.string().min(1, 'Patient name is required'),
      dateOfBirth: z.string().datetime().optional(),
      sex: z.enum(['male', 'female', 'other']).optional(),
      bloodType: z.string().optional(),
      allergies: z.array(z.object({
        name: z.string(),
        severity: z.enum(['mild', 'moderate', 'severe']).optional(),
        reaction: z.string().optional()
      })).optional(),
      medications: z.array(z.object({
        name: z.string(),
        dosage: z.string().optional(),
        frequency: z.string().optional()
      })).optional(),
      conditions: z.array(z.string()).optional(),
      isPrimary: z.boolean().optional()
    })
  }),

  updatePatient: z.object({
    params: z.object({
      patientId: z.string().uuid('Invalid patient ID format')
    }),
    body: z.object({
      name: z.string().min(1).optional(),
      dateOfBirth: z.string().datetime().optional(),
      sex: z.enum(['male', 'female', 'other']).optional(),
      bloodType: z.string().optional(),
      allergies: z.array(z.any()).optional(),
      medications: z.array(z.any()).optional(),
      conditions: z.array(z.string()).optional(),
      isPrimary: z.boolean().optional()
    }).partial()
  }),

  // Lab test schemas
  createLabResult: z.object({
    body: z.object({
      patientId: z.string().uuid('Invalid patient ID format'),
      labTestDefinitionId: z.string().uuid('Invalid lab test definition ID format'),
      value: z.number('Value must be a number'),
      unit: z.string().min(1, 'Unit is required'),
      date: z.string().datetime('Invalid date format'),
      notes: z.string().optional()
    })
  }),

  updateLabResult: z.object({
    params: z.object({
      resultId: z.string().uuid('Invalid result ID format')
    }),
    body: z.object({
      value: z.number().optional(),
      unit: z.string().optional(),
      date: z.string().datetime().optional(),
      notes: z.string().optional()
    }).partial()
  }),

  // Lab test query parameters
  labTestQuery: z.object({
    query: z.object({
      patientId: z.string().uuid().optional(),
      labTestDefinitionId: z.string().uuid().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      limit: z.string().transform(Number).pipe(z.number().int().positive().max(1000)).optional(),
      offset: z.string().transform(Number).pipe(z.number().int().nonnegative()).optional()
    })
  }),

  // PDF schemas
  uploadPDF: z.object({
    body: z.object({
      patientId: z.string().uuid().optional()
    }).partial()
  }),

  // Analytics schemas
  trendsQuery: z.object({
    params: z.object({
      labTestId: z.string().uuid('Invalid lab test ID format')
    }),
    query: z.object({
      forecastHorizon: z.string().transform(Number).pipe(z.number().int().positive().max(365)).optional(),
      patientId: z.string().uuid().optional()
    })
  }),

  correlationsQuery: z.object({
    query: z.object({
      labTests: z.string().min(1, 'Lab tests parameter is required'),
      includeLagged: z.enum(['true', 'false']).optional(),
      includeRolling: z.enum(['true', 'false']).optional(),
      patientId: z.string().uuid().optional()
    })
  }),

  // Export schemas
  exportRequest: z.object({
    body: z.object({
      type: z.enum(['csv', 'json', 'pdf'], 'Invalid export type'),
      format: z.string().optional(),
      filters: z.object({
        patientId: z.string().uuid().optional(),
        labTestDefinitionId: z.string().uuid().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        includeAbnormalOnly: z.boolean().optional()
      }).optional()
    })
  }),

  // Insight schemas
  markInsightRead: z.object({
    params: z.object({
      insightId: z.string().uuid('Invalid insight ID format')
    })
  }),

  dismissInsight: z.object({
    params: z.object({
      insightId: z.string().uuid('Invalid insight ID format')
    })
  }),

  insightsQuery: z.object({
    query: z.object({
      patientId: z.string().uuid().optional(),
      type: z.enum(['trend', 'anomaly', 'correlation', 'prediction', 'alert']).optional(),
      severity: z.enum(['info', 'warning', 'critical']).optional(),
      isRead: z.enum(['true', 'false']).optional(),
      limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
      offset: z.string().transform(Number).pipe(z.number().int().nonnegative()).optional()
    })
  })
};
