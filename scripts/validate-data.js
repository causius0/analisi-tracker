#!/usr/bin/env node

/**
 * Analisi Tracker - Data Validation Script
 *
 * Validates lab data JSON structure and provides helpful error messages
 */

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'lab-data.json');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function validateData(data) {
  const errors = [];
  const warnings = [];

  // Check if data exists
  if (!data) {
    errors.push('Data is empty or null');
    return { errors, warnings };
  }

  // Check version
  if (!data.version) {
    warnings.push('Missing version field');
  }

  // Check patients
  if (!data.patients) {
    errors.push('Missing patients object');
  } else {
    const patientIds = Object.keys(data.patients);

    if (patientIds.length === 0) {
      warnings.push('No patients defined');
    } else {
      log(colors.blue, `\nFound ${patientIds.length} patient(s):`);

      for (const patientId of patientIds) {
        const patient = data.patients[patientId];

        // Validate patient structure
        if (!patient.id) {
          errors.push(`Patient ${patientId}: missing id field`);
        }
        if (!patient.name) {
          errors.push(`Patient ${patientId}: missing name field`);
        }
        if (!patient.labResults) {
          warnings.push(`Patient ${patientId}: no lab results`);
        } else {
          log(colors.green, `  ✓ ${patient.name} (${patient.labResults.length} lab results)`);

          // Count results by test type
          const testCounts = {};
          for (const result of patient.labResults) {
            const testName = result.testName || 'Unknown';
            testCounts[testName] = (testCounts[testName] || 0) + 1;
          }

          // Show test breakdown
          for (const [testName, count] of Object.entries(testCounts)) {
            log(colors.blue, `    - ${testName}: ${count} reading(s)`);
          }
        }
      }
    }
  }

  // Check context
  if (!data.context) {
    warnings.push('Missing context object (medications, events)');
  } else {
    if (data.context.medications && data.context.medications.length > 0) {
      log(colors.green, `\n  ✓ ${data.context.medications.length} medication(s) defined`);
    }
    if (data.context.events && data.context.events.length > 0) {
      log(colors.green, `  ✓ ${data.context.events.length} event(s) defined`);
    }
  }

  return { errors, warnings };
}

function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  Analisi Tracker - Data Validation');
  console.log('='.repeat(70) + '\n');

  // Check if file exists
  if (!fs.existsSync(DATA_FILE)) {
    log(colors.red, `✗ Data file not found: ${DATA_FILE}`);
    log(colors.yellow, '\nRun setup first:');
    log(colors.blue, '  ./setup.sh        # Mac/Linux');
    log(colors.blue, '  setup.bat         # Windows');
    console.log('');
    process.exit(1);
  }

  // Read and parse file
  let data;
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    data = JSON.parse(content);
    log(colors.green, '✓ Valid JSON format');
  } catch (error) {
    log(colors.red, `✗ Invalid JSON: ${error.message}`);
    process.exit(1);
  }

  // Validate structure
  const { errors, warnings } = validateData(data);

  // Show results
  console.log('');

  if (errors.length > 0) {
    log(colors.red, '\n✗ Validation errors:');
    for (const error of errors) {
      log(colors.red, `  - ${error}`);
    }
  }

  if (warnings.length > 0) {
    log(colors.yellow, '\n⚠ Warnings:');
    for (const warning of warnings) {
      log(colors.yellow, `  - ${warning}`);
    }
  }

  console.log('\n' + '='.repeat(70));

  if (errors.length === 0) {
    log(colors.green, '✓ Data validation passed!');
    console.log('='.repeat(70) + '\n');
    process.exit(0);
  } else {
    log(colors.red, '✗ Data validation failed!');
    console.log('='.repeat(70) + '\n');
    process.exit(1);
  }
}

main();
