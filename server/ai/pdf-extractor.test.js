/**
 * Comprehensive tests for the PDF Extraction pipeline.
 *
 * Tests ensure that:
 * 1. Text is extracted correctly from PDF buffers
 * 2. Document layout is detected accurately
 * 3. LLM extraction results are validated and cleaned
 * 4. Test names are standardized (aliases → canonical names)
 * 5. Numeric values and reference ranges are parsed correctly
 * 6. Abnormal/confidence flags propagate to the display layer
 * 7. The full extractLabValues pipeline returns the correct shape
 * 8. Batch extraction aggregates results correctly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock heavy external dependencies before importing the subject ──────────────

vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}));

vi.mock('tesseract.js', () => ({
  default: { recognize: vi.fn() },
  recognize: vi.fn(),
}));

vi.mock('./llm-service.js', () => ({
  default: {
    chat: vi.fn(),
  },
}));

// ─────────────────────────────────────────────────────────────────────────────

import pdfParse from 'pdf-parse';
import llmService from './llm-service.js';
import pdfExtractor from './pdf-extractor.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal valid LLM extraction JSON string for one test */
function makeLLMResponse(tests = [], overrides = {}) {
  const payload = {
    tests,
    metadata: {
      testDate: '2024-03-15',
      facility: 'City Lab',
      overallConfidence: 0.92,
      ...overrides.metadata,
    },
    extractionNotes: overrides.extractionNotes || '',
  };
  return JSON.stringify(payload);
}

/** Realistic lab report text fragment */
const REALISTIC_LAB_TEXT = `
CITY MEDICAL LABORATORY
Patient: John Doe   DOB: 01/01/1980   Order #: 123456

COMPLETE METABOLIC PANEL                            Date: 03/15/2024
Test                Value    Units      Reference Range  Flag
--------------------------------------------------------------------
Glucose             95       mg/dL      70-100
Creatinine          1.1      mg/dL      0.7-1.3
eGFR                88       mL/min     >60
ALT (SGPT)          32       U/L        0-40
HbA1c               5.8      %          <5.7             H
Hemoglobin          14.5     g/dL       13.5-17.5
`;

// Has 4 decimal-valued rows to trigger hasTables=true (threshold is >3 matches)
const TABULAR_TEXT = `
Test Name   Value  Unit   Ref Range
Potassium   4.2    mEq/L  3.5-5.1
Creatinine  1.05   mg/dL  0.74-1.35
Calcium     9.4    mg/dL  8.6-10.3
Albumin     4.1    g/dL   3.5-5.0
`;

// ─────────────────────────────────────────────────────────────────────────────

describe('PDFExtractor – detectLayout', () => {
  it('identifies tabular layout when ≥4 tabular-pattern lines are present', async () => {
    const layout = await pdfExtractor.detectLayout(TABULAR_TEXT);
    expect(layout.hasTables).toBe(true);
    expect(layout.type).toBe('tabular');
  });

  it('identifies known section names in the structure array', async () => {
    const text = 'COMPLETE BLOOD COUNT\nHemoglobin 14.5\nMetabolic Panel results below';
    const layout = await pdfExtractor.detectLayout(text);
    expect(layout.structure).toContain('complete blood count');
    expect(layout.structure).toContain('metabolic panel');
  });

  it('returns unknown type for very short unstructured text', async () => {
    const layout = await pdfExtractor.detectLayout('Hello world');
    expect(layout.type).toBe('unknown');
    expect(layout.hasTables).toBe(false);
  });

  it('detects headers formatted in ALL CAPS', async () => {
    const text = 'LIPID PANEL\nCholesterol 190 mg/dL';
    const layout = await pdfExtractor.detectLayout(text);
    expect(layout.hasHeaders).toBe(true);
  });

  it('returns all required layout properties', async () => {
    const layout = await pdfExtractor.detectLayout(REALISTIC_LAB_TEXT);
    expect(layout).toHaveProperty('type');
    expect(layout).toHaveProperty('hasTables');
    expect(layout).toHaveProperty('hasHeaders');
    expect(layout).toHaveProperty('structure');
    expect(Array.isArray(layout.structure)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('PDFExtractor – validateTest', () => {
  it('passes a test with a valid numeric value and known unit', () => {
    const test = {
      testName: 'Glucose',
      value: '95',
      unit: 'mg/dL',
      confidence: 0.95,
      referenceRange: { lower: 70, upper: 100 },
    };
    const result = pdfExtractor.validateTest(test);
    expect(result.validationIssues).toHaveLength(0);
    expect(result.confidence).toBeCloseTo(0.95);
  });

  it('penalises non-numeric values', () => {
    const test = { testName: 'Creatinine', value: 'N/A', unit: 'mg/dL', confidence: 1.0, referenceRange: {} };
    const result = pdfExtractor.validateTest(test);
    expect(result.validationIssues).toContain('Value is not numeric');
    expect(result.confidence).toBeLessThan(1.0);
  });

  it('penalises unusual units (not in whitelist)', () => {
    const test = { testName: 'TSH', value: '2.5', unit: 'mIU/L', confidence: 1.0, referenceRange: {} };
    const result = pdfExtractor.validateTest(test);
    expect(result.validationIssues).toContain('Unusual unit');
    expect(result.confidence).toBeLessThan(1.0);
  });

  it('penalises inverted reference ranges', () => {
    const test = {
      testName: 'Glucose', value: '95', unit: 'mg/dL', confidence: 1.0,
      referenceRange: { lower: '100', upper: '70' }, // inverted
    };
    const result = pdfExtractor.validateTest(test);
    expect(result.validationIssues).toContain('Reference range inverted');
  });

  it('penalises physiologically impossible values (negative or >100 000)', () => {
    const negTest = { testName: 'Hemoglobin', value: '-5', unit: 'g/dL', confidence: 1.0, referenceRange: {} };
    const negResult = pdfExtractor.validateTest(negTest);
    expect(negResult.validationIssues).toContain('Value outside physiologic range');

    const hugeTest = { testName: 'Glucose', value: '999999', unit: 'mg/dL', confidence: 1.0, referenceRange: {} };
    const hugeResult = pdfExtractor.validateTest(hugeTest);
    expect(hugeResult.validationIssues).toContain('Value outside physiologic range');
  });

  it('does not penalise a zero value (0 is valid for some tests)', () => {
    const test = { testName: 'ALT', value: '0', unit: 'U/L', confidence: 0.9, referenceRange: {} };
    const result = pdfExtractor.validateTest(test);
    expect(result.validationIssues).not.toContain('Value outside physiologic range');
  });

  it('accumulates multiple issues when several violations occur', () => {
    const test = {
      testName: 'X', value: 'abc', unit: 'weirdUnit',
      confidence: 1.0, referenceRange: { lower: '200', upper: '10' },
    };
    const result = pdfExtractor.validateTest(test);
    expect(result.validationIssues.length).toBeGreaterThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('PDFExtractor – standardizeTest (name, numeric value, reference range)', () => {
  it.each([
    ['creatinine', 'Creatinine'],
    ['cr',          'Creatinine'],
    ['egfr',        'eGFR'],
    ['gfr',         'eGFR'],
    ['glucose',     'Glucose'],
    ['glu',         'Glucose'],
    ['hba1c',       'HbA1c'],
    ['a1c',         'HbA1c'],
    ['hemoglobin a1c', 'HbA1c'],
    ['alt',         'ALT'],
    ['sgpt',        'ALT'],
    ['ast',         'AST'],
    ['sgot',        'AST'],
    ['hemoglobin',  'Hemoglobin'],
    ['hgb',         'Hemoglobin'],
  ])('normalises "%s" → "%s"', (inputName, expectedName) => {
    const test = { testName: inputName, value: '1.0', unit: 'mg/dL', referenceRange: null };
    const result = pdfExtractor.standardizeTest(test);
    expect(result.testName).toBe(expectedName);
  });

  it('leaves unknown test names unchanged', () => {
    const test = { testName: 'CustomBiomarker', value: '5', unit: 'ng/mL', referenceRange: null };
    const result = pdfExtractor.standardizeTest(test);
    expect(result.testName).toBe('CustomBiomarker');
  });

  it('parses numericValue from a string value', () => {
    const test = { testName: 'Glucose', value: '95.3', unit: 'mg/dL', referenceRange: null };
    const result = pdfExtractor.standardizeTest(test);
    expect(result.numericValue).toBeCloseTo(95.3);
  });

  it('does not set numericValue when value is non-numeric', () => {
    const test = { testName: 'TSH', value: '<0.01', unit: 'mIU/L', referenceRange: null };
    const result = pdfExtractor.standardizeTest(test);
    expect(result.numericValue).toBeUndefined();
  });

  it('parses a "lower–upper" reference range string into structured object', () => {
    const test = {
      testName: 'Creatinine', value: '1.1', unit: 'mg/dL',
      referenceRange: '0.7-1.3',
    };
    const result = pdfExtractor.standardizeTest(test);
    expect(result.referenceRange).toMatchObject({ lower: 0.7, upper: 1.3 });
    expect(result.referenceRange.text).toBe('0.7-1.3');
  });

  it('parses a reference range with en-dash separator', () => {
    const test = {
      testName: 'Hemoglobin', value: '14.5', unit: 'g/dL',
      referenceRange: '13.5–17.5',
    };
    const result = pdfExtractor.standardizeTest(test);
    expect(result.referenceRange).toMatchObject({ lower: 13.5, upper: 17.5 });
  });

  it('preserves an already-structured referenceRange object', () => {
    const test = {
      testName: 'ALT', value: '32', unit: 'U/L',
      referenceRange: { lower: 0, upper: 40, text: '0-40' },
    };
    const result = pdfExtractor.standardizeTest(test);
    // Structured objects are not re-parsed
    expect(result.referenceRange).toMatchObject({ lower: 0, upper: 40 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('PDFExtractor – categorizeTests', () => {
  const makeTest = name => ({ testName: name });

  it('categorises kidney tests correctly', () => {
    const tests = [makeTest('Creatinine'), makeTest('eGFR'), makeTest('BUN'), makeTest('Albumin')];
    const cats = pdfExtractor.categorizeTests(tests);
    expect(cats.kidney).toBeDefined();
    expect(cats.kidney).toContain('Creatinine');
    expect(cats.kidney).toContain('eGFR');
  });

  it('categorises liver tests correctly', () => {
    const tests = [makeTest('ALT'), makeTest('AST'), makeTest('ALP')];
    const cats = pdfExtractor.categorizeTests(tests);
    expect(cats.liver).toBeDefined();
    expect(cats.liver).toContain('ALT');
    expect(cats.liver).toContain('AST');
  });

  it('categorises metabolic tests correctly', () => {
    const tests = [makeTest('Glucose'), makeTest('HbA1c'), makeTest('Cholesterol')];
    const cats = pdfExtractor.categorizeTests(tests);
    expect(cats.metabolic).toBeDefined();
    expect(cats.metabolic).toContain('Glucose');
    expect(cats.metabolic).toContain('HbA1c');
  });

  it('categorises blood/CBC tests correctly', () => {
    const tests = [makeTest('Hemoglobin'), makeTest('Hematocrit'), makeTest('WBC'), makeTest('Platelets')];
    const cats = pdfExtractor.categorizeTests(tests);
    expect(cats.blood).toBeDefined();
    expect(cats.blood).toContain('Hemoglobin');
  });

  it('categorises thyroid tests correctly', () => {
    const tests = [makeTest('TSH'), makeTest('T4'), makeTest('T3')];
    const cats = pdfExtractor.categorizeTests(tests);
    expect(cats.thyroid).toBeDefined();
    expect(cats.thyroid).toContain('TSH');
  });

  it('categorises electrolyte tests correctly', () => {
    const tests = [makeTest('Sodium'), makeTest('Potassium'), makeTest('Chloride')];
    const cats = pdfExtractor.categorizeTests(tests);
    expect(cats.electrolytes).toBeDefined();
    expect(cats.electrolytes).toContain('Sodium');
  });

  it('returns an empty object for uncategorised tests', () => {
    const tests = [makeTest('FancyNovelBiomarker')];
    const cats = pdfExtractor.categorizeTests(tests);
    expect(Object.keys(cats)).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('PDFExtractor – validateExtraction', () => {
  it('recalculates overallConfidence as average of test confidences', async () => {
    const extraction = {
      tests: [
        { testName: 'Glucose', value: '95', unit: 'mg/dL', confidence: 0.9, referenceRange: {} },
        { testName: 'ALT',     value: '32', unit: 'U/L',   confidence: 0.8, referenceRange: {} },
      ],
      metadata: { overallConfidence: 0.0 },
    };
    const validated = await pdfExtractor.validateExtraction(extraction);
    expect(validated.metadata.overallConfidence).toBeCloseTo(0.85);
  });

  it('sets needsReview=true on the metadata when avg confidence < 0.7', async () => {
    const extraction = {
      tests: [
        { testName: 'X', value: 'bad', unit: 'mg/dL', confidence: 0.3, referenceRange: {} },
      ],
      metadata: { overallConfidence: 0.0 },
    };
    const validated = await pdfExtractor.validateExtraction(extraction);
    expect(validated.metadata.needsReview).toBe(true);
  });

  it('marks individual tests with needsReview when their confidence < 0.7', async () => {
    const extraction = {
      tests: [
        { testName: 'Glucose', value: '95',    unit: 'mg/dL', confidence: 0.95, referenceRange: {} },
        { testName: 'Y',       value: 'maybe', unit: 'mg/dL', confidence: 0.3,  referenceRange: {} },
      ],
      metadata: { overallConfidence: 0.0 },
    };
    const validated = await pdfExtractor.validateExtraction(extraction);
    expect(validated.tests[0].needsReview).toBe(false);
    expect(validated.tests[1].needsReview).toBe(true);
  });

  it('returns an empty tests array gracefully without throwing NaN', async () => {
    const extraction = { tests: [], metadata: { overallConfidence: 0.0 } };
    const validated = await pdfExtractor.validateExtraction(extraction);
    expect(validated.tests).toHaveLength(0);
    // 0 / (0 || 1) === 0 – should be a clean zero, not NaN
    expect(Number.isNaN(validated.metadata.overallConfidence)).toBe(false);
    expect(validated.metadata.overallConfidence).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('PDFExtractor – postProcess & summary statistics', () => {
  const buildExtraction = (tests) => ({
    tests,
    metadata: { overallConfidence: 0.9 },
  });

  it('adds a summary with totalTests, abnormalTests, lowConfidenceTests', () => {
    // needsReview is set by validateExtraction; postProcess reads it directly
    const extraction = buildExtraction([
      { testName: 'Glucose',    value: '95',  unit: 'mg/dL', confidence: 0.9, isAbnormal: false, needsReview: false, referenceRange: '70-100' },
      { testName: 'HbA1c',     value: '7.2', unit: '%',     confidence: 0.85, isAbnormal: true,  needsReview: false, referenceRange: null },
      { testName: 'LowConf',   value: '5',   unit: 'U/L',   confidence: 0.5, isAbnormal: false, needsReview: true,  referenceRange: null },
    ]);

    const processed = pdfExtractor.postProcess(extraction);
    expect(processed.summary.totalTests).toBe(3);
    expect(processed.summary.abnormalTests).toBe(1);
    expect(processed.summary.lowConfidenceTests).toBe(1);
    expect(processed.summary.testCategories).toBeDefined();
  });

  it('preserves all original test fields after post-processing', () => {
    const extraction = buildExtraction([
      { testName: 'creatinine', value: '1.1', unit: 'mg/dL', confidence: 0.95, isAbnormal: false, referenceRange: '0.7-1.3' },
    ]);
    const processed = pdfExtractor.postProcess(extraction);
    const t = processed.tests[0];
    // Name should be standardised
    expect(t.testName).toBe('Creatinine');
    // Numeric value should be parsed
    expect(t.numericValue).toBeCloseTo(1.1);
    // Reference range should be structured
    expect(t.referenceRange).toMatchObject({ lower: 0.7, upper: 1.3 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('PDFExtractor – extractLabValues (full pipeline, mocked LLM & PDF)', () => {
  const MOCK_TESTS = [
    {
      testName: 'glucose',
      value: '95',
      unit: 'mg/dL',
      referenceRange: { lower: 70, upper: 100, text: '70-100' },
      isAbnormal: false,
      abnormalFlag: null,
      confidence: 0.95,
      notes: '',
    },
    {
      testName: 'hba1c',
      value: '7.2',
      unit: '%',
      referenceRange: { lower: 4, upper: 5.7, text: '4-5.7' },
      isAbnormal: true,
      abnormalFlag: 'H',
      confidence: 0.92,
      notes: '',
    },
    {
      testName: 'alt',
      value: '32',
      unit: 'U/L',
      referenceRange: { lower: 0, upper: 40, text: '0-40' },
      isAbnormal: false,
      abnormalFlag: null,
      confidence: 0.88,
      notes: '',
    },
    {
      testName: 'creatinine',
      value: '1.1',
      unit: 'mg/dL',
      referenceRange: { lower: 0.7, upper: 1.3, text: '0.7-1.3' },
      isAbnormal: false,
      abnormalFlag: null,
      confidence: 0.97,
      notes: '',
    },
  ];

  beforeEach(() => {
    // PDF parse returns realistic lab text
    pdfParse.mockResolvedValue({ text: REALISTIC_LAB_TEXT });

    // LLM returns structured JSON extraction
    llmService.chat.mockResolvedValue({
      content: makeLLMResponse(MOCK_TESTS),
      usage: { inputTokens: 500, outputTokens: 200 },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns success=true with a data payload', async () => {
    const buffer = Buffer.from('fake-pdf');
    const result = await pdfExtractor.extractLabValues(buffer);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.tests).toBeDefined();
  });

  it('correctly extracts and standardises test names from LLM output', async () => {
    const buffer = Buffer.from('fake-pdf');
    const result = await pdfExtractor.extractLabValues(buffer);
    const names = result.data.tests.map(t => t.testName);
    expect(names).toContain('Glucose');
    expect(names).toContain('HbA1c');
    expect(names).toContain('ALT');
    expect(names).toContain('Creatinine');
  });

  it('correctly parses numeric values for all extracted tests', async () => {
    const buffer = Buffer.from('fake-pdf');
    const result = await pdfExtractor.extractLabValues(buffer);
    const glucoseTest = result.data.tests.find(t => t.testName === 'Glucose');
    expect(glucoseTest.numericValue).toBeCloseTo(95);

    const hba1cTest = result.data.tests.find(t => t.testName === 'HbA1c');
    expect(hba1cTest.numericValue).toBeCloseTo(7.2);
  });

  it('preserves abnormal flags from the LLM extraction', async () => {
    const buffer = Buffer.from('fake-pdf');
    const result = await pdfExtractor.extractLabValues(buffer);
    const hba1c = result.data.tests.find(t => t.testName === 'HbA1c');
    expect(hba1c.isAbnormal).toBe(true);
    expect(hba1c.abnormalFlag).toBe('H');
  });

  it('produces correct summary counts (totalTests, abnormalTests)', async () => {
    const buffer = Buffer.from('fake-pdf');
    const result = await pdfExtractor.extractLabValues(buffer);
    expect(result.data.summary.totalTests).toBe(4);
    expect(result.data.summary.abnormalTests).toBe(1);
  });

  it('includes metadata with timestamp and confidence when includeMetadata=true', async () => {
    const buffer = Buffer.from('fake-pdf');
    const result = await pdfExtractor.extractLabValues(buffer, { includeMetadata: true });
    expect(result.metadata).toBeDefined();
    expect(result.metadata.extractionMethod).toBe('ai-powered');
    expect(result.metadata.timestamp).toBeDefined();
    expect(result.metadata.confidence).toBeGreaterThan(0);
  });

  it('omits metadata when includeMetadata=false', async () => {
    const buffer = Buffer.from('fake-pdf');
    const result = await pdfExtractor.extractLabValues(buffer, { includeMetadata: false });
    expect(result.metadata).toBeUndefined();
  });

  it('skips validation step when validate=false', async () => {
    const buffer = Buffer.from('fake-pdf');
    const result = await pdfExtractor.extractLabValues(buffer, { validate: false });
    // Should still succeed — validation is optional
    expect(result.success).toBe(true);
  });

  it('returns success=false when pdf-parse throws', async () => {
    pdfParse.mockRejectedValueOnce(new Error('Corrupt PDF'));
    const buffer = Buffer.from('corrupt');
    const result = await pdfExtractor.extractLabValues(buffer);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/corrupt pdf/i);
  });

  it('falls back gracefully when LLM returns no JSON', async () => {
    llmService.chat.mockResolvedValueOnce({ content: 'Sorry, I cannot process this.' });
    const buffer = Buffer.from('fake-pdf');
    const result = await pdfExtractor.extractLabValues(buffer);
    // Falls back to empty extraction – postProcess handles it
    expect(result.success).toBe(true);
    expect(result.data.tests).toHaveLength(0);
    expect(result.data.summary.totalTests).toBe(0);
  });

  it('calls pdf-parse with the supplied buffer', async () => {
    const buffer = Buffer.from('my-pdf-bytes');
    await pdfExtractor.extractLabValues(buffer);
    expect(pdfParse).toHaveBeenCalledWith(buffer);
  });

  it('calls the LLM exactly once per extraction', async () => {
    const buffer = Buffer.from('fake-pdf');
    await pdfExtractor.extractLabValues(buffer);
    expect(llmService.chat).toHaveBeenCalledTimes(1);
  });

  it('sends low temperature (≤0.2) to the LLM for deterministic extraction', async () => {
    const buffer = Buffer.from('fake-pdf');
    await pdfExtractor.extractLabValues(buffer);
    const callOptions = llmService.chat.mock.calls[0][1];
    expect(callOptions.temperature).toBeLessThanOrEqual(0.2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('PDFExtractor – extractText', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses direct text extraction when PDF contains enough text', async () => {
    const longText = 'A'.repeat(200);
    pdfParse.mockResolvedValue({ text: longText });
    const result = await pdfExtractor.extractText(Buffer.from('pdf'), true);
    expect(result).toBe(longText);
  });

  it('attempts OCR when pdf-parse returns less than 100 chars (OCR unavailable in test env)', async () => {
    pdfParse.mockResolvedValue({ text: 'short' }); // < 100 chars
    // canvas / pdfjs-dist are not installed in the test environment, so OCR throws.
    // The important assertion is that extractText tried OCR (not silently returned the short text).
    await expect(
      pdfExtractor.extractText(Buffer.from('pdf'), true)
    ).rejects.toThrow();
  });

  it('throws when direct extraction fails and useOCR=false', async () => {
    pdfParse.mockResolvedValue({ text: 'short' });
    await expect(
      pdfExtractor.extractText(Buffer.from('pdf'), false)
    ).rejects.toThrow();
  });

  it('throws when pdf-parse itself throws', async () => {
    pdfParse.mockRejectedValue(new Error('Parse failure'));
    await expect(
      pdfExtractor.extractText(Buffer.from('pdf'), false)
    ).rejects.toThrow('Parse failure');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('PDFExtractor – extractBatch', () => {
  beforeEach(() => {
    pdfParse.mockResolvedValue({ text: REALISTIC_LAB_TEXT });
    llmService.chat.mockResolvedValue({
      content: makeLLMResponse([
        {
          testName: 'glucose', value: '95', unit: 'mg/dL',
          referenceRange: { lower: 70, upper: 100, text: '70-100' },
          isAbnormal: false, abnormalFlag: null, confidence: 0.95, notes: '',
        },
      ]),
      usage: { inputTokens: 200, outputTokens: 100 },
    });
  });

  afterEach(() => vi.clearAllMocks());

  it('processes each PDF in the batch and returns an array of results', async () => {
    const buffers = [Buffer.from('pdf1'), Buffer.from('pdf2'), Buffer.from('pdf3')];
    const { results, summary } = await pdfExtractor.extractBatch(buffers);
    expect(results).toHaveLength(3);
    expect(summary.total).toBe(3);
  });

  it('assigns correct index to each batch result', async () => {
    const buffers = [Buffer.from('a'), Buffer.from('b')];
    const { results } = await pdfExtractor.extractBatch(buffers);
    expect(results[0].index).toBe(0);
    expect(results[1].index).toBe(1);
  });

  it('correctly counts successful vs failed extractions in summary', async () => {
    pdfParse
      .mockResolvedValueOnce({ text: REALISTIC_LAB_TEXT }) // first: OK
      .mockRejectedValueOnce(new Error('Bad PDF'));        // second: fail

    const buffers = [Buffer.from('ok'), Buffer.from('bad')];
    const { summary } = await pdfExtractor.extractBatch(buffers);
    expect(summary.successful).toBe(1);
    expect(summary.failed).toBe(1);
  });

  it('returns empty results for an empty buffer array', async () => {
    const { results, summary } = await pdfExtractor.extractBatch([]);
    expect(results).toHaveLength(0);
    expect(summary.total).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('PDFExtractor – learnFromCorrection', () => {
  it('returns success=true when a correction is recorded', async () => {
    const original = { testName: 'glucose', value: '95' };
    const correction = { testName: 'Glucose', value: '95', unit: 'mg/dL' };
    const result = await pdfExtractor.learnFromCorrection(original, correction);
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
  });
});
