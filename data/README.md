# Medical Lab Data - Multi-Patient Database

## Overview

This directory contains the multi-patient medical lab data database and processed extraction results.

## Files

### `lab-data-complete.json` (Main Database)
**Purpose**: Complete medical lab data for all patients

**Structure**:
```json
{
  "version": "1.0.0",
  "createdAt": "2026-04-06T00:00:00.000Z",
  "updatedAt": "2026-04-06T00:00:00.000Z",
  "patients": {
    "patient_<id>": {
      "id": "patient_<id>",
      "name": "Patient Name",
      "gender": "M|F",
      "dateOfBirth": "YYYY-MM-DD",
      "labResults": [
        {
          "date": "YYYY-MM-DD",
          "labTests": [
            {
              "name": "Test Name",
              "value": "123",
              "unit": "mg/dL",
              "referenceRange": "min - max",
              "flag": "normal|high|low",
              "category": "blood|metabolic|liver|kidney|thyroid|other"
            }
          ],
          "metadata": {
            "sourceFile": "filename.pdf",
            "labName": "Laboratory Name",
            "processedAt": "ISO-8601-timestamp",
            "pdfPages": 3
          }
        }
      ]
    }
  },
  "lastProcessed": 0
}
```

### `processed/` Directory
**Purpose**: Temporary storage for extraction outputs and reports

**Contents**:
- `extracted-{timestamp}.json` - Raw extraction results from PDFs
- `report-{timestamp}.json` - Quality control reports

## Usage

### Read Database
```javascript
import labData from './lab-data-complete.json';

// Get all patients
const patients = Object.values(labData.patients);

// Get specific patient
const causio = labData.patients.patient_causius;

// Get lab results
const results = causio.labResults;
```

### Add Patient
```javascript
labData.patients.patient_mario = {
  id: 'patient_mario',
  name: 'Mario Rossi',
  gender: 'M',
  dateOfBirth: '1980-01-01',
  labResults: []
};

labData.updatedAt = new Date().toISOString();
```

### Add Lab Result
```javascript
import fs from 'fs';

labData.patients.patient_causius.labResults.push({
  date: '2024-06-23',
  labTests: [
    {
      name: 'Emoglobina',
      value: '14.5',
      unit: 'g/dL',
      referenceRange: '13.5 - 17.5',
      flag: 'normal',
      category: 'blood'
    }
  ],
  metadata: {
    sourceFile: 'causio 1.pdf',
    labName: 'Laboratorio Analisi',
    processedAt: new Date().toISOString(),
    pdfPages: 1
  }
});

labData.updatedAt = new Date().toISOString();
labData.lastProcessed++;

fs.writeFileSync(
  './lab-data-complete.json',
  JSON.stringify(labData, null, 2)
);
```

## Schema Reference

### Patient Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique patient identifier |
| name | string | Yes | Patient full name |
| gender | string | Yes | M or F |
| dateOfBirth | string | No | YYYY-MM-DD format |
| labResults | array | Yes | Array of lab result objects |

### Lab Result Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| date | string | Yes | Test date (YYYY-MM-DD) |
| labTests | array | Yes | Array of lab test objects |
| metadata | object | Yes | Source file metadata |

### Lab Test Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Test name |
| value | string | Yes | Numeric value |
| unit | string | Yes | Unit of measurement |
| referenceRange | string | No | Normal range |
| flag | string | No | normal|high|low |
| category | string | No | Test category |

## Patient IDs

Current patients in database:
- `patient_chiara` - Chiara (Female)
- `patient_causius` - Causio (Male)

To add a new patient:
1. Create unique ID: `patient_<name_lowercase>`
2. Add to `lab-data-complete.json`
3. Update patient categorization in `scripts/process-pdfs.js`

## Validation

### Validate Patient Data
```javascript
import { validateLabResults } from '../server/utils/data-validator';
import labData from './lab-data-complete.json';

const patient = labData.patients.patient_causius;
const validation = validateLabResults(patient.labResults, patient);

console.log(validation);
// {
//   overall: { total: 210, normal: 185, abnormal: 25, critical: 3 },
//   tests: [...]
// }
```

### Generate Validation Report
```javascript
import { generateValidationReport } from '../server/utils/data-validator';
import labData from './lab-data-complete.json';

const report = generateValidationReport(labData.patients);
console.log(report);
// {
//   timestamp: "2026-04-06T10:00:00.000Z",
//   summary: { totalPatients: 2, totalTests: 210, ... },
//   patients: { ... }
// }
```

## Security & Privacy

### Encryption (Optional)
```bash
# Encrypt database
openssl enc -aes-256-cbc -salt -in lab-data-complete.json -out lab-data-complete.json.enc

# Decrypt database
openssl enc -aes-256-cbc -d -in lab-data-complete.json.enc -out lab-data-complete.json
```

### Access Control
- Keep `.gitignore` updated to exclude this file from version control
- Use file system permissions to restrict access
- Consider encryption for production deployments
- Implement authentication for server access

### Backup
```bash
# Create backup
cp lab-data-complete.json lab-data-complete.backup.$(date +%Y%m%d).json

# Restore from backup
cp lab-data-complete.backup.20260406.json lab-data-complete.json
```

## Maintenance

### Update Database
```bash
# Process new PDFs
npm run process:pdfs

# Database is automatically updated with:
# - New patients (if detected)
# - New lab results
# - Updated metadata
```

### Cleanup Old Files
```bash
# Remove old extraction reports (keep last 10)
cd processed
ls -t extracted-*.json | tail -n +11 | xargs rm -f
ls -t report-*.json | tail -n +11 | xargs rm -f
```

### Validate Database
```javascript
import fs from 'fs';
import { generateValidationReport } from '../server/utils/data-validator';

const labData = JSON.parse(fs.readFileSync('./lab-data-complete.json', 'utf8'));
const report = generateValidationReport(labData.patients);

console.log('Validation Report:', report);

// Check for critical issues
if (report.summary.criticalTests > 0) {
  console.warn(`⚠️  Found ${report.summary.criticalTests} critical test results`);
}
```

## Troubleshooting

### Database Corrupted
```bash
# Restore from backup
cd data
ls -lt lab-data-complete.backup.*.json | head -1 | awk '{print $NF}' | xargs -I {} cp {} lab-data-complete.json
```

### Missing Patient Data
```bash
# Re-process PDFs
npm run process:pdfs

# Check extraction report
cat processed/report-*.json | jq '.issues'
```

### Invalid JSON
```bash
# Validate JSON syntax
cat lab-data-complete.json | jq .

# If error, restore from backup
```

## Integration Examples

### React Component
```jsx
import React, { useState, useEffect } from 'react';
import labData from './data/lab-data-complete.json';
import { validateLabResults } from './server/utils/data-validator';

function PatientDashboard({ patientId }) {
  const [patient, setPatient] = useState(null);
  const [validation, setValidation] = useState(null);

  useEffect(() => {
    const patientData = labData.patients[patientId];
    setPatient(patientData);
    setValidation(validateLabResults(patientData.labResults, patientData));
  }, [patientId]);

  if (!patient) return <div>Loading...</div>;

  return (
    <div>
      <h1>{patient.name}</h1>
      <p>Total Lab Results: {patient.labResults.length}</p>
      <p>Normal Tests: {validation.overall.normal}</p>
      <p>Abnormal Tests: {validation.overall.abnormal}</p>
    </div>
  );
}
```

### Express API
```javascript
import express from 'express';
import labData from './data/lab-data-complete.json';
import { validateLabResults } from './server/utils/data-validator';

const app = express();

app.get('/api/patients', (req, res) => {
  const patients = Object.values(labData.patients).map(p => ({
    id: p.id,
    name: p.name,
    labResultsCount: p.labResults.length
  }));
  res.json(patients);
});

app.get('/api/patients/:id', (req, res) => {
  const patient = labData.patients[req.params.id];
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const validation = validateLabResults(patient.labResults, patient);
  res.json({ patient, validation });
});

app.listen(3000);
```

## Support

### Documentation
- `../docs/PDF_PROCESSING_GUIDE.md` - Complete system guide
- `../docs/QUICK_START.md` - Quick start guide
- `../docs/IMPLEMENTATION_SUMMARY.md` - Technical details

### Issues
1. Check database structure matches schema
2. Validate JSON syntax: `cat lab-data-complete.json | jq .`
3. Review extraction reports: `processed/report-*.json`
4. Check patient IDs match in both database and UI

---

**Last Updated**: 2026-04-06
**Maintainer**: Causio
**Database Version**: 1.0.0
