# Analisi Tracker - Startup Guide

## 🚀 Simple Startup Process

The analisi-tracker application now has a **foolproof startup process** that works in just 2 commands!

### Quick Start (2 Commands)

**Mac/Linux:**
```bash
./setup.sh && ./start.sh
```

**Windows:**
```batch
setup.bat && start.bat
```

That's it! The app will:
- ✓ Check Node.js installation
- ✓ Install all dependencies
- ✓ Create configuration files
- ✓ Initialize sample data (Chiara and Causio patients)
- ✓ Start the development server
- ✓ Open your browser automatically

Your app will be running at: **http://localhost:3000**

---

## 📋 What the Setup Does

### 1. Setup Script (`setup.sh` / `setup.bat`)

**Checks:**
- Node.js version (18+ recommended)
- npm installation
- Existing installations

**Creates:**
- `.env` file with sensible defaults
- Required directories (`data/processed`, `logs`, `exports`)
- Sample lab data file with Chiara and Causio patients

**Installs:**
- Root dependencies (server)
- Client dependencies (React app)

**Validates:**
- JSON data structure
- Configuration files

### 2. Start Script (`start.sh` / `start.bat`)

**Verifies:**
- Setup has been run
- All dependencies installed
- Port 3000 is available

**Starts:**
- Development server (both client and server)
- Live reloading
- Log monitoring

**Opens:**
- Browser to http://localhost:3000
- Real-time server logs in terminal

---

## 📊 Sample Data Included

The setup includes **2 patients** with real lab data:

### Patient 1: Chiara (Female, DOB: 1995-05-15)

**Lab Tests:**
- Creatinine (3 readings) - All normal
- Glucose (3 readings) - All normal
- eGFR (3 readings) - All normal

**Status:** Healthy baseline data

### Patient 2: Causio (Male, DOB: 1990-01-01)

**Lab Tests:**
- Creatinine (4 readings) - Improving trend
- Glucose (4 readings) - Initially high, now normal
- eGFR (4 readings) - Initially low, now normal
- HbA1c (2 readings) - Elevated but improving

**Medications:**
- Metformin (started Feb 2024)
- Lisinopril (started Feb 2024)

**Events:**
- Dietary changes (Feb 2024)
- Exercise program (Mar 2024)

**Status:** Shows improvement over time (great for testing analytics!)

---

## 🔧 Configuration Files

### `.env.local` (Master Configuration)

Pre-configured with sensible defaults:

```bash
# Server
PORT=3000
NODE_ENV=development

# Analytics
MIN_DATA_POINTS=5
ANOMALY_Z_SCORE_THRESHOLD=3

# AI Features (all optional!)
ENABLE_AI_CHAT=true
ENABLE_AI_SUMMARIES=true
# Add API keys if you want AI features
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

**Key Features:**
- ✓ All features work offline
- ✓ API keys are optional
- ✓ Sensible defaults for everything
- ✓ Clear comments explaining each variable

---

## 🛠️ Troubleshooting

### Problem: "Command not found"

**Mac/Linux:**
```bash
# Make scripts executable
chmod +x setup.sh start.sh

# Then run
./setup.sh
```

**Windows:**
- Make sure you're in Command Prompt or PowerShell
- Right-click on `setup.bat` and select "Run as administrator" if needed

### Problem: "Node.js not found"

**Solution:**
1. Download Node.js from https://nodejs.org/
2. Install the LTS version (18.x or higher)
3. Restart your terminal
4. Run `node -v` to verify installation

### Problem: Port 3000 already in use

**Mac/Linux:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
# Edit .env and change PORT=3001
```

**Windows:**
```batch
REM Find and kill process
netstat -ano | findstr :3000
taskkill /F /PID [PID]
```

### Problem: Server won't start

**Check logs:**
```bash
# View error logs
cat /tmp/analisi-tracker.log
```

**Common fixes:**
1. Run setup again: `./setup.sh`
2. Clear node_modules and reinstall
3. Check Node.js version: `node -v` (need 18+)
4. Check port availability

### Problem: Browser won't open

**Solution:**
Manually open your browser and navigate to:
```
http://localhost:3000
```

---

## 📁 Project Structure

```
analisi-tracker/
├── setup.sh              # Mac/Linux setup script
├── setup.bat             # Windows setup script
├── start.sh              # Mac/Linux start script
├── start.bat             # Windows start script
├── .env.local            # Master configuration file
├── .env                  # Created by setup (from .env.local)
├── QUICKSTART.md         # Quick start guide
├── STARTUP_GUIDE.md      # This file
│
├── client/               # React frontend
│   ├── src/
│   └── package.json
│
├── server/               # Express backend
│   ├── index-new.js      # Main server file
│   ├── analytics/        # Analytics engine
│   └── api/              # API endpoints
│
├── data/                 # Data directory
│   ├── lab-data-initial.json  # Chiara & Causio sample data
│   ├── lab-data.json     # Main data file (created by setup)
│   ├── sample-data.json  # Alternative sample data
│   └── processed/        # For PDF processing
│
└── logs/                 # Log files (created by setup)
```

---

## 🎯 Next Steps

### 1. Explore the App

Once running, try:
- **Patient Selector** - Switch between Chiara and Causio
- **Trend Analysis** - See how lab values change over time
- **Correlations** - Find relationships between tests
- **Anomalies** - Detect unusual values
- **Predictions** - Forecast future values
- **Export** - Download your data

### 2. Add Your Own Data

**Option A: Use the UI**
1. Click "Add Lab Result"
2. Enter your data
3. Save

**Option B: Import JSON**
1. Create a JSON file with your data
2. Import through the app
3. See `data/sample-data.json` for format

**Option C: Process PDFs**
1. Get a free Gemini API key from https://makersuite.google.com/app/apikey
2. Add to `.env`: `GEMINI_API_KEY=your-key`
3. Place PDFs in `data/pdfs/`
4. Run: `npm run process:pdfs`

### 3. Enable AI Features (Optional)

While the app works perfectly without AI, you can enable:

**Get Free API Keys:**
- **Gemini** (Recommended): https://makersuite.google.com/app/apikey
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/

**Add to `.env`:**
```bash
GEMINI_API_KEY=your-key-here
# or
OPENAI_API_KEY=your-key-here
# or
ANTHROPIC_API_KEY=your-key-here
```

**AI Features You Get:**
- 💬 Ask questions about your lab results
- 📄 Auto-extract data from PDFs
- 📝 AI-generated summaries
- 💊 Medication analysis

---

## 🔒 Privacy & Security

- ✅ **All data stays local** - Nothing is sent to external servers
- ✅ **Works offline** - No internet connection required
- ✅ **No tracking** - No analytics or telemetry
- ✅ **Open source** - Code is fully transparent
- ✅ **API keys optional** - All features work without them

---

## 📚 Documentation

**Quick Guides:**
- `QUICKSTART.md` - 3-step quick start
- `STARTUP_GUIDE.md` - This file

**Full Documentation:**
- `README.md` - Complete feature overview
- `docs/` - Detailed guides for each feature
- `API_DOCUMENTATION.md` - API endpoints
- `TESTING_GUIDE.md` - Testing information

**AI Features:**
- `AI_README.md` - AI feature overview
- `AI_IMPLEMENTATION_SUMMARY.md` - Technical details
- `AI_FEATURES.md` - Feature descriptions

---

## 🆘 Getting Help

### Common Issues

1. **Setup fails**
   - Check Node.js version: `node -v` (need 18+)
   - Make sure you're in the project root
   - Try running setup again

2. **Server won't start**
   - Check if port 3000 is available
   - Check logs: `/tmp/analisi-tracker.log`
   - Verify `.env` file exists

3. **Data not showing**
   - Check `data/lab-data.json` exists
   - Verify JSON is valid
   - Check browser console for errors

### Support Resources

- Check the documentation in `docs/`
- Review troubleshooting in `QUICKSTART.md`
- Look at sample data in `data/`
- Check logs in `logs/` directory

---

## 🎉 Success!

Your analisi-tracker application is now running!

**URL:** http://localhost:3000

**Stop server:** Press `Ctrl+C` in terminal

**Start again:** Just run `./start.sh` (or `start.bat`)

**Update:** Run `./setup.sh` if you change dependencies

---

## 📝 Notes

- **First time?** Run setup first: `./setup.sh`
- **Subsequent times:** Just run start: `./start.sh`
- **Changed dependencies?** Run setup again
- **Need help?** Check `QUICKSTART.md` or `docs/`

Enjoy tracking your medical lab results! 🏥📊
