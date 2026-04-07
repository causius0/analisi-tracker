# Analisi Tracker - Quick Start Guide

Get your medical lab test analytics running in 3 simple steps!

## 🚀 3-Step Quick Start

### Step 1: Run Setup (One-Time)

**Mac/Linux:**
```bash
./setup.sh
```

**Windows:**
```batch
setup.bat
```

**What this does:**
- ✓ Checks Node.js installation (requires 18+)
- ✓ Creates `.env` configuration file
- ✓ Installs all dependencies
- ✓ Sets up necessary directories
- ✓ Initializes sample lab data

### Step 2: Start the App

**Mac/Linux:**
```bash
./start.sh
```

**Windows:**
```batch
start.bat
```

**What this does:**
- ✓ Verifies setup is complete
- ✓ Checks port availability
- ✓ Starts development server
- ✓ Opens browser automatically
- ✓ Shows live server logs

### Step 3: Use the App

Your browser will open to: **http://localhost:3000**

That's it! You're ready to:
- 📊 Track lab test trends
- 🔍 Detect anomalies
- 📈 View predictions
- 🧪 Analyze correlations
- 💬 Get AI insights (optional)

---

## 🎯 What's Included

The setup comes with **everything working out of the box**:

- ✅ Sample lab data (creatinine, glucose, eGFR, ALT, HbA1c)
- ✅ Trend analysis algorithms
- ✅ Correlation detection
- ✅ Anomaly detection
- ✅ Predictive analytics
- ✅ Statistical analysis
- ✅ Data visualization
- ✅ Export functionality

### Optional Features (No API Key Required)

These features work gracefully without API keys:

- 🤖 **AI Chat** - Get insights about your lab results (offline mode available)
- 📄 **PDF Processing** - Extract lab data from PDFs (manual entry fallback)
- 💊 **Medication Analysis** - Track medications vs lab results
- 📝 **Smart Summaries** - AI-powered lab result summaries

---

## 🔧 Configuration

### Environment Variables

The `.env` file is created automatically with sensible defaults:

```bash
# Basic configuration
PORT=3000                    # Server port
NODE_ENV=development         # Environment

# Analytics settings
MIN_DATA_POINTS=5            # Minimum data points for analysis
TREND_SIGNIFICANCE_LEVEL=0.05  # Statistical significance
ANOMALY_Z_SCORE_THRESHOLD=3  # Anomaly detection threshold

# AI Features (all optional!)
LLM_PROVIDER=gemini          # AI provider
ENABLE_AI_CHAT=true          # Enable chat feature
ENABLE_AI_SUMMARIES=true     # Enable AI summaries
# Add API keys below if you want AI features
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

**All features work offline** - API keys are optional!

---

## 📊 Sample Data

The setup includes sample lab data for testing:

**Lab Tests Included:**
- Creatinine (kidney function)
- Glucose (blood sugar)
- eGFR (filtration rate)
- ALT (liver enzyme)
- HbA1c (diabetes marker)

**Medications:**
- Metformin (diabetes)
- Lisinopril (blood pressure)

**Events:**
- Dietary changes
- Exercise program

You can:
- View trends for each test
- See correlations between tests
- Detect anomalies
- View predictions
- Export your data

---

## 🛠️ Troubleshooting

### Port 3000 Already in Use

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Windows:**
```batch
netstat -ano | findstr :3000
taskkill /F /PID [PID]
```

Or change the port in `.env`:
```bash
PORT=3001
```

### Node.js Not Found

Install Node.js from: https://nodejs.org/
- Download the LTS version (18.x or higher)
- Run the installer
- Restart your terminal

### Dependencies Issues

If you see dependency errors:

**Mac/Linux:**
```bash
rm -rf node_modules client/node_modules
./setup.sh
```

**Windows:**
```batch
rmdir /s /q node_modules client\node_modules
setup.bat
```

### Server Won't Start

1. Check if port 3000 is available
2. Check the log file: `/tmp/analisi-tracker.log` (Mac/Linux)
3. Try running setup again: `./setup.sh`
4. Check Node.js version: `node -v` (should be 18+)

### Browser Won't Open

Manually open your browser and navigate to:
```
http://localhost:3000
```

---

## 📱 Adding Your Own Data

### Option 1: Use the UI

1. Open the app in your browser
2. Click "Add Lab Result"
3. Enter your lab test data
4. Save

### Option 2: Import from JSON

Create a JSON file with your data:

```json
{
  "labTests": {
    "test-name": {
      "name": "Test Display Name",
      "unit": "mg/dL",
      "referenceRange": {
        "lower": 0.7,
        "upper": 1.3
      },
      "data": [
        { "timestamp": "2024-01-01T00:00:00Z", "value": 1.2 }
      ]
    }
  }
}
```

Then import it through the app UI.

### Option 3: Process PDFs

If you have lab test PDFs:

1. Place PDFs in the `data/pdfs` directory
2. Add a Gemini API key to `.env` (free at https://makersuite.google.com/app/apikey)
3. Run: `npm run process:pdfs`
4. Data will be extracted automatically

---

## 🤖 Optional: Enable AI Features

While the app works perfectly without AI, you can enable these features:

### Get Free API Keys

**Google Gemini** (Recommended - Free tier available):
1. Go to: https://makersuite.google.com/app/apikey
2. Create a free API key
3. Add to `.env`: `GEMINI_API_KEY=your-key-here`

**OpenAI**:
1. Go to: https://platform.openai.com/api-keys
2. Create an account and API key
3. Add to `.env`: `OPENAI_API_KEY=your-key-here`

**Anthropic Claude**:
1. Go to: https://console.anthropic.com/
2. Create an account and API key
3. Add to `.env`: `ANTHROPIC_API_KEY=your-key-here`

### AI Features You Get

- 💬 **AI Chat** - Ask questions about your lab results
- 📄 **PDF Extraction** - Auto-extract data from lab PDFs
- 📝 **Smart Summaries** - Get AI-generated summaries
- 💊 **Medication Analysis** - Correlate meds with lab results

---

## 📚 Next Steps

- **Read the full docs:** Check `docs/` for detailed guides
- **View examples:** Look at `data/sample-data.json`
- **Customize:** Edit `.env` for your preferences
- **Import data:** Add your own lab results

---

## 🆘 Need Help?

### Common Issues

1. **"Cannot find module"**
   - Run `./setup.sh` again
   - Make sure you're in the project root

2. **"Port already in use"**
   - Kill the process using port 3000
   - Or change `PORT=3001` in `.env`

3. **"Server won't start"**
   - Check Node.js version: `node -v` (need 18+)
   - Check log file: `/tmp/analisi-tracker.log`
   - Try running setup again

### Getting Support

- Check the documentation in `docs/`
- Review `README.md` for full features
- Look at `TESTING_GUIDE.md` for testing help

---

## 🎉 You're All Set!

Your medical lab test analytics platform is now running!

**URL:** http://localhost:3000

**Stop the server:** Press `Ctrl+C` in the terminal

**Start again:** Just run `./start.sh` (or `start.bat` on Windows)

---

## 📝 Notes

- All data is stored locally on your machine
- No internet connection required (except for optional AI features)
- Your data never leaves your computer
- Everything works offline
- API keys are completely optional

Enjoy tracking your health! 🏥📊
