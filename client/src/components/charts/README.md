# Advanced Data Visualization Components

Production-ready chart components for the analisi-tracker medical analytics platform. Built with Recharts and React, following medical data visualization best practices.

## Features

### 1. Individual Lab Charts (`IndividualLabChart`)

Enhanced trend visualization with advanced statistical features:

- **Trend Lines**: Moving average, linear regression, polynomial fitting
- **Confidence Intervals**: Statistical confidence bands (95%, 99%)
- **Predictions**: ARIMA-based forecasting with prediction intervals
- **Annotations**: User notes on data points
- **Zoom & Pan**: Interactive exploration with brush selection
- **Reference Ranges**: Highlight normal ranges
- **Tooltips**: Full context (value, date, % change, notes)
- **Export**: PNG/SVG/PDF export

```tsx
import { IndividualLabChart } from './components/charts';

<IndividualLabChart
  data={labData}
  labTestName="Creatinine"
  unit="mg/dL"
  referenceRange={{ min: 0.7, max: 1.3 }}
  config={{
    showTrendLine: true,
    showConfidenceInterval: true,
    showPredictions: true,
    trendLineType: 'moving-average',
    movingAverageWindow: 3,
  }}
  annotations={annotations}
  onAnnotationAdd={(id, note) => addAnnotation(id, note)}
  onAnnotationDelete={(id) => deleteAnnotation(id)}
/>
```

### 2. Comparison Charts (`ComparisonChart`)

Multi-parameter comparison with dual Y-axis support:

- **Dual Y-Axis**: Compare parameters with different units
- **Normalization**: Percent of range, Z-score scaling
- **Correlation Matrix**: Pearson correlation coefficients
- **Interactive Legend**: Toggle series visibility
- **Synchronized Tooltips**: Hover effects across all series
- **Reference Ranges**: Per-series normal ranges

```tsx
import { ComparisonChart } from './components/charts';

<ComparisonChart
  series={[
    {
      id: 'creatinine',
      name: 'Creatinine',
      data: creatinineData,
      unit: 'mg/dL',
      color: '#0d9488',
      yAxisPosition: 'left',
      referenceRange: { min: 0.7, max: 1.3 },
    },
    {
      id: 'gfr',
      name: 'GFR',
      data: gfrData,
      unit: 'mL/min',
      color: '#3b82f6',
      yAxisPosition: 'right',
      referenceRange: { min: 90, max: 120 },
    },
  ]}
  normalizationMode="none"
  showCorrelation={true}
/>
```

### 3. Correlation Heat Map (`CorrelationHeatMap`)

Visual correlation matrix for multi-parameter analysis:

- **Color-Coded Correlations**: Blue (positive) / Red (negative)
- **Significance Testing**: p-value markers
- **Interactive Tooltips**: Detailed correlation info
- **Multiple Color Schemes**: Blue, Red, Green
- **Export Options**: PNG, SVG

```tsx
import { CorrelationHeatMap } from './components/charts';

<CorrelationHeatMap
  data={{
    creatinine: creatinineData,
    gfr: gfrData,
    bun: bunData,
  }}
  significanceThreshold={0.05}
  colorScheme="blue"
  showLabels={true}
/>
```

### 4. Control Charts (`ControlChart`)

Statistical process control (SPC) for monitoring:

- **Westward Rules**: 7 pattern detection rules
- **Control Limits**: Configurable sigma levels (1σ, 2σ, 3σ)
- **Violation Detection**: Automatic outlier identification
- **Severity Levels**: Warning vs Critical
- **Process Status**: Stable / Warning / Out-of-Control

```tsx
import { ControlChart } from './components/charts';

<ControlChart
  data={labData}
  labTestName="HbA1c"
  unit="%"
  sigma={3}
  showRules={true}
  enableWestwardRules={true}
/>
```

**Westward Rules:**
1. Beyond control limits
2. 2 of 3 points in Zone A
3. 4 of 5 points in Zone B
4. 6 consecutive points on one side
5. 6 point trend (increasing/decreasing)
6. 14 alternating points
7. 15 points in Zone C (stratification)

### 5. Sparklines (`Sparkline`)

Trend-at-a-glance mini charts:

- **Compact Size**: Perfect for dashboards
- **Trend Indicators**: Up/down/neutral with icons
- **Percentage Change**: Automatic calculation
- **Customizable Colors**: Match your theme
- **Tooltips**: Detailed info on hover

```tsx
import { Sparkline, SparklineGroup } from './components/charts';

// Single sparkline
<Sparkline
  data={labData}
  width={120}
  height={40}
  showTrendIndicator={true}
  showPercentage={true}
/>

// Multiple sparklines
<SparklineGroup
  data={{
    Creatinine: creatinineData,
    GFR: gfrData,
    BUN: bunData,
  }}
  showTrendIndicator={true}
/>
```

### 6. Distribution Plots (`DistributionPlot`)

Statistical distribution analysis:

- **Histograms**: Frequency distribution
- **Box Plots**: Five-number summary (min, Q1, median, Q3, max)
- **Statistics**: Mean, median, mode, SD, variance, skewness, kurtosis
- **Outliers**: Automatic detection and display
- **Reference Ranges**: Visual overlay

```tsx
import { DistributionPlot } from './components/charts';

<DistributionPlot
  data={labData}
  labTestName="Creatinine"
  unit="mg/dL"
  referenceRange={{ min: 0.7, max: 1.3 }}
  binCount={10}
  showHistogram={true}
  showBoxPlot={true}
  showStatistics={true}
/>
```

## Performance Optimizations

### Virtualization
For datasets with 10,000+ points:

```tsx
import { useVirtualizedData } from './components/charts';

function MyChart() {
  const virtualizedData = useVirtualizedData(
    largeDataset,
    containerWidth,
    pointWidth
  );

  return <IndividualLabChart data={virtualizedData} />;
}
```

### Data Aggregation
Automatically aggregate data by time intervals:

```tsx
import { useAggregatedData } from './components/charts';

const aggregatedData = useAggregatedData(
  rawData,
  'day' // 'hour' | 'day' | 'week' | 'month'
);
```

### Smart Sampling
Intelligent data sampling preserving features:

```tsx
import { useSmartSampledData } from './components/charts';

const sampledData = useSmartSampledData(
  hugeDataset,
  1000 // max points
);
```

### Progressive Rendering
Render in stages to prevent blocking:

```tsx
import { useProgressiveRendering } from './components/charts';

const { currentData, progress, isComplete } = useProgressiveRendering(
  dataset,
  3 // number of stages
);
```

## Chart Configuration

All charts support a unified configuration system:

```tsx
import { ChartConfigPanel } from './components/charts';

function ChartWithConfig() {
  const [config, setConfig] = useState<Partial<ChartConfig>>({
    showTrendLine: true,
    showConfidenceInterval: true,
    colors: {
      primary: '#0d9488',
      trend: '#f59e0b',
    },
  });

  return (
    <>
      <ChartConfigPanel
        config={config}
        onChange={setConfig}
        onSave={() => saveConfig(config)}
        onReset={() => setConfig(defaultConfig)}
      />
      <IndividualLabChart config={config} />
    </>
  );
}
```

## Annotation System

Add notes to data points:

```tsx
import { AnnotationSystem } from './components/charts';

<AnnotationSystem
  data={labData}
  annotations={annotations}
  currentUserId={user.id}
  onAdd={async (dataPointId, note) => {
    await saveAnnotation(dataPointId, note);
  }}
  onUpdate={async (annotationId, note) => {
    await updateAnnotation(annotationId, note);
  }}
  onDelete={async (annotationId) => {
    await deleteAnnotation(annotationId);
  }}
/>
```

## Export Functionality

Export charts in multiple formats:

```tsx
import {
  exportAsPNG,
  exportAsPDF,
  exportAsCSV,
  printChart,
  shareChartAsImage
} from './components/charts';

// Export as PNG
await exportAsPNG(chartElement, {
  filename: 'creatinine-chart',
  scale: 2,
});

// Export as PDF
await exportAsPDF(chartElement, {
  filename: 'creatinine-report',
  width: 800,
  height: 600,
});

// Export data as CSV
await exportAsCSV(chartData, {
  filename: 'creatinine-data',
});

// Print chart
printChart(chartElement);

// Copy to clipboard
await shareChartAsImage(chartElement);
```

## Styling & Theming

All components support Tailwind CSS dark mode:

```tsx
// Automatic dark mode support
<div className="dark">
  <IndividualLabChart className="custom-styles" />
</div>
```

Custom colors via config:

```tsx
const config: ChartConfig = {
  colors: {
    primary: '#0d9488',
    trend: '#f59e0b',
    confidence: 'rgba(13, 148, 136, 0.2)',
    prediction: '#8b5cf6',
    reference: '#ef4444',
  },
};
```

## Best Practices

### Medical Data Visualization

1. **Reference Ranges**: Always show normal ranges for context
2. **Statistical Significance**: Use confidence intervals for trend lines
3. **Color Accessibility**: Ensure high contrast (WCAG AA minimum)
4. **Annotation**: Allow clinicians to add context to outliers
5. **Export**: Provide print-optimized layouts for reports

### Performance

1. **Virtualize** datasets > 10,000 points
2. **Aggregate** time-series data by day/week/month
3. **Cache** expensive calculations
4. **Lazy load** chart data on scroll
5. **Debounce** resize handlers

### Accessibility

1. **Keyboard Navigation**: All interactive elements accessible
2. **Screen Readers**: Proper ARIA labels on charts
3. **Color Blindness**: Use patterns + colors
4. **High Contrast**: Minimum 4.5:1 ratio
5. **Tooltips**: Descriptive text for screen readers

## API Reference

See `./types/charts.ts` for complete TypeScript type definitions.

### DataPoint
```tsx
interface DataPoint {
  date: string;
  value: number;
  id?: string;
  notes?: string;
  medications?: string[];
  events?: string[];
}
```

### ChartConfig
```tsx
interface ChartConfig {
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
```

## Dependencies

- `recharts`: Chart rendering
- `chart.js` + `react-chartjs-2`: Advanced chart types
- `html2canvas`: Chart export
- `jspdf`: PDF generation
- `date-fns`: Date formatting
- `lucide-react`: Icons
- `@radix-ui/*`: UI primitives

## License

MIT

## Contributing

Contributions welcome! Please ensure:
1. All components are TypeScript
2. Dark mode support
3. Accessibility compliance
4. Performance optimized for large datasets
5. Comprehensive JSDoc comments
