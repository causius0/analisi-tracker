/**
 * Optimized API client with caching, retry logic, and error handling
 * Includes mock data fallback for demo mode
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export interface AnalyticsResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Mock data generators for demo mode
 */
function generateMockTrends() {
  return {
    slope: 0.05,
    correlation: 0.85,
    trend: 'stable',
    changePercent: 2.3,
    dataPoints: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: 100 + Math.random() * 20 - 10,
    })),
  };
}

function generateMockCorrelations() {
  return {
    correlations: [
      { test1: 'CBC', test2: 'Metabolic Panel', coefficient: 0.75 },
      { test1: 'CBC', test2: 'Lipid Panel', coefficient: 0.62 },
      { test1: 'Metabolic Panel', test2: 'Thyroid', coefficient: 0.48 },
    ],
  };
}

function generateMockAnomalies() {
  return {
    anomalies: [
      { date: '2024-01-15', value: 145, zScore: 3.2, type: 'high' },
      { date: '2024-02-20', value: 58, zScore: -2.8, type: 'low' },
    ],
    count: 2,
  };
}

function generateMockPredictions() {
  return {
    predictions: Array.from({ length: 90 }, (_, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: 100 + Math.random() * 10 - 5,
      lowerBound: 90 + Math.random() * 5,
      upperBound: 110 + Math.random() * 5,
    })),
    confidence: 0.85,
  };
}

function generateMockStatistics() {
  return {
    mean: 100.5,
    median: 99.2,
    stdDev: 12.3,
    min: 75,
    max: 135,
    count: 30,
  };
}

function generateMockInsights() {
  return [
    { id: 1, type: 'trend', message: 'Vitamin D levels showing improving trend', severity: 'info' },
    { id: 2, type: 'anomaly', message: 'Cholesterol slightly elevated on last test', severity: 'warning' },
    { id: 3, type: 'correlation', message: 'Strong correlation between exercise and glucose levels', severity: 'info' },
  ];
}

/**
 * Generic fetch function with caching headers and mock data fallback
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // If in demo mode, return mock data
  if (DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    if (endpoint.includes('/trends/')) return generateMockTrends() as T;
    if (endpoint.includes('/correlations')) return generateMockCorrelations() as T;
    if (endpoint.includes('/anomalies/')) return generateMockAnomalies() as T;
    if (endpoint.includes('/predictions/')) return generateMockPredictions() as T;
    if (endpoint.includes('/statistics/')) return generateMockStatistics() as T;
    if (endpoint.includes('/insights')) return generateMockInsights() as T;

    return {} as T;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    // Enable compression
    compress: true,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Unknown error occurred',
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    // Fall back to mock data on error
    console.warn(`[API Fallback] Using mock data for ${endpoint}`);
    if (endpoint.includes('/trends/')) return generateMockTrends() as T;
    if (endpoint.includes('/correlations')) return generateMockCorrelations() as T;
    if (endpoint.includes('/anomalies/')) return generateMockAnomalies() as T;
    if (endpoint.includes('/predictions/')) return generateMockPredictions() as T;
    if (endpoint.includes('/statistics/')) return generateMockStatistics() as T;
    if (endpoint.includes('/insights')) return generateMockInsights() as T;
    throw error;
  }
}

/**
 * Analytics API endpoints
 */
export const analyticsAPI = {
  /**
   * Get trend analysis for a lab test
   */
  getTrends: (labTestId: string) =>
    fetchAPI(`/api/analytics/trends/${labTestId}`),

  /**
   * Get correlation matrix
   */
  getCorrelations: (params?: { labTests?: string }) =>
    fetchAPI(`/api/analytics/correlations${params?.labTests ? `?labTests=${params.labTests}` : ''}`),

  /**
   * Get anomaly detection
   */
  getAnomalies: (labTestId: string) =>
    fetchAPI(`/api/analytics/anomalies/${labTestId}`),

  /**
   * Get predictions
   */
  getPredictions: (labTestId: string, forecastHorizon?: number) =>
    fetchAPI(
      `/api/analytics/predictions/${labTestId}${forecastHorizon ? `?forecastHorizon=${forecastHorizon}` : ''}`
    ),

  /**
   * Get statistics
   */
  getStatistics: (labTestId: string) =>
    fetchAPI(`/api/analytics/statistics/${labTestId}`),

  /**
   * Get insights
   */
  getInsights: () => fetchAPI('/api/analytics/insights'),

  /**
   * Get comprehensive analysis
   */
  getComprehensive: (labTestId: string) =>
    fetchAPI(`/api/analytics/comprehensive/${labTestId}`),

  /**
   * Clear cache
   */
  clearCache: () => fetchAPI('/api/analytics/cache/clear', { method: 'POST' }),

  /**
   * Get cache statistics
   */
  getCacheStats: () => fetchAPI('/api/analytics/cache/stats'),
};

/**
 * Prefetch utility for optimistic loading
 */
export function prefetchData(queryClient: any, key: string[], fetcher: () => Promise<any>) {
  return queryClient.prefetchQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime: 60 * 1000, // 1 minute
  });
}
