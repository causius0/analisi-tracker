import { http, HttpResponse } from 'msw';

// Mock data
const mockPatients = [
  {
    id: 'patient-1',
    name: 'John Doe',
    dateOfBirth: '1980-01-15',
    gender: 'male',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'patient-2',
    name: 'Jane Smith',
    dateOfBirth: '1985-05-20',
    gender: 'female',
    createdAt: '2024-01-02T00:00:00.000Z',
  },
];

const mockLabResults = [
  {
    id: 'lab-1',
    patientId: 'patient-1',
    testName: 'Complete Blood Count',
    date: '2024-01-10',
    results: {
      hemoglobin: { value: 14.5, unit: 'g/dL', referenceRange: '13.5-17.5' },
      hematocrit: { value: 42, unit: '%', referenceRange: '38-50' },
      wbc: { value: 7.5, unit: 'x10^9/L', referenceRange: '4.5-11.0' },
      platelets: { value: 250, unit: 'x10^9/L', referenceRange: '150-400' },
    },
    createdAt: '2024-01-10T00:00:00.000Z',
  },
  {
    id: 'lab-2',
    patientId: 'patient-1',
    testName: 'Lipid Panel',
    date: '2024-01-15',
    results: {
      totalCholesterol: { value: 210, unit: 'mg/dL', referenceRange: '<200' },
      ldl: { value: 140, unit: 'mg/dL', referenceRange: '<100' },
      hdl: { value: 45, unit: 'mg/dL', referenceRange: '>40' },
      triglycerides: { value: 150, unit: 'mg/dL', referenceRange: '<150' },
    },
    createdAt: '2024-01-15T00:00:00.000Z',
  },
];

const mockAnalyticsData = {
  trends: [
    {
      testName: 'Hemoglobin',
      slope: 0.05,
      correlation: 0.85,
      significance: 'high',
      dataPoints: [
        { date: '2024-01-01', value: 14.0 },
        { date: '2024-01-10', value: 14.5 },
        { date: '2024-01-20', value: 15.0 },
      ],
    },
  ],
  correlations: [
    {
      test1: 'LDL',
      test2: 'Total Cholesterol',
      coefficient: 0.92,
      significance: 'high',
    },
  ],
  anomalies: [
    {
      testName: 'White Blood Cell Count',
      date: '2024-01-15',
      value: 15.5,
      expectedRange: [4.5, 11.0],
      severity: 'high',
    },
  ],
  predictions: [
    {
      testName: 'Hemoglobin',
      predictedValue: 15.2,
      confidence: 0.89,
      nextTestDate: '2024-02-01',
    },
  ],
};

// API handlers
export const handlers = [
  // Patient endpoints
  http.get('/api/patients', () => {
    return HttpResponse.json({ patients: mockPatients });
  }),

  http.get('/api/patients/:id', ({ params }) => {
    const patient = mockPatients.find(p => p.id === params.id);
    if (!patient) {
      return HttpResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    return HttpResponse.json({ patient });
  }),

  http.post('/api/patients', async ({ request }) => {
    const body = await request.json();
    const newPatient = {
      id: `patient-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };
    mockPatients.push(newPatient);
    return HttpResponse.json({ patient: newPatient }, { status: 201 });
  }),

  http.put('/api/patients/:id', async ({ params, request }) => {
    const body = await request.json();
    const index = mockPatients.findIndex(p => p.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    mockPatients[index] = { ...mockPatients[index], ...body };
    return HttpResponse.json({ patient: mockPatients[index] });
  }),

  http.delete('/api/patients/:id', ({ params }) => {
    const index = mockPatients.findIndex(p => p.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    mockPatients.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),

  // Lab results endpoints
  http.get('/api/lab-results', ({ request }) => {
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    let results = mockLabResults;
    if (patientId) {
      results = results.filter(r => r.patientId === patientId);
    }
    return HttpResponse.json({ results });
  }),

  http.get('/api/lab-results/:id', ({ params }) => {
    const result = mockLabResults.find(r => r.id === params.id);
    if (!result) {
      return HttpResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }
    return HttpResponse.json({ result });
  }),

  http.post('/api/lab-results', async ({ request }) => {
    const body = await request.json();
    const newResult = {
      id: `lab-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };
    mockLabResults.push(newResult);
    return HttpResponse.json({ result: newResult }, { status: 201 });
  }),

  http.put('/api/lab-results/:id', async ({ params, request }) => {
    const body = await request.json();
    const index = mockLabResults.findIndex(r => r.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }
    mockLabResults[index] = { ...mockLabResults[index], ...body };
    return HttpResponse.json({ result: mockLabResults[index] });
  }),

  http.delete('/api/lab-results/:id', ({ params }) => {
    const index = mockLabResults.findIndex(r => r.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }
    mockLabResults.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),

  // Analytics endpoints
  http.get('/api/analytics/trends', ({ request }) => {
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    if (!patientId) {
      return HttpResponse.json({ error: 'Patient ID required' }, { status: 400 });
    }
    return HttpResponse.json({ trends: mockAnalyticsData.trends });
  }),

  http.get('/api/analytics/correlations', ({ request }) => {
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    if (!patientId) {
      return HttpResponse.json({ error: 'Patient ID required' }, { status: 400 });
    }
    return HttpResponse.json({ correlations: mockAnalyticsData.correlations });
  }),

  http.get('/api/analytics/anomalies', ({ request }) => {
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    if (!patientId) {
      return HttpResponse.json({ error: 'Patient ID required' }, { status: 400 });
    }
    return HttpResponse.json({ anomalies: mockAnalyticsData.anomalies });
  }),

  http.get('/api/analytics/predictions', ({ request }) => {
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    if (!patientId) {
      return HttpResponse.json({ error: 'Patient ID required' }, { status: 400 });
    }
    return HttpResponse.json({ predictions: mockAnalyticsData.predictions });
  }),

  http.post('/api/analytics/run-all', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      results: mockAnalyticsData,
      patientId: body.patientId,
      timestamp: new Date().toISOString(),
    });
  }),

  // PDF endpoints
  http.post('/api/pdf/upload', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: `pdf-${Date.now()}`,
      filename: body.filename || 'test.pdf',
      status: 'encrypted',
      uploadedAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  http.get('/api/pdf/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      filename: 'test.pdf',
      status: 'encrypted',
      encryptedUrl: `/api/pdf/${params.id}/download`,
    });
  }),

  http.get('/api/pdf/:id/download', ({ params }) => {
    return HttpResponse.json({
      data: 'mock-pdf-data',
      filename: 'test.pdf',
    });
  }),

  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        token: 'mock-jwt-token',
        user: {
          id: 'user-1',
          email: body.email,
          name: 'Test User',
        },
      });
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: {
        id: `user-${Date.now()}`,
        email: body.email,
        name: body.name,
      },
    }, { status: 201 });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'healthy', timestamp: new Date().toISOString() });
  }),
];
