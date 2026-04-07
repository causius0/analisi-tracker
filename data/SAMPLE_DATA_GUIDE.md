# Sample Data Quick Reference

## File Overview

| File | Size | Patients | Test Dates | Total Tests | Use Case |
|------|------|----------|------------|-------------|----------|
| **lab-data-sample.json** | Large | 2 | 10 | 280 | Full testing & demos |
| **lab-data-minimal.json** | Small | 2 | 2 | 19 | Quick testing |
| **lab-data-empty.json** | Tiny | 0 | 0 | 0 | Template for new data |

---

## Patient Profiles at a Glance

### Chiara (Female, Age 30)
```
Status: Diabetes - IMPROVING 📈
Conditions: Type 2 Diabetes, Hypertension
Medications: Metformin, Lisinopril
Tests: 4 dates (Jan-Sep 2024)
Key Trend: HbA1c 6.2% → 5.4% (normal)
```

**Key Tests to View:**
- Glucose & HbA1c (improving trend)
- Lipid panel (improving trend)
- Kidney function (stable normal)
- Liver enzymes (stable normal)

### Causio (Male, Age 36)
```
Status: Kidney Disease - DECLINING 📉
Conditions: Hypertension, Hyperlipidemia
Medications: Amlodipine, Atorvastatin
Tests: 6 dates (Jan 2022-Apr 2024)
Key Trend: eGFR 88 → 65 (CKD Stage 2-3)
```

**Key Tests to View:**
- Creatinine & eGFR (worsening trend)
- Lipid panel (improving with statins)
- BUN (elevating)
- Glucose (stable normal)

---

## Test Scenarios Quick Reference

### Scenario 1: Improving Trend (Treatment Success)
**Patient:** Chiara
**Tests:** Glucose, HbA1c
**Timeline:** 9 months
**Pattern:** High → Normal
**Use For:** Treatment effectiveness, goal achievement

### Scenario 2: Worsening Trend (Disease Progression)
**Patient:** Causio
**Tests:** Creatinine, eGFR, BUN
**Timeline:** 27 months
**Pattern:** Normal → Abnormal
**Use For:** Disease monitoring, early intervention

### Scenario 3: Rapid Response (Medication Effect)
**Patient:** Causio
**Tests:** Cholesterol, LDL, Triglycerides
**Timeline:** 6 months after starting statins
**Pattern:** High → Normal (rapid)
**Use For:** Medication efficacy evaluation

### Scenario 4: Stable Normal (Baseline)
**Patient:** Chiara
**Tests:** ALT, AST, TSH
**Timeline:** 9 months
**Pattern:** All normal, minimal variation
**Use For:** Reference ranges, healthy baseline

### Scenario 5: Seasonal Variation
**Patients:** Both
**Tests:** Vitamin D
**Timeline:** Multiple seasons
**Pattern:** Winter low, summer high
**Use For:** Seasonal patterns, supplementation tracking

---

## Test Categories & Tests

### Complete Data (28 tests per date)
- **Kidney (3):** Creatinine, eGFR, BUN
- **Liver (2):** ALT, AST
- **Metabolic (3):** Glucose, HbA1c, Uric Acid
- **Lipid (4):** Total Cholesterol, HDL, LDL, Triglycerides
- **Blood (5):** Hemoglobin, Hematocrit, WBC, RBC, Platelets
- **Thyroid (2):** TSH, Free T4
- **Electrolyte (3):** Potassium, Sodium, Calcium
- **Vitamin (2):** Vitamin D, Vitamin B12
- **Mineral (2):** Iron, Ferritin
- **Protein (3):** Total Protein, Albumin, Globulin

### Minimal Data (10 tests per date)
- **Kidney (2):** Creatinine, eGFR
- **Metabolic (1-2):** Glucose, HbA1c
- **Lipid (4):** Total Cholesterol, HDL, LDL, Triglycerides
- **Blood (1):** Hemoglobin
- **Thyroid (1):** TSH

---

## Quick Start Commands

### Load Sample Data
```bash
# Full sample data (recommended)
cp data/lab-data-sample.json data/lab-data-complete.json

# Minimal data (quick testing)
cp data/lab-data-minimal.json data/lab-data-complete.json

# Empty template
cp data/lab-data-empty.json data/lab-data-complete.json
```

### View in Application
```bash
# Start the application
npm start

# Open browser
open http://localhost:3000

# Select patient and view data
```

### Test Analytics
```bash
# Run trend analysis
npm run trends

# Run correlation analysis
npm run correlate

# Run anomaly detection
npm run anomalies

# Run predictions
npm run predict
```

---

## Data Validation

### Check Data Integrity
```bash
# Validate JSON syntax
cat data/lab-data-sample.json | jq .

# Count patients
cat data/lab-data-sample.json | jq '.patients | length'

# Count lab results
cat data/lab-data-sample.json | jq '.patients[].labResults | length'

# List test dates
cat data/lab-data-sample.json | jq '.patients[].labResults[].date'
```

### Expected Results
```bash
# Sample data
Patients: 2
Total lab results: 10 (Chiara: 4, Causio: 6)
Total tests: 280 (Chiara: 112, Causius: 168)

# Minimal data
Patients: 2
Total lab results: 2 (Chiara: 1, Causius: 1)
Total tests: 19 (Chiara: 10, Causius: 9)
```

---

## Common Test Cases

### Test Case 1: View Patient Dashboard
1. Load sample data
2. Start application
3. Select "Chiara"
4. Verify: Patient info displays, lab results load

### Test Case 2: View Trend Graph
1. Select "Chiara"
2. Click "Glucose"
3. Verify: Trend shows decreasing values
4. Verify: Normal range shaded
5. Verify: Flags display correctly

### Test Case 3: Compare Two Tests
1. Select "Causio"
2. Select "Creatinine" and "eGFR"
3. Verify: Inverse correlation visible
4. Verify: Both trends display

### Test Case 4: Filter by Category
1. Select "Chiara"
2. Filter by "Lipid"
3. Verify: Only lipid tests show
4. Verify: 4 tests displayed

### Test Case 5: Search Test
1. Select "Causio"
2. Search "Vitamin D"
3. Verify: Only Vitamin D results show
4. Verify: All dates displayed

---

## Troubleshooting

### Data Not Loading
**Problem:** Application shows no data
**Solution:**
```bash
# Verify file exists
ls -la data/lab-data-complete.json

# Check file size (should be > 0)
du -h data/lab-data-complete.json

# Validate JSON
cat data/lab-data-complete.json | jq .
```

### Incorrect Patient Count
**Problem:** Wrong number of patients
**Solution:**
```bash
# Check patient count
cat data/lab-data-complete.json | jq '.patients | length'

# Should be 2 for sample/minimal, 0 for empty
```

### Missing Test Results
**Problem:** No lab results showing
**Solution:**
```bash
# Check lab results array
cat data/lab-data-complete.json | jq '.patients[].labResults | length'

# Should be 4 (Chiara) + 6 (Causius) = 10 for sample data
```

### Invalid JSON
**Problem:** JSON parse error
**Solution:**
```bash
# Validate and pretty-print
cat data/lab-data-sample.json | jq . > data/lab-data-complete.json

# If error, restore from backup
cp data/lab-data-sample.json data/lab-data-complete.json
```

---

## Data Customization

### Add New Patient
```json
{
  "id": "patient_mario",
  "name": "Mario Rossi",
  "dateOfBirth": "1985-03-20",
  "gender": "M",
  "bloodType": "B+",
  "allergies": [],
  "medications": [],
  "conditions": [],
  "labResults": []
}
```

### Add Lab Result
```json
{
  "date": "2024-06-15",
  "labTests": [
    {
      "name": "Glucose",
      "value": "95",
      "unit": "mg/dL",
      "referenceRange": "70 - 100",
      "flag": "normal",
      "category": "metabolic"
    }
  ],
  "metadata": {
    "sourceFile": "mario-labs-2024-06-15.pdf",
    "labName": "Laboratorio Analisi",
    "processedAt": "2024-06-15T10:00:00.000Z",
    "pdfPages": 2,
    "notes": "Annual physical"
  }
}
```

### Modify Existing Data
```bash
# Edit file
vim data/lab-data-complete.json

# Or use JSON editor
code data/lab-data-complete.json

# Validate changes
cat data/lab-data-complete.json | jq .
```

---

## Performance Notes

### File Sizes
- **Sample data:** ~150 KB
- **Minimal data:** ~15 KB
- **Empty data:** ~1 KB

### Load Times
- **Sample data:** ~100ms
- **Minimal data:** ~10ms
- **Empty data:** ~1ms

### Memory Usage
- **Sample data:** ~2 MB
- **Minimal data:** ~500 KB
- **Empty data:** ~100 KB

---

## Export & Backup

### Export Current Data
```bash
# Create timestamped backup
cp data/lab-data-complete.json \
   data/backups/lab-data-backup-$(date +%Y%m%d-%H%M%S).json
```

### Import from Backup
```bash
# List backups
ls -lt data/backups/

# Restore specific backup
cp data/backups/lab-data-backup-20240407-100000.json \
   data/lab-data-complete.json
```

### Export to CSV
```bash
# Use built-in export feature
npm run export -- --format=csv --output=data/export.csv
```

---

## Related Documentation

- **SAMPLE_DATA_REPORT.md** - Detailed validation report
- **README.md** - Main database documentation
- **../docs/** - Application documentation
- **../server/db/schema.js** - Database schema

---

**Last Updated:** 2026-04-07
**Data Version:** 1.0.0
