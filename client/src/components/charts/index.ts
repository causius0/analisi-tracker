// Main chart components
export { IndividualLabChart } from './IndividualLabChart';
export { ComparisonChart } from './ComparisonChart';
export { CorrelationHeatMap } from './CorrelationHeatMap';
export { ControlChart } from './ControlChart';
export { Sparkline, SparklineGroup } from './Sparkline';
export { DistributionPlot } from './DistributionPlot';

// Supporting components
export { AnnotationSystem, AnnotationMarker } from './AnnotationSystem';
export { ChartConfigPanel } from './ChartConfigPanel';

// Types
export type {
  DataPoint,
  Annotation,
  TrendLine,
  ConfidenceInterval,
  PredictionData,
  ChartConfig,
  ComparisonSeries,
  CorrelationData,
  ControlChartData,
  DistributionData,
  BoxPlotData,
  ChartExportOptions,
} from '../types/charts';

// Utilities
export {
  calculateMovingAverage,
  calculateLinearRegression,
  calculateConfidenceInterval,
  calculatePredictions,
  calculatePercentageChange,
  detectOutliers,
  normalizeToPercent,
  calculateZScores,
  calculateCorrelation,
  formatDate,
  formatValue,
  generateColorPalette,
} from '../utils/chartCalculations';

export {
  exportAsPNG,
  exportAsSVG,
  exportAsPDF,
  exportAsCSV,
  exportChart,
  printChart,
  shareChartAsImage,
  generateShareableLink,
  downloadChartConfig,
} from '../utils/chartExport';

export {
  useVirtualizedData,
  useAggregatedData,
  useLazyLoadedData,
  useDebouncedResize,
  useMemoizedCalculations,
  useProgressiveRendering,
  chartCache,
  useChartPerformance,
  useSmartSampledData,
} from '../utils/chartPerformance';

export { cn } from '../utils/cn';
