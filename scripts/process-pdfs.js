#!/usr/bin/env node

/**
 * Medical PDF Processor - Multi-Patient Support
 *
 * Processes medical lab result PDFs using OCR/AI extraction
 * Supports multiple patients with automatic categorization
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  sourceDir: path.join(__dirname, '../data/pdfs'),
  outputDir: path.join(__dirname, '../data/processed'),
  dataFile: path.join(__dirname, '../data/lab-data-complete.json'),
  geminiApiKey: process.env.GEMINI_API_KEY,
  ocrLanguage: 'ita+eng', // Italian and English
  confidenceThreshold: 0.7,
};

// Patient categorization patterns
const PATIENT_PATTERNS = {
  chiara: {
    patterns: [/chiara/i, /marzo\s+2026/i],
    name: 'Chiara',
    id: 'patient_chiara'
  },
  causius: {
    patterns: [/causio/i, /causius/i],
    name: 'Causio',
    id: 'patient_causius'
  }
};

// Lab test patterns (Italian medical terms)
const LAB_TEST_PATTERNS = {
  blood: [
    /emoglobina/i,
    /globuli\s+rossi/i,
    /globuli\s+bianchi/i,
    /piastrine/i,
    /ematocrito/i
  ],
  metabolic: [
    /glicemia/i,
    /colesterolo/i,
    /trigliceridi/i,
    /acido\s+urico/i
  ],
  liver: [
    /transaminase/i,
    /alt/i,
    /ast/i,
    /gamma\s+gt/i,
    /bilirubina/i
  ],
  kidney: [
    /creatinina/i,
    /azotemia/i,
    /urea/i,
    /egfr/i
  ],
  thyroid: [
    /tsh/i,
    /t3/i,
    /t4/i,
    /tireotropina/i
  ]
};

/**
 * Categorize patient from filename
 */
function categorizePatient(filename) {
  for (const [key, config] of Object.entries(PATIENT_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(filename)) {
        return config;
      }
    }
  }
  return {
    name: 'Unknown',
    id: 'patient_unknown'
  };
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractPDFText(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return {
    text: data.text,
    pages: data.numpages,
    info: data.info
  };
}

/**
 * Enhance extraction with OCR for scanned PDFs
 */
async function ocrEnhance(filePath) {
  const worker = await Tesseract.createWorker(CONFIG.ocrLanguage);
  const { data: { text, confidence } } = await worker.recognize(filePath);
  await worker.terminate();

  return {
    text,
    confidence: confidence / 100
  };
}

/**
 * Use AI to extract structured lab data
 */
async function extractStructuredData(text, filename, patient) {
  if (!CONFIG.geminiApiKey) {
    console.warn('⚠️  No GEMINI_API_KEY found, using rule-based extraction');
    return extractWithRules(text, filename, patient);
  }

  const genAI = new GoogleGenerativeAI(CONFIG.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Extract structured medical lab data from this text.

Patient: ${patient.name}
Filename: ${filename}

Extract the following fields in JSON format:
{
  "date": "YYYY-MM-DD",
  "labTests": [
    {
      "name": "test name",
      "value": "numeric value",
      "unit": "unit of measurement",
      "referenceRange": "min - max",
      "flag": "normal|high|low",
      "category": "blood|metabolic|liver|kidney|thyroid|other"
    }
  ],
  "metadata": {
    "labName": "laboratory name",
    "doctor": "doctor name",
    "notes": "additional notes"
  }
}

Rules:
- Date: Extract from filename or text (format: DD/MM/YYYY or YYYY-MM-DD)
- Values: Extract numeric values only
- Flags: Mark as high/low if explicitly stated in text
- Categories: Use the categories listed above
- Reference ranges: Extract if available

Text to analyze:
${text.substring(0, 15000)}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();

    // Extract JSON from response
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.warn(`AI extraction failed for ${filename}:`, error.message);
  }

  return extractWithRules(text, filename, patient);
}

/**
 * Rule-based extraction fallback
 */
function extractWithRules(text, filename, patient) {
  const lines = text.split('\n');
  const labTests = [];
  const dateMatch = filename.match(/(\d{4})/);
  const date = dateMatch ? `${dateMatch[1]}-01-01` : new Date().toISOString().split('T')[0];

  // Extract lab test values using regex patterns
  for (const line of lines) {
    for (const [category, patterns] of Object.entries(LAB_TEST_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          const valueMatch = line.match(/(\d+[.,]?\d*)/);
          if (valueMatch) {
            labTests.push({
              name: line.trim().substring(0, 50),
              value: valueMatch[1].replace(',', '.'),
              unit: 'mg/dL',
              referenceRange: '',
              flag: 'normal',
              category: category,
              confidence: 0.6
            });
          }
        }
      }
    }
  }

  return {
    date,
    labTests,
    metadata: {
      labName: 'Unknown',
      extractionMethod: 'rule-based',
      confidence: 0.6
    }
  };
}

/**
 * Process a single PDF file
 */
async function processPDF(filePath, filename) {
  console.log(`\n📄 Processing: ${filename}`);

  try {
    // Categorize patient
    const patient = categorizePatient(filename);
    console.log(`   Patient: ${patient.name}`);

    // Extract PDF text
    const pdfData = await extractPDFText(filePath);
    console.log(`   Pages: ${pdfData.pages}`);

    // Check if OCR is needed (low text density)
    const textDensity = pdfData.text.length / (pdfData.pages * 1000);
    let extractedText = pdfData.text;

    if (textDensity < 100) {
      console.log(`   ⚠️  Low text density, using OCR...`);
      const ocrData = await ocrEnhance(filePath);
      if (ocrData.confidence > CONFIG.confidenceThreshold) {
        extractedText = ocrData.text;
      }
    }

    // Extract structured data
    const structuredData = await extractStructuredData(extractedText, filename, patient);
    console.log(`   ✅ Extracted ${structuredData.labTests?.length || 0} lab tests`);

    return {
      filename,
      patient: patient.id,
      patientName: patient.name,
      date: structuredData.date,
      labTests: structuredData.labTests || [],
      metadata: {
        ...structuredData.metadata,
        sourceFile: filename,
        fileSize: fs.statSync(filePath).size,
        processedAt: new Date().toISOString(),
        pdfPages: pdfData.pages
      }
    };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return {
      filename,
      patient: categorizePatient(filename).id,
      error: error.message,
      processedAt: new Date().toISOString()
    };
  }
}

/**
 * Merge extracted data with existing database
 */
function mergeWithExisting(extractedData, existingData) {
  // Initialize if doesn't exist
  if (!existingData) {
    return {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      patients: extractedData.reduce((acc, record) => {
        if (!acc[record.patient]) {
          acc[record.patient] = {
            id: record.patient,
            name: record.patientName,
            labResults: []
          };
        }
        return acc;
      }, {}),
      lastProcessed: extractedData.length
    };
  }

  // Merge new data
  let updated = false;
  for (const record of extractedData) {
    if (!existingData.patients[record.patient]) {
      existingData.patients[record.patient] = {
        id: record.patient,
        name: record.patientName,
        labResults: []
      };
      updated = true;
    }

    // Check if already exists
    const exists = existingData.patients[record.patient].labResults.some(
      result => result.date === record.date && result.metadata.sourceFile === record.filename
    );

    if (!exists && !record.error) {
      existingData.patients[record.patient].labResults.push({
        date: record.date,
        labTests: record.labTests,
        metadata: record.metadata
      });
      updated = true;
    }
  }

  if (updated) {
    existingData.updatedAt = new Date().toISOString();
    existingData.lastProcessed = Object.values(existingData.patients)
      .reduce((sum, p) => sum + p.labResults.length, 0);
  }

  return existingData;
}

/**
 * Generate quality report
 */
function generateQualityReport(extractedData, mergedData) {
  const report = {
    summary: {
      totalProcessed: extractedData.length,
      successful: extractedData.filter(r => !r.error).length,
      failed: extractedData.filter(r => r.error).length,
      totalPatients: Object.keys(mergedData.patients).length,
      totalLabResults: Object.values(mergedData.patients)
        .reduce((sum, p) => sum + p.labResults.length, 0)
    },
    byPatient: {},
    issues: []
  };

  for (const [patientId, patient] of Object.entries(mergedData.patients)) {
    report.byPatient[patientId] = {
      name: patient.name,
      labResultsCount: patient.labResults.length,
      totalLabTests: patient.labResults.reduce((sum, r) => sum + r.labTests.length, 0)
    };
  }

  // Identify issues
  for (const record of extractedData) {
    if (record.error) {
      report.issues.push({
        file: record.filename,
        issue: 'Processing failed',
        details: record.error
      });
    } else if (record.labTests.length === 0) {
      report.issues.push({
        file: record.filename,
        issue: 'No lab tests extracted',
        details: 'Possible OCR or formatting issue'
      });
    }
  }

  return report;
}

/**
 * Main processing function
 */
async function main() {
  console.log('🏥 Medical PDF Processor v1.0');
  console.log('='.repeat(60));
  console.log(`Source Directory: ${CONFIG.sourceDir}`);
  console.log(`Output Directory: ${CONFIG.outputDir}`);

  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // Load existing data
  let existingData = null;
  if (fs.existsSync(CONFIG.dataFile)) {
    try {
      existingData = JSON.parse(fs.readFileSync(CONFIG.dataFile, 'utf8'));
      console.log(`\n📊 Loaded existing data: ${existingData.lastProcessed} lab results`);
    } catch (error) {
      console.warn(`⚠️  Could not load existing data: ${error.message}`);
    }
  }

  // Get all PDF files
  const files = fs.readdirSync(CONFIG.sourceDir)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .sort();

  console.log(`\n📁 Found ${files.length} PDF files`);

  // Process each PDF
  const extractedData = [];
  for (const file of files) {
    const filePath = path.join(CONFIG.sourceDir, file);
    const result = await processPDF(filePath, file);
    extractedData.push(result);
  }

  // Merge with existing data
  const mergedData = mergeWithExisting(extractedData, existingData);

  // Save merged data
  fs.writeFileSync(
    CONFIG.dataFile,
    JSON.stringify(mergedData, null, 2)
  );
  console.log(`\n💾 Saved data to: ${CONFIG.dataFile}`);

  // Save extracted data separately
  const extractedFile = path.join(CONFIG.outputDir, `extracted-${Date.now()}.json`);
  fs.writeFileSync(
    extractedFile,
    JSON.stringify(extractedData, null, 2)
  );
  console.log(`💾 Saved extracted data to: ${extractedFile}`);

  // Generate quality report
  const report = generateQualityReport(extractedData, mergedData);
  const reportFile = path.join(CONFIG.outputDir, `report-${Date.now()}.json`);
  fs.writeFileSync(
    reportFile,
    JSON.stringify(report, null, 2)
  );
  console.log(`📊 Quality report saved to: ${reportFile}`);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 PROCESSING SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Files: ${report.summary.totalProcessed}`);
  console.log(`✅ Successful: ${report.summary.successful}`);
  console.log(`❌ Failed: ${report.summary.failed}`);
  console.log(`👥 Patients: ${report.summary.totalPatients}`);
  console.log(`🧪 Lab Results: ${report.summary.totalLabResults}`);
  console.log(`⚠️  Issues: ${report.issues.length}`);

  if (report.issues.length > 0) {
    console.log('\n🚨 Issues Detected:');
    report.issues.forEach(issue => {
      console.log(`   - ${issue.file}: ${issue.issue}`);
    });
  }

  console.log('\n✨ Processing complete!');
}

// Run
main().catch(console.error);
