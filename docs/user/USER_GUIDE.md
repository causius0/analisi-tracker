# Analisi Tracker - User Guide

## Table of Contents
- [Getting Started](#getting-started)
- [Dashboard Overview](#dashboard-overview)
- [Adding Lab Data](#adding-lab-data)
- [Understanding Analytics](#understanding-analytics)
- [PDF Processing](#pdf-processing)
- [Managing Multiple Patients](#managing-multiple-patients)
- [Interpreting Results](#interpreting-results)
- [Exporting Data](#exporting-data)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is Analisi Tracker?

Analisi Tracker is an advanced medical analytics platform that helps you:
- **Track trends** in your lab test results over time
- **Detect anomalies** and unusual patterns
- **Predict future values** using machine learning
- **Correlate results** between different tests
- **Process PDFs** from lab providers automatically
- **Manage multiple patients** in one system

### System Requirements

- **Web Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Internet Connection**: Required for all features
- **PDF Support**: For processing lab reports (optional)

### First-Time Setup

1. **Access the Application**
   - Open your web browser
   - Navigate to your application URL (e.g., `https://analisi-tracker.example.com`)
   - Or run locally: `http://localhost:3000`

2. **Create Your Profile**
   - Click "Get Started" or "Sign Up"
   - Enter your name and email
   - Set a secure password

3. **Add Your First Patient**
   - Enter patient name and date of birth
   - Set reference ranges (optional - system uses standard values)
   - Click "Create Patient Profile"

---

## Dashboard Overview

### Main Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│ Analisi Tracker                          [Patient ▼]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Glucose     │  │ Creatinine   │  │    eGFR      │ │
│  │    85 mg/dL  │  │   0.78 mg/dL │  │   95 mL/min  │ │
│  │   ✓ Normal   │  │   ✓ Normal   │  │   ✓ Normal   │ │
│  │   ↓ 8%       │  │   ↓ 12%      │  │   ↑ 5%       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  [Trends]  [Correlations]  [Anomalies]  [Predictions]   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │              Chart Area                            │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [+ Add Data]  [Upload PDF]  [Export]                   │
└─────────────────────────────────────────────────────────┘
```

### Navigation Menu

- **Dashboard**: Overview of all lab tests
- **Trends**: Detailed trend analysis
- **Correlations**: Relationships between tests
- **Anomalies**: Outliers and unusual values
- **Predictions**: Forecasts and risk assessment
- **Data Management**: Add, edit, export data

---

## Adding Lab Data

### Manual Data Entry

#### Step 1: Select Patient
1. Click the patient selector dropdown (top right)
2. Choose the patient you want to add data for

#### Step 2: Add Lab Results
1. Click "+ Add Data" button
2. Fill in the form:
   - **Test Date**: When the test was performed
   - **Lab Test Name**: e.g., "Glucose", "Creatinine"
   - **Value**: Numeric result
   - **Unit**: e.g., "mg/dL", "U/L"
   - **Reference Range**: Optional (uses defaults if empty)
   - **Notes**: Any additional information

3. Click "Save"

#### Example Entry:
```
Test Date: 2026-04-06
Lab Test: Glucose
Value: 95
Unit: mg/dL
Reference Min: 70
Reference Max: 100
Notes: Fasting test
```

### Bulk Import

1. Click "Data Management" → "Import"
2. Download the CSV template
3. Fill in your data:
   ```csv
   date,lab_test,value,unit,reference_min,reference_max,notes
   2026-04-01,Glucose,92,mg/dL,70,100,Fasting
   2026-04-01,Creatinine,0.9,mg/dL,0.7,1.3,
   2026-04-01,eGFR,95,mL/min/1.73m²,90,120,
   ```
4. Upload the filled CSV
5. Review and confirm import

---

## Understanding Analytics

### Trend Analysis

#### What Are Trends?

Trends show how your lab values change over time:
- **Improving** (↓): Values moving toward healthy range
- **Worsening** (↑): Values moving away from healthy range
- **Stable** (→): No significant change

#### Trend Indicators

**Direction Arrow:**
- ↓ Green: Improving
- ↑ Red: Worsening
- → Gray: Stable

**Rate of Change:**
- Shown as percentage and absolute change
- Example: "↓ 8% (-0.15 mg/dL per month)"

**Strength:**
- **Very Strong**: Clear pattern, high confidence
- **Strong**: Noticeable pattern
- **Moderate**: Some pattern visible
- **Weak**: No clear pattern

#### View Detailed Trends

1. Click "Trends" in navigation
2. Select lab test from dropdown
3. View detailed analysis:
   - **Trend Line**: Visual representation
   - **Statistics**: R² value, p-value, confidence
   - **Seasonality**: Monthly/quarterly patterns
   - **Accelerations**: Speeding up or slowing down

### Correlation Analysis

#### What Are Correlations?

Correlations show relationships between different lab tests:
- **Positive correlation** (+): Both increase together
- **Negative correlation** (-): One increases when other decreases
- **No correlation** (0): No relationship

#### Correlation Strength

| Correlation | Strength | Meaning |
|-------------|----------|---------|
| 0.9 to 1.0 | Very Strong | Almost perfect relationship |
| 0.7 to 0.9 | Strong | Clear relationship |
| 0.4 to 0.7 | Moderate | Noticeable relationship |
| 0.2 to 0.4 | Weak | Slight relationship |
| 0 to 0.2 | Very Weak | Minimal relationship |

#### Example Correlations

**Creatinine & eGFR**: -0.95 (Very Strong Negative)
- As creatinine increases, eGFR decreases
- Expected: Kidney function relationship

**Glucose & HbA1c**: +0.82 (Strong Positive)
- As glucose increases, HbA1c increases
- Expected: Long-term blood sugar relationship

#### View Correlations

1. Click "Correlations" in navigation
2. Select multiple lab tests to compare
3. View correlation matrix with:
   - Color-coded values (red=positive, blue=negative)
   - Statistical significance (p-values)
   - Scatter plots

### Anomaly Detection

#### What Are Anomalies?

Anomalies are unusual values that stand out from your typical results:
- **Statistical outliers**: Values far from your average
- **Sudden spikes/drops**: Rapid changes between tests
- **Persistent abnormalities**: Consistently high/low values

#### Anomaly Severity

| Severity | Z-Score | Meaning |
|----------|---------|---------|
| Extreme | >5 | Very unusual, investigate |
| High | 4-5 | Unusual, monitor closely |
| Moderate | 3-4 | Somewhat unusual |
| Low | 2-3 | Slightly unusual |

#### View Anomalies

1. Click "Anomalies" in navigation
2. Select lab test
3. View flagged values:
   - **Red dots**: Extreme/High severity
   - **Yellow dots**: Moderate severity
   - **Explanation**: Why it was flagged
   - **Recommendations**: What to do

### Predictive Analytics

#### What Are Predictions?

Predictions forecast your future lab values based on historical trends:
- **30-day forecast**: Short-term prediction
- **90-day forecast**: Medium-term prediction
- **Confidence levels**: How certain the prediction is

#### Risk Assessment

Risk levels indicate if values might go outside healthy range:

| Risk Level | Score | Meaning |
|------------|-------|---------|
| Very High | 75-100 | Immediate attention needed |
| High | 50-75 | Monitor closely |
| Medium | 25-50 | Be aware |
| Low | 0-25 | Normal range expected |

#### View Predictions

1. Click "Predictions" in navigation
2. Select lab test
3. View:
   - **Forecast chart**: Predicted values with confidence bands
   - **Risk level**: Current risk assessment
   - **Warnings**: Early alerts for potential issues
   - **Recommendations**: What you can do

---

## PDF Processing

### Supported PDF Types

1. **Digital PDFs** (recommended)
   - Text-based lab reports
   - Higher extraction accuracy
   - Faster processing

2. **Scanned PDFs**
   - Image-based reports
   - OCR required (slower)
   - May have errors

### How to Upload PDFs

#### Step 1: Select Patient
1. Click patient dropdown
2. Choose patient to add data for

#### Step 2: Upload PDF
1. Click "Upload PDF" button
2. Select file from your computer
3. Wait for processing (10-30 seconds)

#### Step 3: Review Extracted Data
1. Check extracted values:
   - **Lab test names**
   - **Values and units**
   - **Reference ranges**
   - **Test dates**

2. Edit if needed:
   - Click on any field to edit
   - Correct misidentified values
   - Add missing information

3. Confirm import:
   - Click "Import Data"
   - Values added to patient record

### Extraction Quality

The system provides a quality report:

| Success Rate | Meaning |
|--------------|---------|
| 95-100% | Excellent - All data extracted correctly |
| 85-94% | Good - Most data correct, minor errors |
| 70-84% | Fair - Some errors, review needed |
| <70% | Poor - Manual entry recommended |

### Tips for Best Results

1. **Use digital PDFs** when possible
2. **Ensure scans are clear** and well-lit
3. **Crop to relevant sections** only
4. **Avoid handwriting** in reports
5. **Review extracted data** before confirming

---

## Managing Multiple Patients

### Adding a New Patient

1. Click "Patient Management"
2. Click "+ Add Patient"
3. Fill in:
   - **Name**: Patient's full name
   - **Date of Birth**: For age calculations
   - **Gender**: For reference ranges
   - **Medical Notes**: Any relevant conditions

4. Click "Create Patient"

### Switching Between Patients

1. Click patient dropdown (top right)
2. Select patient from list
3. Dashboard updates to show selected patient's data

### Patient Comparison

1. Click "Patient Management" → "Compare"
2. Select 2-3 patients
3. View side-by-side:
   - Current values
   - Trends
   - Risk levels
   - Charts

### Patient Settings

Each patient has customizable settings:
- **Reference ranges**: Custom normal ranges
- **Alert thresholds**: When to notify
- **Data retention**: How long to keep data
- **Export preferences**: Default formats

---

## Interpreting Results

### Understanding Reference Ranges

**Standard Reference Range**: Population-based normal values
- Example: Glucose 70-100 mg/dL
- Based on healthy population
- May not be optimal for you

**Personalized Range**: Based on your historical data
- Calculated from your values
- More relevant to you
- 95% confidence interval

### Reading Charts

#### Trend Charts
```
Value
 ↑
 │     ●───●───●
 │           ╲
 │            ╲
 └───────────────→ Time
```
- **Blue line**: Your values
- **Green zone**: Normal range
- **Red zones**: Outside normal range
- **Shaded area**: Prediction confidence

#### Correlation Scatter Plots
```
Variable 2
 ↑
 │       ●
 │     ●   ●
 │   ●
 │ ●
 └─────────────→ Variable 1
```
- **Each dot**: One time point
- **Trend line**: Correlation direction
- **Color**: Significance (red=significant)

### Status Indicators

| Status | Icon | Meaning |
|--------|------|---------|
| Normal | ✓ | Value within normal range |
| High | ↑ | Value above normal range |
| Low | ↓ | Value below normal range |
| Warning | ⚠ | Trend worsening or risk detected |
| Error | ✗ | Data issue or missing value |

---

## Exporting Data

### Export Formats

1. **PDF Report**
   - Professional medical report
   - Includes charts and analysis
   - Suitable for sharing with providers

2. **CSV Data**
   - Raw data spreadsheet
   - Compatible with Excel
   - For further analysis

3. **JSON Data**
   - Machine-readable format
   - For developers or importing elsewhere

### How to Export

1. Click "Export" button
2. Select format:
   - PDF Report (recommended for providers)
   - CSV Data (for spreadsheets)
   - JSON Data (for developers)

3. Choose date range:
   - Last 30 days
   - Last 90 days
   - All time
   - Custom range

4. Select what to include:
   - Trends
   - Correlations
   - Anomalies
   - Predictions
   - Raw data

5. Click "Generate Export"
6. Download file when ready

### Sharing with Healthcare Providers

**Best Practice:**
1. Export as PDF Report
2. Review before sharing
3. Include notes about unusual values
4. Send via secure messaging or bring to appointment

---

## Troubleshooting

### Common Issues

#### "No data available" message

**Problem**: No lab test data for selected patient

**Solutions**:
1. Add data manually using "+ Add Data"
2. Upload a PDF with lab results
3. Import from CSV file
4. Check you have selected the correct patient

#### "Processing failed" error

**Problem**: PDF processing failed

**Solutions**:
1. Check PDF file is not corrupted
2. Try a different PDF (digital vs scanned)
3. Ensure PDF is not password protected
4. Reduce file size (max 10MB)
5. Contact support if issue persists

#### Incorrect trends displayed

**Problem**: Trend direction seems wrong

**Solutions**:
1. Check you have enough data points (minimum 5)
2. Verify data dates are correct
3. Look for outliers affecting trend
4. Try excluding anomalous values
5. Consult healthcare provider for interpretation

#### Predictions seem inaccurate

**Problem**: Forecast doesn't match expectations

**Solutions**:
1. Understand predictions are estimates
2. Check confidence level (low confidence = less accurate)
3. Ensure you have sufficient historical data
4. Recent events (medications, illness) affect accuracy
5. Use predictions as guidance, not certainty

#### Cannot switch patients

**Problem**: Patient dropdown not working

**Solutions**:
1. Refresh the page
2. Clear browser cache
3. Check you have permission to view patient
4. Try logging out and back in

### Getting Help

**In-App Help**:
- Click "?" icon in top right
- Search knowledge base
- Browse tutorials

**Contact Support**:
- Email: support@analisi-tracker.com
- Response time: Within 24 hours
- Include: Patient ID (without personal info), screenshot, error message

**Emergency**:
- For medical emergencies, contact your healthcare provider
- This app is not a substitute for professional medical advice

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + D | Go to Dashboard |
| Ctrl/Cmd + T | Go to Trends |
| Ctrl/Cmd + C | Go to Correlations |
| Ctrl/Cmd + A | Go to Anomalies |
| Ctrl/Cmd + P | Go to Predictions |
| Ctrl/Cmd + N | Add new data |
| Ctrl/Cmd + U | Upload PDF |
| Ctrl/Cmd + E | Export data |
| Escape | Close modal/dialog |
| ? | Show keyboard shortcuts |

---

## Tips for Best Results

### Data Quality

1. **Be consistent**: Test at same time of day when possible
2. **Note conditions**: Record fasting status, medications
3. **Date accuracy**: Ensure test dates are correct
4. **Regular testing**: More data = better analysis
5. **Verify values**: Double-check data entry

### Interpreting Results

1. **Look at trends**: Single values less important than patterns
2. **Consider context**: Medications, diet, illness affect results
3. **Discuss with providers**: Share reports with healthcare team
4. **Set realistic expectations**: Predictions are estimates
5. **Track changes**: Note what interventions improve values

### Privacy & Security

1. **Use strong passwords**: Mix of letters, numbers, symbols
2. **Don't share credentials**: Keep login information private
3. **Log out when done**: Especially on shared computers
4. **Secure sharing**: Use secure messaging for medical data
5. **Review access**: Regularly check who has access

---

## FAQ

**Q: How often should I update my data?**
A: As often as you have new lab results. Many users update after each blood test.

**Q: Can I use this for multiple family members?**
A: Yes! You can manage multiple patients in one account.

**Q: Is my data secure?**
A: Yes, we use encryption and follow healthcare data security best practices.

**Q: Can my doctor access my data?**
A: Yes, export reports as PDF and share via secure messaging.

**Q: What if I don't understand my results?**
A: Always consult with your healthcare provider for interpretation.

**Q: How accurate are the predictions?**
A: Predictions are estimates based on trends. Accuracy depends on data quality and quantity.

---

## Next Steps

- [ ] Add your first lab test result
- [ ] Upload a PDF lab report
- [ ] Explore trend analysis
- [ ] Check correlations between tests
- [ ] Review any anomalies
- [ ] View predictions for next 30 days
- [ ] Export a report for your provider

---

**Version**: 1.0.0
**Last Updated**: April 2026
