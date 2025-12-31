# New Features - Lab Values Tracker

## 🎉 What's New

The Lab Values Tracker now includes two major new features:
1. **Multi-Value Comparison Charts** - Compare multiple lab values on the same graph
2. **Add New Data** - Manually enter values or upload PDF reports

---

## 📈 Feature 1: Multi-Value Comparison Charts

### What It Does
View multiple lab values on the same chart to identify correlations and trends between different parameters.

### How to Use

1. **Switch to Comparison Mode**
   - Click the "📈 Comparison Chart" button
   - The interface switches to comparison mode

2. **Select Values to Compare**
   - Use the value selector to choose 2 or more lab values
   - Each value gets a different color
   - Values appear together on one chart

3. **Read the Comparison Chart**
   - Different colored lines represent different values
   - Hover over any point to see all values at that date
   - Legend shows which color corresponds to which value
   - Click the × next to a value name to remove it from comparison

### Best Practices
- ✅ **Compare values with similar scales** (e.g., Creatininemia and Urea)
- ✅ **Look for correlations** between related values
- ⚠️ **Be cautious** comparing values with very different units or ranges
- 💡 The chart shows a warning when comparing values with different units

### Example Use Cases
- **Kidney Function**: Compare Creatinina, eGFR, and Urea together
- **Electrolytes**: View Sodio, Potassio, and Calcio on one chart
- **Lipid Panel**: Compare Colesterolo totale, LDL, and HDL
- **Blood Counts**: View Emoglobina, Leucociti, and Piastrine together

---

## ➕ Feature 2: Add New Lab Values

### Two Ways to Add Data

#### Method 1: Manual Entry (Recommended)

**What It Does:**
Add individual lab values one at a time with precise control.

**How to Use:**

1. **Open the Form**
   - Click "+ Add New Lab Value Manually" button
   - A form appears

2. **Fill in the Details**
   - **Date**: Select when the test was performed
   - **Lab Value Name**: Search and select from existing values
   - **Value**: Enter the measured number

3. **Submit**
   - Click "Add Value"
   - The chart updates immediately
   - Data is saved automatically

**Features:**
- ✅ Auto-fills unit and normal range from existing data
- ✅ Add multiple values for the same date
- ✅ Search functionality to find specific values quickly
- ✅ Data persists across browser sessions (localStorage)
- ✅ Charts update in real-time

**Example:**
```
Date: 2025-12-31
Lab Value: Creatinina
Value: 1.95

Result: New data point appears on Creatinina chart
```

#### Method 2: PDF Upload

**What It Does:**
Upload lab report PDFs for reference and manual extraction.

**How to Use:**

1. **Upload the PDF**
   - Click "📄 Upload Lab Report PDF"
   - Drag & drop or browse for your PDF file
   - PDF is accepted and stored

2. **Manual Entry Required**
   - Currently, you'll need to manually enter values from the PDF
   - Use the manual entry form (Method 1 above)
   - Reference your uploaded PDF while entering

**Current Status:**
- ✅ PDF upload and storage
- 📋 Manual extraction required
- 🚧 Automatic extraction: Planned for future update

---

## 💾 Data Persistence

### How It Works

**Automatic Saving:**
- All manually added data is automatically saved to browser localStorage
- No server needed - everything stays on your computer
- Data persists even after closing the browser

**Data Storage:**
- Original PDF data: Read-only from JSON file
- Manual entries: Stored in localStorage
- Combined view: Both sources merged automatically

**Data Safety:**
- ✅ Your original data is never modified
- ✅ Manual entries are separate and can be cleared
- ✅ All data stays local (privacy preserved)

### Managing Your Data

**To Add Data:**
- Use manual entry form or upload PDFs
- Data appears immediately in charts

**To View Data Sources:**
- Manual entries show "Manual Entry" as source
- Look for "Manually added" note in value details

**To Clear Custom Data:**
- Open browser developer console (F12)
- Type: `localStorage.clear()`
- Refresh the page

---

## 🎨 User Interface Updates

### View Mode Toggle
```
┌─────────────────────────────────────┐
│  📊 Individual Charts │ 📈 Comparison Chart  │
└─────────────────────────────────────┘
```

- Blue button = active mode
- Gray button = inactive mode
- Switch anytime without losing selections

### Data Entry Section
- Located at the top for easy access
- Collapsible to save screen space
- Color-coded buttons (Green = Add, Purple = Upload)

### Comparison Features
- Color-coded value labels
- Remove buttons (×) for each value
- Warning message for different units
- Legend with full value names

---

## 📊 Complete Feature List

### Comparison Mode
✅ Multiple values on one chart
✅ Color-coded lines (8 distinct colors)
✅ Interactive legend
✅ Individual value removal
✅ Unit warnings
✅ Shared tooltips showing all values

### Manual Entry
✅ Date picker
✅ Searchable value dropdown
✅ Numeric input validation
✅ Auto-fill units and ranges
✅ Instant chart updates
✅ Success confirmations
✅ Form validation

### PDF Upload
✅ Drag & drop interface
✅ File type validation
✅ Visual feedback
✅ Instructions and tips
✅ Future-ready for auto-extraction

### Data Management
✅ localStorage persistence
✅ Automatic merging with original data
✅ Date-based sorting
✅ Multiple values per date
✅ Source tracking

---

## 🚀 Quick Start Examples

### Example 1: Compare Kidney Function Markers
```
1. Click "📈 Comparison Chart"
2. Select: Creatinina, eGFR, Urea
3. View trends together
4. Look for correlations
```

### Example 2: Add Today's Lab Results
```
1. Click "+ Add New Lab Value Manually"
2. Select today's date
3. Choose "Creatinina"
4. Enter value: 2.15
5. Click "Add Value"
6. Chart updates with new point
```

### Example 3: Track Multiple Values from One Visit
```
1. Add Creatinina for 2025-12-31
2. Add Emoglobina for same date
3. Add Potassio for same date
4. All three charts show new data point
```

---

## 💡 Tips & Best Practices

### For Comparisons
1. **Start with 2-3 values** - easier to read
2. **Use related values** - kidney function, electrolytes, etc.
3. **Check units** - similar ranges work best
4. **Look for patterns** - rising/falling together?

### For Manual Entry
1. **Double-check values** - typos can't be easily undone
2. **Use correct units** - they're auto-detected from existing data
3. **Enter date carefully** - format: YYYY-MM-DD
4. **Add notes mentally** - manually added values are marked

### For Data Management
1. **Regular backups** - screenshot or export your charts
2. **Test first** - try adding one value before bulk entry
3. **Check charts** - verify new data appears correctly
4. **Clear carefully** - localStorage.clear() removes all custom data

---

## 🔮 Future Enhancements

Planned features for future updates:

### Automatic PDF Extraction
- AI-powered value detection
- Automatic form filling
- Bulk import from multiple PDFs
- OCR for scanned documents

### Enhanced Comparison
- Dual Y-axis for different scales
- Percentage change calculations
- Trend lines and regression
- Statistical correlations

### Data Export
- Export charts as PNG/PDF
- Download data as CSV
- Print-friendly reports
- Share via email

### Advanced Features
- Custom value ranges
- Medication tracking
- Appointment reminders
- Multi-patient support

---

## 🐛 Troubleshooting

### "Could not find reference data for this value"
**Problem:** Trying to add a value that doesn't exist in original data
**Solution:** Only add values that appear in at least one existing test

### Chart doesn't update after adding data
**Problem:** Browser cache issue
**Solution:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Lost custom data after browser update
**Problem:** localStorage was cleared
**Solution:** Custom data is stored locally only - keep backups

### Comparison chart looks messy
**Problem:** Too many values or very different scales
**Solution:** Limit to 3-4 values, use similar ranges

---

## 📞 Support

**Need Help?**
- Check the main README.md for general usage
- Review QUICK_START.md for basic operations
- Open browser console (F12) to see detailed errors

**Report Issues:**
- Document what you were doing
- Include error messages if any
- Note which browser you're using

---

**Version:** 2.0
**Last Updated:** December 31, 2025
**Status:** ✅ All features tested and working
