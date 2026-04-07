import { describe, it, expect } from 'vitest';
import {
  normalizeTestName,
  validateLabTest,
  validateLabResults,
  detectAnomalies,
  generateValidationReport,
  REFERENCE_RANGES
} from './data-validator.js';

describe('Data Validator - normalizeTestName', () => {
  it('should normalize Italian test names to English', () => {
    expect(normalizeTestName('emoglobina')).toBe('hemoglobin');
    expect(normalizeTestName('globuli rossi')).toBe('rbc');
    expect(normalizeTestName('globuli bianchi')).toBe('wbc');
    expect(normalizeTestName('piastrine')).toBe('platelets');
    expect(normalizeTestName('glicemia')).toBe('glucose');
  });

  it('should handle case insensitive input', () => {
    expect(normalizeTestName('EMOGLOBINA')).toBe('hemoglobin');
    expect(normalizeTestName('Emoglobina')).toBe('hemoglobin');
    expect(normalizeTestName('  emoglobina  ')).toBe('hemoglobin');
  });

  it('should return original name if not in mapping', () => {
    expect(normalizeTestName('custom test')).toBe('custom test');
  });

  it('should handle empty input', () => {
    expect(normalizeTestName('')).toBe('unknown');
    expect(normalizeTestName(null)).toBe('unknown');
    expect(normalizeTestName(undefined)).toBe('unknown');
  });
});

describe('Data Validator - validateLabTest', () => {
  const malePatient = { gender: 'M', age: 30 };
  const femalePatient = { gender: 'F', age: 30 };

  it('should validate normal hemoglobin for male', () => {
    const result = validateLabTest(
      { name: 'hemoglobin', value: '15.0', unit: 'g/dL' },
      malePatient
    );

    expect(result.valid).toBe(true);
    expect(result.flag).toBe('normal');
    expect(result.referenceRange).toBe('13.5 - 17.5 g/dL');
  });

  it('should validate normal hemoglobin for female', () => {
    const result = validateLabTest(
      { name: 'hemoglobin', value: '13.5', unit: 'g/dL' },
      femalePatient
    );

    expect(result.valid).toBe(true);
    expect(result.flag).toBe('normal');
    expect(result.referenceRange).toBe('12 - 15.5 g/dL');
  });

  it('should detect high hemoglobin', () => {
    const result = validateLabTest(
      { name: 'hemoglobin', value: '18.5', unit: 'g/dL' },
      malePatient
    );

    expect(result.valid).toBe(true);
    expect(result.flag).toBe('high');
    // deviation = (18.5 - 17.5) / (17.5 - 13.5) = 0.25 → moderate
    expect(result.severity).toBe('moderate');
    expect(result.message).toContain('Above reference range');
  });

  it('should detect low hemoglobin', () => {
    const result = validateLabTest(
      { name: 'hemoglobin', value: '12.0', unit: 'g/dL' },
      malePatient
    );

    expect(result.valid).toBe(true);
    expect(result.flag).toBe('low');
    // deviation = (13.5 - 12.0) / (17.5 - 13.5) = 0.375 → moderate
    expect(result.severity).toBe('moderate');
    expect(result.message).toContain('Below reference range');
  });

  it('should calculate severity correctly', () => {
    const mildHigh = validateLabTest(
      { name: 'hemoglobin', value: '18.0', unit: 'g/dL' },
      malePatient
    );
    expect(mildHigh.severity).toBe('mild');

    const moderateHigh = validateLabTest(
      { name: 'hemoglobin', value: '19.5', unit: 'g/dL' },
      malePatient
    );
    expect(moderateHigh.severity).toBe('moderate');

    const criticalHigh = validateLabTest(
      { name: 'hemoglobin', value: '22.0', unit: 'g/dL' },
      malePatient
    );
    expect(criticalHigh.severity).toBe('critical');
  });

  it('should handle invalid numeric values', () => {
    const result = validateLabTest(
      { name: 'hemoglobin', value: 'invalid', unit: 'g/dL' },
      malePatient
    );

    expect(result.valid).toBe(false);
    expect(result.flag).toBe('error');
    expect(result.message).toBe('Invalid numeric value');
  });

  it('should handle unknown tests', () => {
    const result = validateLabTest(
      { name: 'unknown test', value: '100', unit: 'mg/dL' },
      malePatient
    );

    expect(result.valid).toBe(true);
    expect(result.flag).toBe('unknown');
    expect(result.message).toBe('No reference range available');
  });

  it('should validate gender-specific tests', () => {
    const maleResult = validateLabTest(
      { name: 'creatinine', value: '1.0', unit: 'mg/dL' },
      malePatient
    );
    expect(maleResult.referenceRange).toBe('0.7 - 1.3 mg/dL');

    const femaleResult = validateLabTest(
      { name: 'creatinine', value: '1.0', unit: 'mg/dL' },
      femalePatient
    );
    expect(femaleResult.referenceRange).toBe('0.6 - 1.1 mg/dL');
  });
});

describe('Data Validator - validateLabResults', () => {
  const patient = { gender: 'M', age: 30 };

  it('should validate multiple lab results', () => {
    const labResults = [
      {
        date: '2024-01-01',
        labTests: [
          { name: 'hemoglobin', value: '15.0', unit: 'g/dL' },
          { name: 'wbc', value: '7.0', unit: '10^3/µL' },
        ],
      },
      {
        date: '2024-02-01',
        labTests: [
          { name: 'hemoglobin', value: '16.0', unit: 'g/dL' },
          { name: 'wbc', value: '12.0', unit: '10^3/µL' },
        ],
      },
    ];

    const results = validateLabResults(labResults, patient);

    expect(results).toHaveLength(2);
    expect(results[0].tests).toHaveLength(2);
    expect(results[0].overall.total).toBe(2);
    expect(results[0].overall.normal).toBe(2);
    expect(results[0].overall.abnormal).toBe(0);

    expect(results[1].overall.total).toBe(2);
    expect(results[1].overall.normal).toBe(1);
    expect(results[1].overall.abnormal).toBe(1);
  });

  it('should count critical values', () => {
    const labResults = [
      {
        date: '2024-01-01',
        labTests: [
          { name: 'hemoglobin', value: '12.0', unit: 'g/dL' },
          { name: 'hemoglobin', value: '22.0', unit: 'g/dL' },
        ],
      },
    ];

    const results = validateLabResults(labResults, patient);

    expect(results[0].overall.critical).toBe(1);
    expect(results[0].overall.abnormal).toBe(2);
  });

  it('should handle empty lab results', () => {
    const results = validateLabResults([], patient);
    expect(results).toHaveLength(0);
  });
});

describe('Data Validator - detectAnomalies', () => {
  it('should detect significant increases', () => {
    const validationResults = [
      {
        date: '2024-01-01',
        tests: [{ name: 'hemoglobin', value: '10.0', flag: 'low' }],
      },
      {
        date: '2024-02-01',
        tests: [{ name: 'hemoglobin', value: '16.0', flag: 'normal' }],
      },
    ];

    const anomalies = detectAnomalies({}, validationResults);

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].testName).toBe('hemoglobin');
    expect(anomalies[0].direction).toBe('increased');
    expect(anomalies[0].percentChange).toBe(60);
    expect(anomalies[0].severity).toBe('moderate');
  });

  it('should detect critical changes', () => {
    const validationResults = [
      {
        date: '2024-01-01',
        tests: [{ name: 'hemoglobin', value: '10.0', flag: 'low' }],
      },
      {
        date: '2024-02-01',
        tests: [{ name: 'hemoglobin', value: '25.0', flag: 'high' }],
      },
    ];

    const anomalies = detectAnomalies({}, validationResults);

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].severity).toBe('critical');
    expect(anomalies[0].percentChange).toBe(150);
  });

  it('should detect significant decreases', () => {
    const validationResults = [
      {
        date: '2024-01-01',
        tests: [{ name: 'hemoglobin', value: '18.0', flag: 'normal' }],
      },
      {
        date: '2024-02-01',
        tests: [{ name: 'hemoglobin', value: '8.0', flag: 'low' }],
      },
    ];

    const anomalies = detectAnomalies({}, validationResults);

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].direction).toBe('decreased');
    expect(anomalies[0].percentChange).toBeCloseTo(-55.56, 1);
  });

  it('should not flag small changes', () => {
    const validationResults = [
      {
        date: '2024-01-01',
        tests: [{ name: 'hemoglobin', value: '15.0', flag: 'normal' }],
      },
      {
        date: '2024-02-01',
        tests: [{ name: 'hemoglobin', value: '16.0', flag: 'normal' }],
      },
    ];

    const anomalies = detectAnomalies({}, validationResults);

    expect(anomalies).toHaveLength(0);
  });

  it('should handle missing tests', () => {
    const validationResults = [
      {
        date: '2024-01-01',
        tests: [{ name: 'hemoglobin', value: '15.0', flag: 'normal' }],
      },
      {
        date: '2024-02-01',
        tests: [{ name: 'wbc', value: '7.0', flag: 'normal' }],
      },
    ];

    const anomalies = detectAnomalies({}, validationResults);

    expect(anomalies).toHaveLength(0);
  });
});

describe('Data Validator - generateValidationReport', () => {
  it('should generate comprehensive validation report', () => {
    const patients = {
      'patient-1': {
        gender: 'M',
        age: 30,
        name: 'John Doe',
        labResults: [
          {
            date: '2024-01-01',
            labTests: [
              { name: 'hemoglobin', value: '15.0', unit: 'g/dL' },
              { name: 'wbc', value: '7.0', unit: '10^3/µL' },
            ],
          },
        ],
      },
      'patient-2': {
        gender: 'F',
        age: 25,
        name: 'Jane Smith',
        labResults: [
          {
            date: '2024-01-01',
            labTests: [
              { name: 'hemoglobin', value: '11.0', unit: 'g/dL' },
            ],
          },
        ],
      },
    };

    const report = generateValidationReport(patients);

    expect(report.timestamp).toBeDefined();
    expect(report.summary.totalPatients).toBe(2);
    expect(report.summary.totalLabResults).toBe(2);
    expect(report.summary.totalTests).toBe(3);
    expect(report.summary.normalTests).toBe(2);
    expect(report.summary.abnormalTests).toBe(1);

    expect(report.patients['patient-1']).toBeDefined();
    expect(report.patients['patient-1'].patientName).toBe('John Doe');
    expect(report.patients['patient-1'].stats.totalTests).toBe(2);

    expect(report.patients['patient-2']).toBeDefined();
    expect(report.patients['patient-2'].stats.abnormalTests).toBe(1);
  });

  it('should handle empty patients object', () => {
    const report = generateValidationReport({});

    expect(report.summary.totalPatients).toBe(0);
    expect(report.summary.totalTests).toBe(0);
    expect(Object.keys(report.patients)).toHaveLength(0);
  });

  it('should aggregate anomalies from all patients', () => {
    const patients = {
      'patient-1': {
        gender: 'M',
        age: 30,
        name: 'John Doe',
        labResults: [
          {
            date: '2024-01-01',
            labTests: [{ name: 'hemoglobin', value: '10.0', unit: 'g/dL' }],
          },
          {
            date: '2024-02-01',
            labTests: [{ name: 'hemoglobin', value: '16.0', unit: 'g/dL' }],
          },
        ],
      },
    };

    const report = generateValidationReport(patients);

    expect(report.summary.anomalies.length).toBeGreaterThan(0);
    expect(report.patients['patient-1'].anomalies.length).toBeGreaterThan(0);
  });
});

describe('Data Validator - REFERENCE_RANGES', () => {
  it('should have all required reference ranges', () => {
    const expectedTests = [
      'hemoglobin',
      'rbc',
      'wbc',
      'platelets',
      'hematocrit',
      'glucose',
      'cholesterol',
      'triglycerides',
      'alt',
      'ast',
      'creatinine',
      'tsh',
    ];

    expectedTests.forEach(test => {
      expect(REFERENCE_RANGES[test]).toBeDefined();
    });
  });

  it('should have min, max, and unit for each range', () => {
    Object.values(REFERENCE_RANGES).forEach(test => {
      const range = test.all || test.male || test.female;
      expect(range).toBeDefined();
      expect(range.min).toBeDefined();
      expect(range.max).toBeDefined();
      expect(range.unit).toBeDefined();
      expect(range.min).toBeLessThan(range.max);
    });
  });
});
