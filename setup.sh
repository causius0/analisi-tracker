#!/bin/bash

# ============================================================================
# ANALISI TRACKER - SETUP SCRIPT
# ============================================================================
# One-time setup for Unix/Mac systems
# ============================================================================

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Analisi Tracker - Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Check Node.js installation
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo ""
    echo "Please install Node.js from: https://nodejs.org/"
    echo "Recommended version: 18.x or higher"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"

# Check if version is 18 or higher
NODE_MAJOR_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Warning: Node.js 18+ recommended (you have $NODE_VERSION)${NC}"
    echo "The app may still work, but consider upgrading for best compatibility."
fi

echo ""

# 2. Check npm installation
echo "📦 Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    echo "npm should be installed with Node.js. Please reinstall Node.js."
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm found: $NPM_VERSION${NC}"
echo ""

# 3. Create .env file if it doesn't exist
echo "🔧 Setting up environment configuration..."
if [ ! -f .env ]; then
    if [ -f .env.local ]; then
        echo "Creating .env from .env.local..."
        cp .env.local .env
        echo -e "${GREEN}✓ Created .env file${NC}"
    else
        echo "Creating .env from .env.example..."
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env file${NC}"
    fi
else
    echo -e "${BLUE}ℹ️  .env file already exists (skipping)${NC}"
fi
echo ""

# 4. Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p data/processed
mkdir -p logs
mkdir -p exports
echo -e "${GREEN}✓ Created directories${NC}"
echo ""

# 5. Install root dependencies
echo "📦 Installing root dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Root dependencies installed${NC}"
else
    echo -e "${BLUE}ℹ️  Root node_modules exists (skipping npm install)${NC}"
fi
echo ""

# 6. Install client dependencies
echo "📦 Installing client dependencies..."
if [ ! -d "client/node_modules" ]; then
    cd client
    npm install
    cd ..
    echo -e "${GREEN}✓ Client dependencies installed${NC}"
else
    echo -e "${BLUE}ℹ️  Client node_modules exists (skipping npm install)${NC}"
fi
echo ""

# 7. Initialize lab data
echo "📊 Initializing lab data..."
if [ ! -f "data/lab-data.json" ]; then
    if [ -f "data/lab-data-initial.json" ]; then
        echo "Creating lab-data.json with Chiara and Causio sample data..."
        cp data/lab-data-initial.json data/lab-data.json
        echo -e "${GREEN}✓ Created lab-data.json with sample patients${NC}"
    elif [ -f "data/sample-data.json" ]; then
        echo "Creating lab-data.json from sample data..."
        cp data/sample-data.json data/lab-data.json
        echo -e "${GREEN}✓ Created lab-data.json${NC}"
    else
        echo "Creating minimal lab-data.json..."
        cat > data/lab-data.json << 'EOF'
{
  "labTests": {},
  "context": {
    "medications": [],
    "events": []
  }
}
EOF
        echo -e "${GREEN}✓ Created minimal lab-data.json${NC}"
    fi
else
    echo -e "${BLUE}ℹ️  lab-data.json already exists (skipping)${NC}"
fi
echo ""

# 8. Validate data structure
echo "🔍 Validating data structure..."
if [ -f "data/lab-data.json" ]; then
    if node -e "JSON.parse(require('fs').readFileSync('data/lab-data.json', 'utf8'))" 2>/dev/null; then
        echo -e "${GREEN}✓ lab-data.json is valid JSON${NC}"
    else
        echo -e "${RED}❌ lab-data.json is not valid JSON!${NC}"
        echo "Please check the file manually."
        exit 1
    fi
fi
echo ""

# 9. Setup complete
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Review .env file (optional - all features work with defaults)"
echo "  2. Add API keys to .env if you want AI features (optional)"
echo "  3. Run: ./start.sh"
echo ""
echo "Your app will be available at: http://localhost:3000"
echo ""
echo "For more information, see QUICKSTART.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
