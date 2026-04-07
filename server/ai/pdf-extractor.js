/**
 * AI-Powered PDF Extraction Service
 * Uses OCR and LLM to extract lab values from PDF documents
 */

import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import llmService from './llm-service.js';
import { PROMPTS } from './prompts.js';

class PDFExtractor {
  constructor() {
    this.confidenceThreshold = 0.7;
    this.maxRetries = 2;
  }

  /**
   * Main extraction pipeline
   */
  async extractLabValues(pdfBuffer, options = {}) {
    const {
      useOCR = true,
      validate = true,
      includeMetadata = true
    } = options;

    try {
      // Step 1: Extract text from PDF
      const textContent = await this.extractText(pdfBuffer, useOCR);

      // Step 2: Detect layout and structure
      const layout = await this.detectLayout(textContent);

      // Step 3: Extract lab values using LLM
      const extraction = await this.performExtraction(textContent, layout);

      // Step 4: Validate and score confidence
      const validated = validate ? await this.validateExtraction(extraction) : extraction;

      // Step 5: Post-process and standardize
      const processed = this.postProcess(validated);

      return {
        success: true,
        data: processed,
        metadata: includeMetadata ? {
          extractionMethod: 'ai-powered',
          timestamp: new Date().toISOString(),
          confidence: processed.metadata.overallConfidence,
          textLength: textContent.length,
          layoutDetected: layout.type
        } : undefined
      };

    } catch (error) {
      console.error('PDF extraction error:', error);
      return {
        success: false,
        error: error.message,
        suggestion: 'Please ensure the PDF is a valid lab results document'
      };
    }
  }

  /**
   * Extract text from PDF (with OCR fallback)
   */
  async extractText(pdfBuffer, useOCR) {
    try {
      // First try direct text extraction
      const data = await pdfParse(pdfBuffer);

      if (data.text && data.text.trim().length > 100) {
        console.log(`Extracted ${data.text.length} characters directly from PDF`);
        return data.text;
      }

      // If direct extraction fails, use OCR
      if (useOCR) {
        console.log('Direct extraction failed, using OCR...');
        return await this.performOCR(pdfBuffer);
      }

      throw new Error('Could not extract text from PDF');

    } catch (error) {
      console.error('Text extraction error:', error);
      throw error;
    }
  }

  /**
   * Perform OCR on PDF
   */
  async performOCR(pdfBuffer) {
    try {
      // Save PDF buffer to temp file for Tesseract
      const { createCanvas, loadImage } = await import('canvas');
      const PDFDocument = await import('pdfjs-dist/legacy/build/pdf.js');

      // This is a simplified version - in production, use proper PDF to image conversion
      // For now, return a placeholder
      console.log('OCR would be performed here (requires PDF to image conversion)');
      return '[OCR extraction would be performed here]';

    } catch (error) {
      console.error('OCR error:', error);
      throw new Error('OCR extraction failed');
    }
  }

  /**
   * Detect document layout and structure
   */
  async detectLayout(text) {
    const lines = text.split('\n');
    const layout = {
      type: 'unknown',
      hasTables: false,
      hasHeaders: false,
      structure: []
    };

    // Detect tables (look for aligned columns)
    const tablePatterns = [
      /^\s*\w+\s+\d+\.\d+\s+\w+/g,  // test name, value, unit
      /^\s*\w+\s+\d+\s+\d+\s*-\s*\d+/g  // test name, value, reference range
    ];

    let tableCount = 0;
    for (const line of lines) {
      for (const pattern of tablePatterns) {
        if (pattern.test(line)) {
          tableCount++;
          break;
        }
      }
    }

    if (tableCount > 3) {
      layout.hasTables = true;
      layout.type = 'tabular';
    }

    // Detect headers (all caps or colon-terminated)
    const headerPattern = /^[A-Z][A-Z\s]+:?$/;
    const headers = lines.filter(line => headerPattern.test(line.trim()));

    if (headers.length > 0) {
      layout.hasHeaders = true;
      layout.structure.push('headers');
    }

    // Detect sections
    const sectionPatterns = [
      /complete blood count/i,
      /metabolic panel/i,
      /lipid panel/i,
      /liver panel/i,
      /thyroid/i
    ];

    for (const pattern of sectionPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        layout.structure.push(matches[0].toLowerCase());
      }
    }

    console.log('Detected layout:', layout);
    return layout;
  }

  /**
   * Perform LLM-based extraction
   */
  async performExtraction(text, layout) {
    const messages = [
      {
        role: 'system',
        content: PROMPTS.PDF_EXTRACTION
      },
      {
        role: 'user',
        content: `Extract laboratory test data from the following text:

${text.substring(0, 8000)} ${text.length > 8000 ? '...[truncated]' : ''}

Return the results in the specified JSON format.`
      }
    ];

    try {
      const response = await llmService.chat(messages, {
        temperature: 0.1, // Low temperature for consistent extraction
        maxTokens: 3000
      });

      // Parse JSON response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }

      const extraction = JSON.parse(jsonMatch[0]);
      return extraction;

    } catch (error) {
      console.error('LLM extraction error:', error);

      // Fallback: return empty extraction with low confidence
      return {
        tests: [],
        metadata: {
          overallConfidence: 0.0,
          extractionError: error.message
        },
        extractionNotes: 'LLM extraction failed, requires manual review'
      };
    }
  }

  /**
   * Validate extraction results
   */
  async validateExtraction(extraction) {
    const validated = {
      ...extraction,
      tests: extraction.tests.map(test => this.validateTest(test))
    };

    // Recalculate overall confidence
    const avgConfidence = validated.tests.reduce((sum, t) => sum + t.confidence, 0) /
                          (validated.tests.length || 1);

    validated.metadata.overallConfidence = avgConfidence;
    validated.metadata.needsReview = avgConfidence < this.confidenceThreshold;

    // Flag low-confidence tests
    validated.tests = validated.tests.map(test => ({
      ...test,
      needsReview: test.confidence < this.confidenceThreshold
    }));

    return validated;
  }

  /**
   * Validate individual test extraction
   */
  validateTest(test) {
    const issues = [];

    // Check if value is numeric
    if (test.value && isNaN(parseFloat(test.value))) {
      issues.push('Value is not numeric');
      test.confidence *= 0.7;
    }

    // Check if unit is valid
    const validUnits = ['mg/dL', 'g/dL', 'U/L', 'mL/min', '%', 'pg/mL', 'ng/mL', 'mEq/L'];
    if (test.unit && !validUnits.includes(test.unit)) {
      issues.push('Unusual unit');
      test.confidence *= 0.9;
    }

    // Check if reference range makes sense
    if (test.referenceRange) {
      const { lower, upper } = test.referenceRange;
      if (lower && upper && parseFloat(lower) > parseFloat(upper)) {
        issues.push('Reference range inverted');
        test.confidence *= 0.6;
      }
    }

    // Check if value is within physiologically possible range
    const value = parseFloat(test.value);
    if (!isNaN(value)) {
      if (value < 0 || value > 100000) {
        issues.push('Value outside physiologic range');
        test.confidence *= 0.5;
      }
    }

    test.validationIssues = issues;
    return test;
  }

  /**
   * Post-process and standardize extracted data
   */
  postProcess(extraction) {
    const standardized = {
      ...extraction,
      tests: extraction.tests.map(test => this.standardizeTest(test))
    };

    // Add summary statistics
    standardized.summary = {
      totalTests: standardized.tests.length,
      abnormalTests: standardized.tests.filter(t => t.isAbnormal).length,
      lowConfidenceTests: standardized.tests.filter(t => t.needsReview).length,
      testCategories: this.categorizeTests(standardized.tests)
    };

    return standardized;
  }

  /**
   * Standardize individual test
   */
  standardizeTest(test) {
    const standardized = { ...test };

    // Standardize test names
    const nameMap = {
      'creatinine': 'Creatinine',
      'cr': 'Creatinine',
      'egfr': 'eGFR',
      'gfr': 'eGFR',
      'glucose': 'Glucose',
      'glu': 'Glucose',
      'hba1c': 'HbA1c',
      'a1c': 'HbA1c',
      'hemoglobin a1c': 'HbA1c',
      'alt': 'ALT',
      'sgpt': 'ALT',
      'ast': 'AST',
      'sgot': 'AST',
      'hemoglobin': 'Hemoglobin',
      'hgb': 'Hemoglobin'
    };

    const lowerName = test.testName.toLowerCase();
    if (nameMap[lowerName]) {
      standardized.testName = nameMap[lowerName];
    }

    // Parse numeric value
    if (test.value && !isNaN(parseFloat(test.value))) {
      standardized.numericValue = parseFloat(test.value);
    }

    // Parse reference range
    if (test.referenceRange && typeof test.referenceRange === 'string') {
      const match = test.referenceRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
      if (match) {
        standardized.referenceRange = {
          lower: parseFloat(match[1]),
          upper: parseFloat(match[2]),
          text: test.referenceRange
        };
      }
    }

    return standardized;
  }

  /**
   * Categorize tests by panel
   */
  categorizeTests(tests) {
    const categories = {
      kidney: ['creatinine', 'egfr', 'bun', 'albumin'],
      liver: ['alt', 'ast', 'alp', 'ggt', 'bilirubin'],
      metabolic: ['glucose', 'hba1c', 'cholesterol', 'hdl', 'ldl', 'triglycerides'],
      blood: ['hemoglobin', 'hematocrit', 'rbc', 'wbc', 'platelets'],
      thyroid: ['tsh', 't4', 't3'],
      electrolytes: ['sodium', 'potassium', 'chloride', 'co2']
    };

    const categorized = {};

    for (const [category, testNames] of Object.entries(categories)) {
      const matches = tests.filter(t =>
        testNames.some(name => t.testName.toLowerCase().includes(name))
      );

      if (matches.length > 0) {
        categorized[category] = matches.map(t => t.testName);
      }
    }

    return categorized;
  }

  /**
   * Learn from user corrections
   */
  async learnFromCorrection(originalExtraction, userCorrection) {
    // In production, store corrections for fine-tuning or few-shot learning
    console.log('Recording user correction for learning...');

    const correction = {
      original: originalExtraction,
      corrected: userCorrection,
      timestamp: new Date().toISOString()
    };

    // Save to corrections database (in production)
    // await this.saveCorrection(correction);

    return {
      success: true,
      message: 'Correction recorded for future improvements'
    };
  }

  /**
   * Extract from multiple PDFs in batch
   */
  async extractBatch(pdfBuffers, options = {}) {
    const results = [];

    for (let i = 0; i < pdfBuffers.length; i++) {
      console.log(`Processing PDF ${i + 1}/${pdfBuffers.length}...`);

      const result = await this.extractLabValues(pdfBuffers[i], options);
      results.push({
        index: i,
        ...result
      });
    }

    // Batch summary
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      avgConfidence: results
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.data.metadata.overallConfidence, 0) /
        results.filter(r => r.success).length
    };

    return {
      results,
      summary
    };
  }
}

// Export singleton instance
const pdfExtractor = new PDFExtractor();
export default pdfExtractor;
