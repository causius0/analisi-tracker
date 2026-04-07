/**
 * Test script for analytics engine
 * Demonstrates all analytics capabilities
 */

import { analyzeSingleLabTest, analyzeMultipleLabTests } from '../server/analytics/engine.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load sample data
const sampleDataPath = join(__dirname, '../data/sample-data.json');
const sampleData = JSON.parse(readFileSync(sampleDataPath, 'utf-8'));

console.log('='.repeat(80));
console.log('ANALISI TRACKER - ANALYTICS ENGINE TEST');
console.log('='.repeat(80));
console.log();

// Test 1: Single lab test analysis
console.log('TEST 1: Single Lab Test Analysis (Creatinine)');
console.log('-'.repeat(80));

try {
  const creatinineData = sampleData.labTests.creatinine.data;

  const analysis = analyzeSingleLabTest(creatinineData, {
    labTestId: 'creatinine',
    referenceRange: sampleData.labTests.creatinine.referenceRange,
    includeTrends: true,
    includeAnomalies: true,
    includePredictions: true,
    forecastHorizon: 30
  });

  console.log('\n📊 Statistics:');
  console.log(`   Mean: ${analysis.statistics.mean.toFixed(2)} mg/dL`);
  console.log(`   Std Dev: ${analysis.statistics.standardDeviation.toFixed(2)} mg/dL`);
  console.log(`   Range: ${analysis.statistics.minimum.toFixed(2)} - ${analysis.statistics.maximum.toFixed(2)} mg/dL`);

  console.log('\n📈 Trends:');
  console.log(`   Direction: ${analysis.trends.overall.direction}`);
  console.log(`   Slope: ${analysis.trends.overall.rateOfChange.absolute.toFixed(4)} mg/dL/day`);
  console.log(`   Strength: ${analysis.trends.overall.strength.level}`);

  console.log('\n⚠️  Anomalies:');
  console.log(`   Total: ${analysis.anomalies.totalCount}`);
  console.log(`   Statistical: ${analysis.anomalies.statistical.totalAnomalies}`);
  console.log(`   Rate of Change: ${analysis.anomalies.rateOfChange.totalAnomalies}`);

  console.log('\n🔮 Predictions:');
  console.log(`   Risk Level: ${analysis.predictions.risk.riskLevel}`);
  console.log(`   Risk Score: ${analysis.predictions.risk.riskScore.toFixed(0)}/100`);
  console.log(`   Forecasted Value (30 days): ${analysis.predictions.forecasts.forecasts[29].value.toFixed(2)} mg/dL`);

  console.log('\n💡 Insights:');
  analysis.insights.slice(0, 3).forEach(insight => {
    console.log(`   [${insight.priority.toUpperCase()}] ${insight.message}`);
  });

  console.log('\n📝 Summary:');
  console.log(`   ${analysis.summary}`);

} catch (error) {
  console.error('Error in single lab test analysis:', error.message);
}

console.log();
console.log('='.repeat(80));

// Test 2: Multiple lab tests comparison
console.log('\nTEST 2: Multiple Lab Tests Analysis (Correlations)');
console.log('-'.repeat(80));

try {
  const dataByLabTest = {};
  dataByLabTest.creatinine = sampleData.labTests.creatinine.data;
  dataByLabTest.egfr = sampleData.labTests.egfr.data;

  const analysis = analyzeMultipleLabTests(dataByLabTest, {
    includeLagged: false,
    includeRolling: false
  });

  console.log('\n🔗 Correlations:');
  console.log(`   Correlation Coefficient: ${analysis.correlations.matrix.matrix.creatinine.egfr.toFixed(3)}`);
  console.log(`   Direction: ${analysis.correlations.matrix.matrix.creatinine.egfr > 0 ? 'Positive' : 'Negative'}`);
  console.log(`   Significant: ${analysis.correlations.matrix.significantPairs.length > 0 ? 'Yes' : 'No'}`);

  console.log('\n🎯 Composite Scores:');
  if (analysis.compositeScores.kidneyFunction) {
    console.log(`   Kidney Function: ${analysis.compositeScores.kidneyFunction.score}/100 (${analysis.compositeScores.kidneyFunction.level})`);
    console.log(`   Factors: ${analysis.compositeScores.kidneyFunction.factors.join(', ')}`);
  }

} catch (error) {
  console.error('Error in multiple lab tests analysis:', error.message);
}

console.log();
console.log('='.repeat(80));

// Test 3: Glucose with time in range
console.log('\nTEST 3: Glucose Analysis with Time in Range');
console.log('-'.repeat(80));

try {
  const glucoseData = sampleData.labTests.glucose.data;

  const analysis = analyzeSingleLabTest(glucoseData, {
    labTestId: 'glucose',
    referenceRange: sampleData.labTests.glucose.referenceRange,
    targetRange: sampleData.labTests.glucose.targetRange,
    includeTrends: true,
    includeAnomalies: true,
    includePredictions: false
  });

  console.log('\n📊 Statistics:');
  console.log(`   Mean: ${analysis.statistics.mean.toFixed(2)} mg/dL`);
  console.log(`   Std Dev: ${analysis.statistics.standardDeviation.toFixed(2)} mg/dL`);

  console.log('\n🎯 Time in Target Range:');
  console.log(`   Percentage: ${analysis.timeInRange.percentage.toFixed(1)}%`);
  console.log(`   Count: ${analysis.timeInRange.count}/${analysis.timeInRange.total}`);
  console.log(`   Target Range: ${analysis.timeInRange.targetRange.min} - ${analysis.timeInRange.targetRange.max} mg/dL`);

  console.log('\n📈 Trends:');
  console.log(`   Direction: ${analysis.trends.overall.direction}`);
  console.log(`   Rate of Change: ${analysis.trends.overall.rateOfChange.percentage.toFixed(2)}% per day`);

} catch (error) {
  console.error('Error in glucose analysis:', error.message);
}

console.log();
console.log('='.repeat(80));

// Test 4: ALT with anomaly detection
console.log('\nTEST 4: ALT Anomaly Detection');
console.log('-'.repeat(80));

try {
  const altData = sampleData.labTests.alt.data;

  const analysis = analyzeSingleLabTest(altData, {
    labTestId: 'alt',
    referenceRange: sampleData.labTests.alt.referenceRange,
    includeTrends: false,
    includeAnomalies: true,
    includePredictions: false
  });

  console.log('\n📊 Statistics:');
  console.log(`   Mean: ${analysis.statistics.mean.toFixed(2)} U/L`);
  console.log(`   Max: ${analysis.statistics.maximum.toFixed(2)} U/L`);

  console.log('\n⚠️  Anomalies:');
  console.log(`   Total Anomalies: ${analysis.anomalies.totalCount}`);
  console.log(`   Statistical Outliers: ${analysis.anomalies.statistical.totalAnomalies}`);
  console.log(`   Rate of Change Anomalies: ${analysis.anomalies.rateOfChange.totalAnomalies}`);

  if (analysis.anomalies.rateOfChange.anomalies.length > 0) {
    console.log('\n   Rapid Changes Detected:');
    analysis.anomalies.rateOfChange.anomalies.slice(0, 3).forEach(anomaly => {
      console.log(`   - ${anomaly.type}: ${anomaly.absoluteChange.toFixed(2)} U/L (${anomaly.percentageChange.toFixed(1)}%)`);
    });
  }

} catch (error) {
  console.error('Error in ALT analysis:', error.message);
}

console.log();
console.log('='.repeat(80));
console.log('\n✅ All tests completed successfully!');
console.log('\nNext steps:');
console.log('1. Start the server: npm start');
console.log('2. Test API endpoints: curl http://localhost:3000/api/analytics/trends/creatinine');
console.log('3. View documentation: http://localhost:3000');
console.log();
