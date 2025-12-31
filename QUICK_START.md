# Quick Start Guide - Lab Values Tracker

## What You Have

A fully functional web application that visualizes lab test results from 7 PDF reports with:
- **60+ lab parameters** tracked over time
- **Interactive charts** with temporal visualization
- **Dashed lines** for measurement gaps (not interpolated)
- **Healthy range indicators** for each value
- **Color-coded alerts** for out-of-range values

## How to Use

### 1. Open the Application

The application is currently running at:
```
http://localhost:3000
```

Open this URL in your web browser.

### 2. View Patient Information

At the top, you'll see:
- Patient name: CAUSIO CHIARA
- Date of birth: 12/10/2000
- Gender: FEMALE

### 3. Select Lab Values to Display

Click **"Show Selector"** to see all available lab values:
- Use the **search bar** to find specific values (e.g., "Creatinina", "Emoglobina")
- **Check/uncheck** boxes to show/hide specific values
- Use **"Select All"** to display everything
- Use **"Clear All"** to start fresh

### 4. Read the Charts

Each chart shows:

**Lines:**
- 🔵 **Blue solid line** = Actual measurements
- ⚪ **Gray dashed line** = Gap between measurements (no data)

**Shaded Areas:**
- 🟢 **Green area** = Normal/healthy range
- 🟢 **Green dashed lines** = Upper and lower limits of normal range

**Data Points:**
- 🔵 **Blue dots** = Values within normal range
- 🔴 **Red dots** = Values outside normal range (ALERT!)

### 5. See Details

**Hover over any point** on the chart to see:
- Exact date
- Measured value with unit
- Normal range
- Any notes

**Scroll below each chart** to see:
- Summary cards for all measurements
- Color-coded by status (green = normal, red = abnormal, gray = not measured)

## Key Features

### Temporal Gaps (Dashed Lines)
When a lab value wasn't measured at a particular date:
- ✅ Shows dashed line connecting previous and next measurements
- ✅ Preserves accurate timeline
- ❌ Does NOT infer or guess values
- ❌ Does NOT set missing values to 0

### Example Chart Interpretation

If you see:
```
Jan 2024: Creatinina = 1.0 mg/dL (blue dot, normal)
         [gray dashed line]
Jun 2025: Creatinina = 2.06 mg/dL (red dot, HIGH)
```

This means:
- January measurement was normal
- No measurements between Jan and Jun
- June measurement is elevated (outside normal range)

## Data Coverage

Your data spans **February 2023 to December 2025** with measurements from:
1. Feb 14, 2023
2. Nov 20, 2023
3. Jan 29, 2024
4. Jun 11, 2025
5. Oct 20, 2025
6. Nov 13, 2025
7. Dec 19, 2025

## Most Important Values to Monitor

Based on the data, key values for kidney transplant monitoring:

1. **Creatininemia** - Kidney function marker
2. **eGFR** - Glomerular filtration rate
3. **Proteinuria 24h** - Protein in urine
4. **Tacrolemia** - Immunosuppressant level
5. **Emoglobina** - Anemia monitoring
6. **Calcemia** - Calcium levels
7. **Fosforemia** - Phosphorus levels
8. **i-PTH** - Parathyroid hormone

## Tips for Best Experience

1. **Start with key values**: Select 3-4 important values first
2. **Use search**: Type "Creat" to find all creatinine-related values
3. **Look for trends**: Red dots show when values were out of range
4. **Check tooltips**: Hover for exact measurements and ranges
5. **Desktop recommended**: Better visualization on larger screens

## Stopping the Application

When you're done:
```bash
# Press Ctrl+C in the terminal where the app is running
# Or close the terminal window
```

## Restarting Later

To run the application again:
```bash
cd ~/lab-values-tracker/lab-tracker
npm run dev
```

Then open http://localhost:3000 in your browser.

## Need Help?

Check the full README.md for:
- Technical details
- Troubleshooting
- Feature descriptions
- Data structure documentation

---

**Remember**: This application runs locally on your computer. No data is sent to external servers.
