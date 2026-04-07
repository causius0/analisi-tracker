#!/bin/bash

# Medical PDF Processing System - Installation Script
# This script sets up the complete system for processing medical PDFs

set -e  # Exit on error

echo "================================================"
echo "🏥 Medical PDF Processing System - Installation"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node -v 2>/dev/null || echo "not installed")
echo "   Node.js: $NODE_VERSION"

if [[ "$NODE_VERSION" == "not installed" ]]; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Extract major version number
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')

if [[ $MAJOR_VERSION -lt 18 ]]; then
    echo -e "${RED}❌ Node.js 18+ is required. Current version: $NODE_VERSION${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version is compatible${NC}"
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}❌ package.json not found. Please run this script from the analisi-tracker directory.${NC}"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p data/processed
mkdir -p server/analytics
mkdir -p server/api
mkdir -p server/utils
mkdir -p client/src/components/patient-selector
mkdir -p client/src/components/data-import
mkdir -p client/src/services
mkdir -p client/src/pages
mkdir -p scripts
mkdir -p tests
mkdir -p docs

echo -e "${GREEN}✅ Directory structure created${NC}"
echo ""

# Check for Gemini API key
echo "🔑 Checking for GEMINI_API_KEY..."
if [[ -z "$GEMINI_API_KEY" ]]; then
    echo -e "${YELLOW}⚠️  GEMINI_API_KEY not found in environment${NC}"
    echo "   The system will use rule-based extraction (less accurate)"
    echo ""
    echo "   To enable AI extraction, get a free API key from:"
    echo "   https://ai.google.dev/"
    echo ""
    read -p "   Enter your GEMINI_API_KEY now (or press Enter to skip): " API_KEY

    if [[ -n "$API_KEY" ]]; then
        echo "export GEMINI_API_KEY=\"$API_KEY\"" >> ~/.bashrc
        echo "export GEMINI_API_KEY=\"$API_KEY\"" >> ~/.zshrc
        echo -e "${GREEN}✅ GEMINI_API_KEY saved to shell configuration${NC}"
        echo "   Please restart your terminal or run: source ~/.bashrc"
    else
        echo "   Skipping AI extraction setup..."
    fi
else
    echo -e "${GREEN}✅ GEMINI_API_KEY is set${NC}"
fi
echo ""

# Create .env file if it doesn't exist
if [[ ! -f ".env" ]]; then
    echo "📝 Creating .env file..."
    cat > .env <<EOF
# Medical PDF Processing System Configuration

# Source directory (PDFs to process)
SOURCE_DIR=/Users/causius/Documents/Documenti personali/Salute/Chiara analisi

# Output directory
OUTPUT_DIR=./data/processed

# Database file
DATABASE_FILE=./data/lab-data-complete.json

# Gemini API Key (optional but recommended)
GEMINI_API_KEY=\${GEMINI_API_KEY}

# OCR Configuration
OCR_LANGUAGE=ita+eng
CONFIDENCE_THRESHOLD=0.7

# Server Configuration
PORT=3000
NODE_ENV=development
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
fi
echo ""

# Update package.json scripts
echo "📜 Updating package.json scripts..."
# This is already done in the package.json file
echo -e "${GREEN}✅ Scripts configured${NC}"
echo ""

# Summary
echo "================================================"
echo "✨ Installation Complete!"
echo "================================================"
echo ""
echo "📚 Next Steps:"
echo ""
echo "1. Review the configuration:"
echo "   cat .env"
echo ""
echo "2. Place your medical PDFs in the source directory:"
echo "   ls /Users/causius/Documents/Documenti personali/Salute/Chiara analisi"
echo ""
echo "3. Process the PDFs:"
echo "   npm run process:pdfs"
echo ""
echo "4. View the results:"
echo "   cat data/lab-data-complete.json"
echo ""
echo "5. Check the quality report:"
echo "   ls -lt data/processed/report-*.json | head -1 | xargs cat"
echo ""
echo "📖 Documentation:"
echo "   docs/PDF_PROCESSING_GUIDE.md - Complete system guide"
echo "   docs/INSTALLATION.md - This installation guide"
echo ""
echo "🐛 Troubleshooting:"
echo "   - Extraction fails: Check PDF quality, try higher resolution scans"
echo "   - Wrong patient: Rename PDFs with patient name"
echo "   - Missing tests: Add reference ranges to server/utils/data-validator.js"
echo ""
echo "🔐 Security Reminder:"
echo "   - Medical data is sensitive. Keep lab-data-complete.json secure."
echo "   - Don't commit to public repositories."
echo "   - Consider encryption for production use."
echo ""
echo "================================================"
echo "✅ Ready to process medical PDFs!"
echo "================================================"
