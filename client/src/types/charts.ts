import { ReactNode } from 'react';

export interface DataPoint {
  date: string;
  value: number;
  id?: string;
  notes?: string;
  medications?: string[];
  events?: string[];
}

export interface Annotation {
  id: string;
  dataPointId: string;
  note: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrendLine {
  type: 'linear' | 'polynomial' | 'moving-average';
  window?: number;
  order?: number;
  color: string;
}

export interface ConfidenceInterval {
  upper: number[];
  lower: number[];
  level: number; // 0.95 for 95% confidence
}

export interface PredictionData {
  predicted: number[];
  confidenceUpper: number[];
  confidenceLower: number[];
  dates: string[];
}

export interface ChartConfig {
  showTrendLine: boolean;
  showConfidenceInterval: boolean;
  showPredictions: boolean;
  showAnnotations: boolean;
  showReferenceRange: boolean;
  enableZoom: boolean;
  enablePan: boolean;
  trendLineType: 'linear' | 'polynomial' | 'moving-average';
  movingAverageWindow: number;
  predictionPeriods: number;
  colors: {
    primary: string;
    trend: string;
    confidence: string;
    prediction: string;
    reference: string;
  };
}

export interface ComparisonSeries {
  id: string;
  name: string;
  data: DataPoint[];
  unit: string;
  color: string;
  yAxisPosition: 'left' | 'right';
  referenceRange?: {
    min: number;
    max: number;
  };
}

export interface CorrelationData {
  x: string;
  y: string;
  value: number;
  significant: boolean;
}

export interface ControlChartData {
  value: number;
  upperControlLimit: number;
  lowerControlLimit: number;
  centerLine: number;
  outOfControl: boolean;
  ruleViolation?: string;
}

export interface DistributionData {
  range: string;
  count: number;
  percentage: number;
}

export interface BoxPlotData {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
}

export interface ChartExportOptions {
  format: 'png' | 'svg' | 'pdf' | 'csv';
  filename: string;
  includeData: boolean;
  width?: number;
  height?: number;
  scale?: number;
}
