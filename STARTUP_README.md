# 🚀 Analisi Tracker - Foolproof Startup Process

## Simple 2-Command Setup

### Mac/Linux:
```bash
./setup.sh && ./start.sh
```

### Windows:
```batch
setup.bat && start.bat
```

**That's it!** Your app will be running at **http://localhost:3000**

---

## ✅ What's Included

### Files Created:

1. **Setup Scripts:**
   - `setup.sh` - Mac/Linux one-time setup
   - `setup.bat` - Windows one-time setup

2. **Start Scripts:**
   - `start.sh` - Mac/Linux startup
   - `start.bat` - Windows startup

3. **Configuration:**
   - `.env.local` - Pre-configured environment file
   - All features work offline - no API keys required!

4. **Documentation:**
   - `QUICKSTART.md` - 3-step quick start guide
   - `STARTUP_GUIDE.md` - Detailed startup guide
   - `STARTUP_README.md` - This file

5. **Data:**
   - `data/lab-data-initial.json` - Chiara & Causio sample data
   - Auto-created `data/lab-data.json` during setup

---

## 📊 Sample Data Included

### Patient 1: Chiara
- **3 creatinine** readings (all normal)
- **3 glucose** readings (all normal)
- **3 eGFR** readings (all normal)
- Perfect healthy baseline

### Patient 2: Causio
- **4 creatinine** readings (improving trend)
- **4 glucose** readings (high → normal)
- **4 eGFR** readings (low → normal)
- **2 HbA1c** readings (elevated but improving)
- **2 medications** (Metformin, Lisinopril)
- **2 lifestyle events** (diet, exercise)
- Shows real improvement over time!

**Great for testing:**
- Trend analysis
- Anomaly detection
- Correlation analysis
- Predictive analytics
- Medication tracking

---

## 🔧 Setup Process

### Step 1: Setup Script (One-Time)

**What it does:**
- ✅ Checks Node.js installation (18+)
- ✅ Checks npm installation
- ✅ Creates `.env` from `.env.local`
- ✅ Creates required directories
- ✅ Installs root dependencies
- ✅ Installs client dependencies
- ✅ Creates `data/lab-data.json` with sample patients
- ✅ Validates JSON structure

**Time:** ~2-5 minutes (first run only)

### Step 2: Start Script (Every Time)

**What it does:**
- ✅ Verifies setup is complete
- ✅ Checks all dependencies installed
- ✅ Checks port 3000 availability
- ✅ Starts development server
- ✅ Opens browser automatically
- ✅ Shows live server logs

**Time:** ~10-15 seconds

---

## 🎯 Key Features

### Out of the Box (No Setup Required):
- ✅ Trend analysis (direction, rate of change, significance)
- ✅ Correlation detection (Pearson, Spearman, time-lagged)
- ✅ Anomaly detection (z-score, rate-of-change)
- ✅ Predictive analytics (ARIMA, linear regression)
- ✅ Statistical analysis (descriptive stats, distributions)
- ✅ Data visualization (charts, graphs)
- ✅ Export functionality (CSV, JSON, PDF)
- ✅ Multi-patient support
- ✅ Medication tracking
- ✅ Event logging

### Optional Features (API Key Required):
- 🤖 AI chat about lab results
- 📄 PDF processing & extraction
- 📝 AI-generated summaries
- 💊 Medication analysis

**All features work offline** - API keys are optional!

---

## 📁 Project Structure

```
analisi-tracker/
├── setup.sh              # Mac/Linux setup
├── setup.bat             # Windows setup
├── start.sh              # Mac/Linux start
├── start.bat             # Windows start
├── .env.local            # Master config (edit this!)
├── .env                  # Auto-created from .env.local
│
├── QUICKSTART.md         # 3-step guide
├── STARTUP_GUIDE.md      # Detailed guide
├── STARTUP_README.md     # This file
│
├── client/               # React frontend
│   ├── src/              # Source code
│   └── package.json      # Client deps
│
├── server/               # Express backend
│   ├── index-new.js      # Main server
│   ├── analytics/        # Analytics engine
│   └── api/              # API endpoints
│
├── data/                 # Data directory
│   ├── lab-data-initial.json  # Chiara & Causio
│   ├── lab-data.json     # Main data (auto-created)
│   └── processed/        # For PDFs
│
├── scripts/              # Utility scripts
│   └── validate-data.js  # Data validation
│
└── logs/                 # Log files
```

---

## 🛠️ Configuration

### .env.local (Master Configuration)

Pre-configured with sensible defaults:

```bash
# Basic
PORT=3000                    # Server port
NODE_ENV=development         # Environment

# Analytics
MIN_DATA_POINTS=5            # Minimum for analysis
TREND_SIGNIFICANCE_LEVEL=0.05  # Statistical threshold
ANOMALY_Z_SCORE_THRESHOLD=3  # Anomaly detection

# AI (Optional!)
ENABLE_AI_CHAT=true          # Enable chat
ENABLE_AI_SUMMARIES=true     # Enable summaries
# Add keys below if you want AI:
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

**All features work without API keys!**

---

## 🆘 Troubleshooting

### "Command not found"
```bash
# Mac/Linux: Make scripts executable
chmod +x setup.sh start.sh
```

### "Node.js not found"
1. Download from https://nodejs.org/
2. Install LTS version (18+)
3. Restart terminal
4. Verify: `node -v`

### "Port 3000 already in use"
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /F /PID [PID]
```

### "Server won't start"
1. Check logs: `/tmp/analisi-tracker.log`
2. Run setup again: `./setup.sh`
3. Check Node.js version: `node -v`
4. Verify `.env` exists

### "Browser won't open"
Manually navigate to: **http://localhost:3000**

---

## 📚 Documentation

**Quick Start:**
- `QUICKSTART.md` - 3-step guide

**Detailed Guides:**
- `STARTUP_GUIDE.md` - Complete startup documentation
- `STARTUP_README.md` - This file

**Full Documentation:**
- `README.md` - Feature overview
- `docs/` - Detailed feature guides
- `API_DOCUMENTATION.md` - API reference

**Testing:**
- `TESTING_GUIDE.md` - How to test
- `scripts/validate-data.js` - Validate data

---

## 🎉 Success Indicators

### ✅ Setup Successful:
```
✓ Setup Complete!
Next steps:
  1. Review .env file (optional)
  2. Add API keys if you want AI features (optional)
  3. Run: ./start.sh
Your app will be available at: http://localhost:3000
```

### ✅ Server Running:
```
✓ Development server started
✓ Server is ready!
Opening browser...

✅ Analisi Tracker is running!
App URL: http://localhost:3000
Press Ctrl+C to stop the server
```

---

## 🔄 Common Workflows

### First Time Setup:
```bash
./setup.sh && ./start.sh
```

### Subsequent Starts:
```bash
./start.sh
```

### After Dependency Changes:
```bash
./setup.sh  # Reinstall dependencies
./start.sh  # Start server
```

### Add API Keys:
```bash
# Edit .env
nano .env
# Add your keys
# Start server
./start.sh
```

### Validate Data:
```bash
node scripts/validate-data.js
```

---

## 🔒 Privacy & Security

- ✅ **100% local** - Data never leaves your machine
- ✅ **Works offline** - No internet required
- ✅ **No tracking** - Zero telemetry or analytics
- ✅ **Open source** - Fully transparent code
- ✅ **API keys optional** - All features work without them

---

## 📝 Summary

**2 commands to start:**
```bash
./setup.sh && ./start.sh  # Mac/Linux
setup.bat && start.bat     # Windows
```

**What you get:**
- ✅ Full analytics platform
- ✅ 2 sample patients with real data
- ✅ All features working offline
- ✅ Browser opens automatically
- ✅ Live server logs
- ✅ Foolproof setup

**Time to first run:** 5 minutes
**Time to restart:** 15 seconds

**URL:** http://localhost:3000

**Stop:** Press `Ctrl+C`

**Start again:** `./start.sh`

---

## 🎯 Next Steps

1. **Explore the app** - Switch between Chiara and Causio patients
2. **View analytics** - Check trends, correlations, anomalies
3. **Add your data** - Import your own lab results
4. **Enable AI** (optional) - Add API keys for AI features
5. **Read docs** - Check `docs/` for detailed guides

Enjoy tracking your health! 🏥📊
