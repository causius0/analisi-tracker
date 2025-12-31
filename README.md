# Lab Values Tracker

A dynamic React-based web application for visualizing and tracking laboratory test results over time.

## Features

### Data Visualization
- **Interactive Line Charts**: Each lab value is displayed on its own chart with temporal progression
- **Dashed Lines for Gaps**: When measurements are not taken, the chart shows dashed lines connecting available data points (without inferring or setting values to 0)
- **Healthy Range Indicators**: Visual representation of normal ranges with color-coded areas
- **Out-of-Range Highlighting**: Values outside the normal range are highlighted in red

### Dashboard Controls
- **Value Selection**: Choose which lab values to display from a comprehensive list
- **Search Functionality**: Quick search to find specific lab values
- **Select All/Clear All**: Bulk selection controls
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Data Details
- **Detailed Tooltips**: Hover over data points to see exact values, dates, and normal ranges
- **Value Cards**: Summary cards below each chart showing all measurements with color coding
- **Patient Information**: Display of patient demographics

## Data Structure

The application uses a JSON file (`lab-data.json`) with the following structure:

```json
{
  "patient": {
    "name": "CAUSIO CHIARA",
    "dateOfBirth": "2000-10-12",
    "gender": "FEMALE"
  },
  "labTests": [
    {
      "date": "2025-06-11",
      "source": "causio 1.pdf",
      "values": {
        "Creatininemia": {
          "value": 2.06,
          "unit": "mg/dL",
          "range": { "min": 0.5, "max": 0.8 }
        }
      }
    }
  ]
}
```

### Extracted Data Summary

The application has successfully extracted data from 7 PDF lab reports spanning from **February 2023 to December 2025**:

1. **causioVISt.pdf** (Feb 14, 2023)
2. **causioviss.pdf** (Nov 20, 2023)
3. **causio0.pdf** (Jan 29, 2024)
4. **causio 1.pdf** (Jun 11, 2025)
5. **causio relazione.pdf** (Oct 20, 2025 & Nov 13, 2025)
6. **causio2.pdf** (Dec 19, 2025)
7. **CAUSIOvis.pdf** (Dec 19, 2025)

**Total Lab Values Tracked**: 60+ unique parameters including:
- Renal function markers (Creatininemia, Azotemia, eGFR, Clearance Creatinina)
- Complete blood count (Emoglobina, Leucociti, Piastrine, etc.)
- Electrolytes (Sodio, Potassio, Calcio, Fosforo)
- Lipid panel (Colesterolo totale, HDL, LDL, Trigliceridi)
- Liver function (AST, ALT, GGT, Bilirubina)
- Metabolic markers (Glucosio, Urato, Proteine totali, Albumina)
- Specialized markers (i-PTH, vitamina D, Tacrolemia)

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. Navigate to the project directory:
```bash
cd ~/lab-values-tracker/lab-tracker
```

2. Install dependencies (already done):
```bash
npm install
```

3. The lab data is already in place at `public/lab-data.json`

## Running the Application

### Development Mode
```bash
npm run dev
```

The application will be available at:
- Local: http://localhost:3000
- Network: http://10.0.0.146:3000

### Production Build
```bash
npm run build
npm start
```

## Usage Guide

### Selecting Lab Values
1. Click "Show Selector" to expand the value selection panel
2. Use the search bar to filter lab values by name
3. Click checkboxes to select/deselect individual values
4. Use "Select All" to show all available values
5. Use "Clear All" to hide all charts

### Reading the Charts
- **Blue solid line**: Actual measured values
- **Gray dashed line**: Connection between measurements when no data is available (gap periods)
- **Green shaded area**: Normal/healthy range for the value
- **Green dashed lines**: Upper and lower bounds of normal range
- **Blue dots**: Values within normal range
- **Red dots**: Values outside normal range

### Understanding Data Points
- Click on any point on the chart to see detailed information in a tooltip
- Below each chart, cards show all measurements with color coding:
  - **Green**: Within normal range
  - **Red**: Outside normal range
  - **Gray**: Not measured

## Technical Stack

- **Framework**: Next.js 16 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Date Handling**: date-fns

## Project Structure

```
lab-tracker/
├── app/
│   ├── page.tsx           # Main page component
│   └── layout.tsx         # Root layout
├── components/
│   ├── LabDashboard.tsx   # Main dashboard component
│   ├── LabChart.tsx       # Individual chart component
│   └── ValueSelector.tsx  # Value selection interface
├── public/
│   └── lab-data.json      # Lab test data
└── package.json
```

## Features in Detail

### 1. Temporal Visualization with Gaps
The application intelligently handles missing data:
- Does NOT interpolate or infer values
- Does NOT set missing values to 0
- DOES show dashed lines to indicate temporal gaps between measurements
- Maintains accurate representation of when tests were actually performed

### 2. Healthy Range Visualization
Each lab value displays its specific normal range:
- Visual shaded area on the chart
- Reference lines for min/max bounds
- Color-coded data points (blue = normal, red = abnormal)
- Detailed range information in tooltips

### 3. Interactive Dashboard
- Real-time chart updates based on selection
- Responsive design for all screen sizes
- Search and filter capabilities
- Bulk selection controls

## Data Privacy
This application runs entirely in the browser. No data is sent to external servers. All processing happens client-side.

## Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Modern mobile browsers

## Future Enhancements
Potential features for future versions:
- Export charts as PNG/PDF
- Add notes to specific measurements
- Compare multiple lab values on the same chart
- Statistical analysis (trends, moving averages)
- Import new lab reports
- Multi-patient support

## Troubleshooting

### Charts not displaying
- Check browser console for errors
- Ensure `lab-data.json` is in the `public` folder
- Verify the data format matches the expected structure

### Performance issues
- Try selecting fewer values at once
- Close other browser tabs
- Use a modern browser

## License
Private use only

## Credits
Built with Claude Code
