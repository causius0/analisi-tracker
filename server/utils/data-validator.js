/**
 * Data Validation System for Medical Lab Results
 *
 * Validates extracted lab data against medical standards and detects anomalies
 */

// Reference ranges for common lab tests (Italian medical standards)
const REFERENCE_RANGES = {
  // Blood tests
  hemoglobin: {
    male: { min: 13.5, max: 17.5, unit: 'g/dL' },
    female: { min: 12.0, max: 15.5, unit: 'g/dL' }
  },
  rbc: {
    male: { min: 4.5, max: 5.9, unit: '10^6/µL' },
    female: { min: 4.0, max: 5.2, unit: '10^6/µL' }
  },
  wbc: {
    all: { min: 4.5, max: 11.0, unit: '10^3/µL' }
  },
  platelets: {
    all: { min: 150, max: 450, unit: '10^3/µL' }
  },
  hematocrit: {
    male: { min: 41, max: 50, unit: '%' },
    female: { min: 36, max: 44, unit: '%' }
  },

  // Metabolic
  glucose: {
    all: { min: 70, max: 100, unit: 'mg/dL', fasting: true }
  },
  cholesterol: {
    all: { min: 0, max: 200, unit: 'mg/dL' }
  },
  triglycerides: {
    all: { min: 0, max: 150, unit: 'mg/dL' }
  },
  uricAcid: {
    male: { min: 3.4, max: 7.0, unit: 'mg/dL' },
    female: { min: 2.4, max: 5.7, unit: 'mg/dL' }
  },

  // Liver
  alt: {
    all: { min: 0, max: 40, unit: 'U/L' }
  },
  ast: {
    all: { min: 0, max: 40, unit: 'U/L' }
  },
  gammaGT: {
    male: { min: 0, max: 60, unit: 'U/L' },
    female: { min: 0, max: 40, unit: 'U/L' }
  },
  bilirubin: {
    all: { min: 0.3, max: 1.2, unit: 'mg/dL' }
  },

  // Kidney
  creatinine: {
    male: { min: 0.7, max: 1.3, unit: 'mg/dL' },
    female: { min: 0.6, max: 1.1, unit: 'mg/dL' }
  },
  egfr: {
    all: { min: 90, max: 120, unit: 'mL/min/1.73m²' }
  },
  urea: {
    all: { min: 7, max: 20, unit: 'mg/dL' }
  },

  // Thyroid
  tsh: {
    all: { min: 0.4, max: 4.0, unit: 'mIU/L' }
  },
  t3: {
    all: { min: 80, max: 180, unit: 'ng/dL' }
  },
  t4: {
    all: { min: 0.8, max: 1.8, unit: 'ng/dL' }
  }
};

// Test name mappings (Italian → English)
const TEST_NAME_MAPPINGS = {
  'emoglobina': 'hemoglobin',
  'globuli rossi': 'rbc',
  'globuli bianchi': 'wbc',
  'piastrine': 'platelets',
  'ematocrito': 'hematocrit',
  'glicemia': 'glucose',
  'colesterolo': 'cholesterol',
  'trigliceridi': 'triglycerides',
  'acido urico': 'uricAcid',
  'alt': 'alt',
  'ast': 'ast',
  'gamma gt': 'gammaGT',
  'bilirubina': 'bilirubin',
  'creatinina': 'creatinine',
  'egfr': 'egfr',
  'azotemia': 'urea',
  'urea': 'urea',
  'tsh': 'tsh',
  't3': 't3',
  't4': 't4'
};

/**
 * Normalize test name to English
 */
function normalizeTestName(name) {
  if (!name) return 'unknown';

  const normalizedName = name.toLowerCase().trim();
  return TEST_NAME_MAPPINGS[normalizedName] || normalizedName;
}

/**
 * Validate a single lab test value
 */
function validateLabTest(test, patient) {
  const normalized = normalizeTestName(test.name);
  const reference = REFERENCE_RANGES[normalized];

  if (!reference) {
    return {
      valid: true,
      flag: 'unknown',
      message: 'No reference range available'
    };
  }

  // Get appropriate range based on gender
  let range;
  if (patient.gender === 'M' && reference.male) {
    range = reference.male;
  } else if (patient.gender === 'F' && reference.female) {
    range = reference.female;
  } else {
    range = reference.all;
  }

  if (!range) {
    return {
      valid: true,
      flag: 'unknown',
      message: 'No reference range for this gender'
    };
  }

  // Parse numeric value
  const value = parseFloat(test.value);
  if (isNaN(value)) {
    return {
      valid: false,
      flag: 'error',
      message: 'Invalid numeric value'
    };
  }

  // Check against reference range
  if (value < range.min) {
    return {
      valid: true,
      flag: 'low',
      message: `Below reference range (${range.min} - ${range.max} ${range.unit})`,
      referenceRange: `${range.min} - ${range.max} ${range.unit}`,
      severity: calculateSeverity(value, range.min, range.max, 'low')
    };
  } else if (value > range.max) {
    return {
      valid: true,
      flag: 'high',
      message: `Above reference range (${range.min} - ${range.max} ${range.unit})`,
      referenceRange: `${range.min} - ${range.max} ${range.unit}`,
      severity: calculateSeverity(value, range.min, range.max, 'high')
    };
  } else {
    return {
      valid: true,
      flag: 'normal',
      message: 'Within reference range',
      referenceRange: `${range.min} - ${range.max} ${range.unit}`
    };
  }
}

/**
 * Calculate severity of abnormal value
 */
function calculateSeverity(value, min, max, direction) {
  const range = max - min;
  const deviation = direction === 'high'
    ? (value - max) / range
    : (min - value) / range;

  if (deviation > 0.5) return 'critical';
  if (deviation > 0.2) return 'moderate';
  return 'mild';
}

/**
 * Validate all lab tests for a patient
 */
function validateLabResults(labResults, patient) {
  const validationResults = [];

  for (const result of labResults) {
    const testValidation = {
      date: result.date,
      tests: [],
      overall: {
        total: 0,
        normal: 0,
        abnormal: 0,
        critical: 0
      }
    };

    for (const test of result.labTests || []) {
      const validation = validateLabTest(test, patient);
      testValidation.tests.push({
        name: test.name,
        value: test.value,
        unit: test.unit,
        ...validation
      });

      testValidation.overall.total++;
      if (validation.flag === 'normal') {
        testValidation.overall.normal++;
      } else if (validation.flag === 'high' || validation.flag === 'low') {
        testValidation.overall.abnormal++;
        if (validation.severity === 'critical') {
          testValidation.overall.critical++;
        }
      }
    }

    validationResults.push(testValidation);
  }

  return validationResults;
}

/**
 * Detect anomalies in lab test trends
 */
function detectAnomalies(patient, validationResults) {
  const anomalies = [];

  for (let i = 1; i < validationResults.length; i++) {
    const prev = validationResults[i - 1];
    const curr = validationResults[i];

    // Compare each test
    for (const prevTest of prev.tests) {
      const currTest = curr.tests.find(t => t.name === prevTest.name);

      if (currTest) {
        const prevValue = parseFloat(prevTest.value);
        const currValue = parseFloat(currTest.value);

        if (!isNaN(prevValue) && !isNaN(currValue)) {
          const change = currValue - prevValue;
          const percentChange = (change / prevValue) * 100;

          // Flag significant changes (>50% change)
          if (Math.abs(percentChange) > 50) {
            anomalies.push({
              testName: currTest.name,
              date: curr.date,
              previousDate: prev.date,
              change: change,
              percentChange: percentChange,
              direction: change > 0 ? 'increased' : 'decreased',
              severity: Math.abs(percentChange) > 100 ? 'critical' : 'moderate'
            });
          }
        }
      }
    }
  }

  return anomalies;
}

/**
 * Generate validation report
 */
function generateValidationReport(patients) {
  const report = {
    timestamp: new Date().toISOString(),
    patients: {},
    summary: {
      totalPatients: 0,
      totalLabResults: 0,
      totalTests: 0,
      normalTests: 0,
      abnormalTests: 0,
      criticalTests: 0,
      anomalies: []
    }
  };

  for (const [patientId, patient] of Object.entries(patients)) {
    const validationResults = validateLabResults(patient.labResults, patient);
    const anomalies = detectAnomalies(patient, validationResults);

    report.patients[patientId] = {
      patientId,
      patientName: patient.name,
      validationResults,
      anomalies,
      stats: {
        labResultsCount: patient.labResults?.length || 0,
        totalTests: validationResults.reduce((sum, r) => sum + r.overall.total, 0),
        normalTests: validationResults.reduce((sum, r) => sum + r.overall.normal, 0),
        abnormalTests: validationResults.reduce((sum, r) => sum + r.overall.abnormal, 0),
        criticalTests: validationResults.reduce((sum, r) => sum + r.overall.critical, 0),
        anomaliesCount: anomalies.length
      }
    };

    report.summary.totalPatients++;
    report.summary.totalLabResults += report.patients[patientId].stats.labResultsCount;
    report.summary.totalTests += report.patients[patientId].stats.totalTests;
    report.summary.normalTests += report.patients[patientId].stats.normalTests;
    report.summary.abnormalTests += report.patients[patientId].stats.abnormalTests;
    report.summary.criticalTests += report.patients[patientId].stats.criticalTests;
    report.summary.anomalies.push(...anomalies);
  }

  return report;
}

export {
  normalizeTestName,
  validateLabTest,
  validateLabResults,
  detectAnomalies,
  generateValidationReport,
  REFERENCE_RANGES,
  TEST_NAME_MAPPINGS
};
