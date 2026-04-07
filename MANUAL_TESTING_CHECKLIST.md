# Analisi Tracker - Manual Testing Checklist

**Version:** 2.0.0
**Date:** April 7, 2026
**Purpose:** Comprehensive manual testing guide for the analisi-tracker application

---

## Pre-Test Setup

### Environment Checklist

- [ ] **Node.js installed** (v18 or v20 recommended)
  ```bash
  node --version
  ```

- [ ] **npm installed**
  ```bash
  npm --version
  ```

- [ ] **Dependencies installed**
  ```bash
  npm install
  cd client && npm install && cd ..
  ```

- [ ] **.env file configured**
  ```bash
  cp .env.example .env
  # Edit .env with your configuration
  ```

- [ ] **Database available** (PostgreSQL or SQLite)
  ```bash
  # For PostgreSQL
  createdb analisi_tracker

  # Or use SQLite (no setup needed)
  ```

- [ ] **Bug fixes applied**
  ```bash
  bash scripts/fix-critical-bugs.sh
  ```

---

## Startup Tests

### Test 1: Server Startup

**Objective:** Verify server starts without errors

**Steps:**
1. Open terminal
2. Run: `npm run server:dev`
3. Wait for startup message
4. Check console for errors

**Expected Results:**
- [ ] Server starts on port 3000 (or configured port)
- [ ] No error messages in console
- [ ] Startup banner displays correctly
- [ ] Database connection successful

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

### Test 2: Client Startup

**Objective:** Verify Next.js client starts successfully

**Steps:**
1. Open new terminal
2. Run: `npm run client:dev`
3. Wait for compilation
4. Check for TypeScript errors

**Expected Results:**
- [ ] Client starts on port 3001 (default)
- [ ] No TypeScript errors
- [ ] No compilation warnings
- [ ] Ready in ~X seconds message displays

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

### Test 3: Health Check Endpoint

**Objective:** Verify API is responding

**Steps:**
1. Open terminal
2. Run: `curl http://localhost:3000/health`
3. Or use browser: http://localhost:3000/health

**Expected Results:**
- [ ] Status code: 200
- [ ] Response includes: `"status": "ok"`
- [ ] Response includes: `"version": "2.0.0"`
- [ ] Response includes: `"uptime"` (number)

**Actual Results:**
```json
[Paste response here]
```

**Status:** ⬜ Pass / ❌ Fail

---

## UI Tests

### Test 4: Homepage Loads

**Objective:** Verify main page loads correctly

**Steps:**
1. Open browser
2. Navigate to: http://localhost:3001
3. Wait for page to load
4. Check browser console (F12)

**Expected Results:**
- [ ] Page loads within 3 seconds
- [ ] No console errors
- [ ] No console warnings
- [ ] Title displays: "Analisi Tracker"
- [ ] Layout is visible and properly formatted

**Actual Results:**
```
[Notes, console errors if any]

```

**Status:** ⬜ Pass / ❌ Fail

---

### Test 5: Patient Selector

**Objective:** Verify patient selection UI works

**Steps:**
1. On homepage, look for patient selector
2. Click on patient dropdown
3. Select different patient (if available)
4. Verify UI updates

**Expected Results:**
- [ ] Patient selector is visible
- [ ] Default patient is selected
- [ ] Dropdown lists available patients
- [ ] UI updates when patient changes
- [ ] No errors in console

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

### Test 6: Lab Data Display

**Objective:** Verify lab test data displays correctly

**Steps:**
1. Navigate to dashboard
2. Look for lab test list
3. Check individual lab test cards
4. Verify data accuracy

**Expected Results:**
- [ ] Lab test list is visible
- [ ] At least 3 lab tests show
- [ ] Each test shows: name, value, unit, date
- [ ] Reference ranges display correctly
- [ ] Abnormal values are highlighted (if any)
- [ ] Values match sample data

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

## Chart Tests

### Test 7: Individual Lab Chart

**Objective:** Verify individual lab test chart renders

**Steps:**
1. Click on any lab test card
2. Wait for chart to render
3. Check chart elements
4. Interact with chart

**Expected Results:**
- [ ] Chart canvas/container is visible
- [ ] Data points are plotted
- [ ] X-axis shows dates
- [ ] Y-axis shows values
- [ ] Reference range line displays (if applicable)
- [ ] Tooltip appears on hover
- [ ] Chart is responsive (resize window)

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

**Screenshot Path:** `[Add screenshot path here]`

---

### Test 8: Chart Configuration Panel

**Objective:** Verify chart settings panel works

**Steps:**
1. Open a lab test chart
2. Click "Chart Settings" button (gear icon)
3. Try toggling options
4. Try changing colors
5. Click "Reset to defaults"

**Expected Results:**
- [ ] Settings panel opens
- [ ] Toggle options work:
  - [ ] Show trend line
  - [ ] Show confidence interval
  - [ ] Show predictions
  - [ ] Show reference range
- [ ] Color pickers work
- [ ] Reset button restores defaults
- [ ] Settings persist (check after refresh)

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

### Test 9: Comparison Chart

**Objective:** Verify multi-lab comparison works

**Steps:**
1. Navigate to comparison view
2. Select 2+ lab tests to compare
3. View comparison chart
4. Test normalization options

**Expected Results:**
- [ ] Comparison chart renders
- [ ] Multiple series display with different colors
- [ ] Legend shows all selected tests
- [ ] Normalization options work:
  - [ ] None
  - [ ] Percent
  - [ ] Z-score
- [ ] Correlation coefficient displays (if enabled)

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

**Screenshot Path:** `[Add screenshot path here]`

---

## Data Entry Tests

### Test 10: Add New Lab Result

**Objective:** Verify manual data entry works

**Steps:**
1. Click "Add Lab Result" button
2. Fill in form:
   - Lab test: Creatinine
   - Value: 1.15
   - Unit: mg/dL
   - Date: [today's date]
3. Click "Save"
4. Verify data appears in list

**Expected Results:**
- [ ] Form opens without errors
- [ ] All required fields are present
- [ ] Validation works:
  - [ ] Value is required
  - [ ] Date is required
  - [ ] Invalid values show error
- [ ] Save button works
- [ ] New result appears in list
- [ ] Chart updates with new data

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

### Test 11: Edit Existing Result

**Objective:** Verify editing works

**Steps:**
1. Click on existing lab result
2. Click "Edit" button
3. Change value
4. Save changes
5. Verify update

**Expected Results:**
- [ ] Edit form opens with current data
- [ ] All fields are editable
- [ ] Save updates the record
- [ ] Chart reflects the change
- [ ] History/log shows edit (if applicable)

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

### Test 12: Delete Result

**Objective:** Verify deletion works

**Steps:**
1. Click on a lab result
2. Click "Delete" button
3. Confirm deletion
4. Verify removal

**Expected Results:**
- [ ] Confirmation dialog appears
- [ ] Deletion can be cancelled
- [ ] After confirmation, result is removed
- [ ] Chart updates (point removed)
- [ ] Total count decreases

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

## PDF Tests

### Test 13: PDF Upload

**Objective:** Verify PDF upload works

**Steps:**
1. Click "Upload PDF" button
2. Select a PDF file from computer
3. Wait for upload
4. Check PDF appears in list

**Expected Results:**
- [ ] File picker dialog opens
- [ ] PDF files can be selected
- [ ] Upload progress indicator shows
- [ ] Success message displays
- [ ] PDF appears in PDF list
- [ ] File size and date show correctly

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

### Test 14: PDF Data Extraction

**Objective:** Verify AI extraction works (if enabled)

**Steps:**
1. Upload a medical lab PDF
2. Wait for processing
3. Check extraction results
4. Review extracted data

**Expected Results:**
- [ ] Processing status shows
- [ ] Processing completes (may take 30-60s)
- [ ] Extracted data displays
- [ ] Lab test names are recognized
- [ ] Values are extracted correctly
- [ ] Units are identified
- [ ] Can add extracted data to records

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail / ⏭️ Skipped (AI not enabled)

---

## Analytics Tests

### Test 15: Trend Analysis

**Objective:** Verify trend calculations work

**Steps:**
1. Select a lab test with 5+ data points
2. View analytics section
3. Check trend indicators
4. Verify calculations

**Expected Results:**
- [ ] Trend direction displays:
  - [ ] Improving (↓ for bad markers)
  - [ ] Worsening (↑ for bad markers)
  - [ ] Stable
- [ ] Rate of change shows
- [ ] Statistical significance displays (p-value)
- [ ] Confidence interval visible (if enabled)
- [ ] Trend line renders on chart

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

### Test 16: Correlation Analysis

**Objective:** Verify correlation calculations

**Steps:**
1. Select 2+ lab tests
2. View correlation section
3. Check correlation matrix
4. Verify values

**Expected Results:**
- [ ] Correlation matrix displays
- [ ] Values are between -1 and 1
- [ ] Significant correlations are highlighted
- [ ] Color coding works:
  - [ ] Red = positive correlation
  - [ ] Blue = negative correlation
  - [ ] White/gray = no correlation
- [ ] Correlation coefficient is accurate

**Manual Check:**
Pick 2 tests with obvious correlation (e.g., glucose and HbA1c)
- [ ] Correlation > 0.5

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

### Test 17: Anomaly Detection

**Objective:** Verify outlier detection works

**Steps:**
1. Select a lab test with variations
2. Check for anomalies
3. Review anomaly details
4. Verify detection accuracy

**Expected Results:**
- [ ] Anomalies are flagged
- [ ] Outlier points are highlighted on chart
- [ ] Anomaly details show:
  - [ ] Date
  - [ ] Value
  - [ ] Z-score
  - [ ] Reason (e.g., ">3 SD from mean")
- [ ] Can dismiss or acknowledge anomalies

**Test with Outlier:**
Add an obviously abnormal value (e.g., glucose = 500)
- [ ] Detected as anomaly
- [ ] Flagged immediately

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

### Test 18: Predictions

**Objective:** Verify predictive analytics

**Steps:**
1. Select lab test with 10+ data points
2. Enable predictions
3. Set prediction horizon
4. View forecast

**Expected Results:**
- [ ] Prediction line displays
- [ ] Different color from actual data
- [ ] Shows future dates
- [ ] Confidence interval shades around prediction
- [ ] Can adjust prediction periods
- [ ] Predictions seem reasonable (not extreme)

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

**Screenshot Path:** `[Add screenshot path here]`

---

## Export Tests

### Test 19: CSV Export

**Objective:** Verify CSV data export

**Steps:**
1. Click "Export" button
2. Select format: CSV
3. Choose date range (optional)
4. Click "Download"
5. Open downloaded file

**Expected Results:**
- [ ] Export dialog opens
- [ ] Can select date range
- [ ] Download starts immediately
- [ ] File downloads with name like `lab-data-YYYY-MM-DD.csv`
- [ ] CSV opens in Excel/Numbers
- [ ] Headers are correct
- [ ] Data is accurate
- [ ] Date format is readable

**Verify CSV Structure:**
```csv
Date,Lab Test,Value,Unit,Reference Range,Notes
2024-01-01,Creatinine,1.2,mg/dL,"0.7-1.3",
...
```

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

### Test 20: JSON Export

**Objective:** Verify JSON export

**Steps:**
1. Click "Export"
2. Select format: JSON
3. Download file
4. Open in text editor

**Expected Results:**
- [ ] JSON file downloads
- [ ] Valid JSON format
- [ ] Contains all lab data
- [ ] Includes metadata (export date, patient info)
- [ ] Can be imported back

**Verify JSON Structure:**
```json
{
  "exportDate": "2024-04-07T...",
  "patient": { ... },
  "labResults": [ ... ]
}
```

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

### Test 21: Chart Image Export

**Objective:** Verify chart can be saved as image

**Steps:**
1. Open a chart
2. Click "Download" button (camera icon)
3. Select format: PNG
4. Download image
5. Open image file

**Expected Results:**
- [ ] Image downloads
- [ ] File type is PNG
- [ ] Image resolution is good (not blurry)
- [ ] Entire chart is captured
- [ ] Colors are accurate
- [ ] Text is readable

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

**Screenshot Path:** `[Add screenshot path here]`

---

## Responsive Design Tests

### Test 22: Desktop View (1920x1080)

**Objective:** Verify layout on large screen

**Steps:**
1. Open browser DevTools (F12)
2. Enable device emulation
3. Set resolution: 1920x1080
4. Navigate through app

**Expected Results:**
- [ ] Layout fills screen appropriately
- [ ] No horizontal scrolling
- [ ] Charts are readable
- [ ] Text is not too small
- [ ] Buttons are easily clickable
- [ ] Sidebar/navigation works

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

**Screenshot:** `[Add screenshot]`

---

### Test 23: Tablet View (768x1024)

**Objective:** Verify layout on tablet

**Steps:**
1. Set resolution: 768x1024
2. Test all major features
3. Check touch targets

**Expected Results:**
- [ ] Layout adapts (single column)
- [ ] Charts scale correctly
- [ ] Navigation menu works
- [ ] Touch targets ≥ 44x44px
- [ ] No horizontal scrolling

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

**Screenshot:** `[Add screenshot]`

---

### Test 24: Mobile View (375x667)

**Objective:** Verify layout on mobile phone

**Steps:**
1. Set resolution: 375x667
2. Test critical user flows
3. Verify usability

**Expected Results:**
- [ ] Single column layout
- [ ] Charts stack vertically
- [ ] Hamburger menu works
- [ ] Data tables scroll horizontally
- [ ] Charts remain interactive
- [ ] Can add/edit data on mobile

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

**Screenshot:** `[Add screenshot]`

---

## Performance Tests

### Test 25: Page Load Time

**Objective:** Verify acceptable load performance

**Steps:**
1. Open DevTools Network tab
2. Clear cache
3. Reload page
4. Measure load time

**Expected Results:**
- [ ] Initial load < 5 seconds
- [ ] Time to Interactive < 8 seconds
- [ ] Largest Contentful Paint < 2.5s
- [ ] No layout shifts

**Actual Results:**
```
Load Time: ___ seconds
Time to Interactive: ___ seconds
FCP: ___ seconds
LCP: ___ seconds
```

**Status:** ⬜ Pass / ❌ Fail

---

### Test 26: Chart Rendering Performance

**Objective:** Verify charts render quickly

**Steps:**
1. Load a chart with 50+ data points
2. Measure render time
3. Check for lag

**Expected Results:**
- [ ] Chart renders < 2 seconds
- [ ] No frozen UI during render
- [ ] Smooth animations
- [ ] Zoom/pan is responsive (60fps)

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

## Browser Compatibility Tests

### Test 27: Chrome

**Steps:**
1. Open in Chrome (latest version)
2. Test all major features
3. Check console

**Expected Results:**
- [ ] All features work
- [ ] No console errors
- [ ] Layout is correct

**Status:** ⬜ Pass / ❌ Fail

**Chrome Version:** `___`

---

### Test 28: Firefox

**Steps:**
1. Open in Firefox (latest version)
2. Test all major features
3. Check console

**Expected Results:**
- [ ] All features work
- [ ] No console errors
- [ ] Layout is correct

**Status:** ⬜ Pass / ❌ Fail

**Firefox Version:** `___`

---

### Test 29: Safari

**Steps:**
1. Open in Safari (latest version)
2. Test all major features
3. Check console

**Expected Results:**
- [ ] All features work
- [ ] No console errors
- [ ] Layout is correct

**Status:** ⬜ Pass / ❌ Fail

**Safari Version:** `___`

---

## Security Tests

### Test 30: Input Validation

**Objective:** Verify proper input sanitization

**Steps:**
1. Try entering SQL injection in name field: `'; DROP TABLE users; --`
2. Try entering XSS in notes: `<script>alert('XSS')</script>`
3. Try entering negative numbers
4. Try entering extremely large numbers

**Expected Results:**
- [ ] Malicious input is rejected or sanitized
- [ ] No alerts appear
- [ ] Error messages are helpful
- [ ] Invalid values show validation error

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

## Accessibility Tests

### Test 31: Keyboard Navigation

**Objective:** Verify app works without mouse

**Steps:**
1. Unplug mouse (or don't use it)
2. Use Tab to navigate
3. Use Enter to activate buttons
4. Use Escape to close modals

**Expected Results:**
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] All interactive elements are reachable
- [ ] Enter activates buttons
- [ ] Escape closes modals/dialogs

**Status:** ⬜ Pass / ❌ Fail

---

### Test 32: Screen Reader Compatibility

**Objective:** Verify basic screen reader support

**Steps:**
1. Enable screen reader (VoiceOver/Narrator)
2. Navigate through app
3. Check element labels

**Expected Results:**
- [ ] Buttons have accessible names
- [ ] Form fields have labels
- [ ] Charts have text descriptions
- [ ] Errors are announced

**Status:** ⬜ Pass / ❌ Fail / ⏭️ Skipped

---

## Data Persistence Tests

### Test 33: Data Survives Refresh

**Objective:** Verify data isn't lost on refresh

**Steps:**
1. Add a new lab result
2. Refresh browser (F5)
3. Check if result persists

**Expected Results:**
- [ ] New result still appears
- [ ] No data lost
- [ ] Charts include new data

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

### Test 34: Data Survives Server Restart

**Objective:** Verify data persists in database

**Steps:**
1. Add new lab result
2. Stop server (Ctrl+C)
3. Restart server
4. Check browser

**Expected Results:**
- [ ] All data is present
- [ ] No corruption
- [ ] IDs remain consistent

**Actual Results:**
```
[Notes]

```

**Status:** ⬜ Pass / ❌ Fail

---

## Error Handling Tests

### Test 35: Network Error Recovery

**Objective:** Verify graceful handling of network issues

**Steps:**
1. Disconnect internet (or stop server)
2. Try to load data
3. Reconnect
4. Check if app recovers

**Expected Results:**
- [ ] Error message displays
- [ ] App doesn't crash
- [ ] Retry button works
- [ ] App recovers when connection restored

**Status:** ⬜ Pass / ❌ Fail

---

## Final Summary

### Test Results Overview

**Total Tests:** 35
**Passed:** __
**Failed:** __
**Skipped:** __
**Pass Rate:** ___%

### Critical Path Tests (Must Pass)

- [ ] Test 1: Server Startup
- [ ] Test 2: Client Startup
- [ ] Test 4: Homepage Loads
- [ ] Test 6: Lab Data Display
- [ ] Test 7: Individual Lab Chart
- [ ] Test 10: Add New Lab Result
- [ ] Test 19: CSV Export

**Critical Path Status:** ⬜ All Pass / ❌ Some Fail

### High Priority Tests

- [ ] Test 8: Chart Configuration Panel
- [ ] Test 11: Edit Existing Result
- [ ] Test 15: Trend Analysis
- [ ] Test 16: Correlation Analysis
- [ ] Test 22-24: Responsive Design

### Notes

```
[Additional notes, observations, suggestions]
```

### Bugs Found

List any bugs discovered during testing:

1. **[Bug Title]**
   - Severity: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
   - Description: [Description]
   - Steps to reproduce: [Steps]
   - Expected behavior: [Expected]
   - Actual behavior: [Actual]

2. **[Bug Title]**
   - Severity: ...
   - Description: ...

### Recommendations

```
[Any recommendations for improvements]
```

---

**Tester Name:** _________________
**Test Date:** _________________
**Browser(s) Used:** _________________
**Operating System:** _________________

**Signature:** _________________

---

**End of Checklist**
